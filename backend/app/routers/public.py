from collections import defaultdict
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.services import persona_service
from app.services.impact_service import CAMPAIGN_UNITS, DEFAULT_UNIT

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


class CampaignImpact(BaseModel):
    campaign: str
    amount: float
    units: int
    label: str


class PersonaSlice(BaseModel):
    key: str
    label: str
    tone: str
    count: int


class MonthlyTotal(BaseModel):
    month: str
    amount: float


class ImpactWall(BaseModel):
    total_donors: int
    total_donations: int
    total_amount: float
    total_units: int
    total_unit_label: str
    campaigns: list[CampaignImpact]
    personas: list[PersonaSlice]
    monthly: list[MonthlyTotal]


@router.get("/impact-wall", response_model=ImpactWall)
def impact_wall(db: Session = Depends(get_db)):
    """Everything on this page is a real aggregate of reconciled gifts — no
    donor names, emails, or phone numbers are exposed here."""
    donors = db.query(models.Donor).filter(models.Donor.status == models.DonorStatus.active).all()
    donations = (
        db.query(models.Donation)
        .filter(models.Donation.status == models.DonationStatus.reconciled)
        .all()
    )

    total_amount = sum(float(d.amount) for d in donations)
    rate, singular, plural = DEFAULT_UNIT
    total_units = max(0, int(total_amount // rate))

    by_campaign: dict[str, float] = defaultdict(float)
    for d in donations:
        by_campaign[d.campaign or "General Fund"] += float(d.amount)

    campaigns = []
    for campaign, amount in sorted(by_campaign.items(), key=lambda kv: -kv[1]):
        c_rate, c_singular, c_plural = CAMPAIGN_UNITS.get(campaign, DEFAULT_UNIT)
        units = max(1, int(amount // c_rate))
        campaigns.append(
            CampaignImpact(
                campaign=campaign,
                amount=round(amount, 2),
                units=units,
                label=c_singular if units == 1 else c_plural,
            )
        )

    champion_totals = sorted(
        (
            sum(float(d.amount) for d in donor.donations if d.status == models.DonationStatus.reconciled)
            for donor in donors
        ),
        key=lambda v: v,
    )
    champion_totals = [t for t in champion_totals if t > 0]
    champion_threshold = (
        max(3000.0, champion_totals[min(len(champion_totals) - 1, int(len(champion_totals) * 0.85))])
        if champion_totals
        else 5000.0
    )

    persona_counts: dict[str, int] = defaultdict(int)
    persona_meta: dict[str, tuple[str, str]] = {}
    for donor in donors:
        p = persona_service.classify(donor.donations, champion_threshold=champion_threshold)
        persona_counts[p["key"]] += 1
        persona_meta[p["key"]] = (p["label"], p["tone"])

    personas = [
        PersonaSlice(key=key, label=persona_meta[key][0], tone=persona_meta[key][1], count=count)
        for key, count in sorted(persona_counts.items(), key=lambda kv: -kv[1])
    ]

    monthly_totals: dict[str, float] = defaultdict(float)
    cutoff = date.today() - timedelta(days=183)
    for d in donations:
        if d.txn_date >= cutoff:
            monthly_totals[d.txn_date.strftime("%Y-%m")] += float(d.amount)
    monthly = [
        MonthlyTotal(month=k, amount=round(v, 2)) for k, v in sorted(monthly_totals.items())
    ]

    return ImpactWall(
        total_donors=len(donors),
        total_donations=len(donations),
        total_amount=round(total_amount, 2),
        total_units=total_units,
        total_unit_label=singular if total_units == 1 else plural,
        campaigns=campaigns,
        personas=personas,
        monthly=monthly,
    )
