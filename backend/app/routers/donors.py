from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/donors", tags=["donors"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[schemas.DonorOut])
def list_donors(
    q: str | None = Query(None), db: Session = Depends(get_db), limit: int = 100
):
    query = db.query(models.Donor).filter(models.Donor.status == models.DonorStatus.active)
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                models.Donor.display_name.ilike(like),
                models.Donor.primary_email.ilike(like),
                models.Donor.primary_phone.ilike(like),
            )
        )
    return query.order_by(models.Donor.display_name).limit(limit).all()


@router.get("/{donor_id}", response_model=schemas.DonorDetailOut)
def get_donor(donor_id: int, db: Session = Depends(get_db)):
    donor = db.get(models.Donor, donor_id)
    if not donor:
        raise HTTPException(404, "Donor not found")
    total_given = sum(float(d.amount) for d in donor.donations)
    return schemas.DonorDetailOut(
        id=donor.id,
        display_name=donor.display_name,
        primary_email=donor.primary_email,
        primary_phone=donor.primary_phone,
        status=donor.status.value,
        created_at=donor.created_at,
        aliases=donor.aliases,
        donations=donor.donations,
        total_given=total_given,
        donation_count=len(donor.donations),
    )
