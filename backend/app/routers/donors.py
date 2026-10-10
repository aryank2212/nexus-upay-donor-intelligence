from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services import persona_service
from app.services.auth_service import get_current_user
from app.services.impact_service import DEFAULT_UNIT, impact_for_amount

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


def _champion_threshold(db: Session) -> float:
    donors = db.query(models.Donor).filter(models.Donor.status == models.DonorStatus.active).all()
    totals = sorted(
        sum(float(d.amount) for d in donor.donations if d.status == models.DonationStatus.reconciled)
        for donor in donors
    )
    totals = [t for t in totals if t > 0]
    if not totals:
        return 5000.0
    idx = min(len(totals) - 1, int(len(totals) * 0.85))
    return max(3000.0, totals[idx])


@router.get("/{donor_id}", response_model=schemas.DonorDetailOut)
def get_donor(donor_id: int, db: Session = Depends(get_db)):
    donor = db.get(models.Donor, donor_id)
    if not donor:
        raise HTTPException(404, "Donor not found")

    total_given = sum(float(d.amount) for d in donor.donations)
    persona = persona_service.classify(donor.donations, champion_threshold=_champion_threshold(db))

    donations_out = []
    for d in donor.donations:
        impact = impact_for_amount(float(d.amount), d.campaign) if d.status == models.DonationStatus.reconciled else None
        donations_out.append(
            schemas.DonationOut(
                id=d.id,
                campaign=d.campaign,
                amount=float(d.amount),
                txn_date=d.txn_date,
                reference=d.reference,
                status=d.status.value,
                source_count=d.source_count,
                acknowledgement_status=d.acknowledgement_status.value,
                impact=schemas.ImpactOut(**impact) if impact else None,
            )
        )

    total_impact = None
    if total_given > 0:
        rate, singular, plural = DEFAULT_UNIT
        units = max(1, int(total_given // rate))
        total_impact = schemas.ImpactOut(
            units=units,
            label=singular if units == 1 else plural,
            rate=rate,
            sentence=f"≈ {units} {singular if units == 1 else plural} funded lifetime",
        )

    return schemas.DonorDetailOut(
        id=donor.id,
        display_name=donor.display_name,
        primary_email=donor.primary_email,
        primary_phone=donor.primary_phone,
        status=donor.status.value,
        created_at=donor.created_at,
        aliases=donor.aliases,
        donations=donations_out,
        total_given=total_given,
        donation_count=len(donor.donations),
        persona=schemas.PersonaOut(**persona),
        total_impact=total_impact,
    )
