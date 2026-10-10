from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services import copilot_service
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/copilot", tags=["copilot"], dependencies=[Depends(get_current_user)])


@router.get("/drafts", response_model=list[schemas.DraftOut])
def list_drafts(status: str | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Draft)
    if status:
        query = query.filter(models.Draft.status == models.DraftStatus(status))
    return query.order_by(models.Draft.created_at.desc()).all()


@router.post("/drafts", response_model=schemas.DraftOut)
def generate_draft(body: schemas.DraftGenerateIn, db: Session = Depends(get_db)):
    donor = db.get(models.Donor, body.donor_id)
    if not donor:
        raise HTTPException(404, "Donor not found")
    donation = db.get(models.Donation, body.donation_id) if body.donation_id else None
    draft = copilot_service.generate_draft(db, donor, donation, kind=body.kind)
    db.commit()
    db.refresh(draft)
    return draft


@router.post("/drafts/{draft_id}/approve", response_model=schemas.DraftOut)
def approve_draft(draft_id: int, db: Session = Depends(get_db)):
    draft = db.get(models.Draft, draft_id)
    if not draft:
        raise HTTPException(404, "Draft not found")
    draft.status = models.DraftStatus.sent
    draft.approved_at = datetime.utcnow()
    if draft.donation:
        draft.donation.acknowledgement_status = models.AckStatus.sent
    db.commit()
    db.refresh(draft)
    return draft
