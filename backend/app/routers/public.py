from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models
from app.database import get_db

router = APIRouter(prefix="/api/public", tags=["public"])


class PublicStats(BaseModel):
    total_donors: int
    total_donations: int
    total_amount: float


@router.get("/stats", response_model=PublicStats)
def public_stats(db: Session = Depends(get_db)):
    """Non-sensitive aggregate counts only — no donor PII — for the public landing page."""
    total_donors = (
        db.query(models.Donor).filter(models.Donor.status == models.DonorStatus.active).count()
    )
    donations = (
        db.query(models.Donation)
        .filter(models.Donation.status == models.DonationStatus.reconciled)
        .all()
    )
    total_amount = sum(float(d.amount) for d in donations)
    return PublicStats(
        total_donors=total_donors, total_donations=len(donations), total_amount=round(total_amount, 2)
    )
