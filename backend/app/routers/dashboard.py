from collections import defaultdict
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=schemas.DashboardOut)
def get_dashboard(db: Session = Depends(get_db)):
    donors = (
        db.query(models.Donor).filter(models.Donor.status == models.DonorStatus.active).all()
    )
    donations = (
        db.query(models.Donation)
        .filter(models.Donation.status == models.DonationStatus.reconciled)
        .all()
    )

    total_donors = len(donors)
    total_donations = len(donations)
    total_amount = sum(float(d.amount) for d in donations)

    by_donor: dict[int, list[models.Donation]] = defaultdict(list)
    for d in donations:
        by_donor[d.donor_id].append(d)

    donors_with_gifts = len(by_donor)
    recurring_count = 0
    at_risk_count = 0
    multi_gift_donors = 0

    today = date.today()
    for donor_id, gifts in by_donor.items():
        months = {(g.txn_date.year, g.txn_date.month) for g in gifts}
        if len(months) >= 2:
            recurring_count += 1
        if len(gifts) >= 2:
            multi_gift_donors += 1
        last_gift = max(g.txn_date for g in gifts)
        if (today - last_gift).days > 90 and len(gifts) >= 1:
            at_risk_count += 1

    retention_rate = (multi_gift_donors / donors_with_gifts * 100) if donors_with_gifts else 0.0

    pending_review_count = (
        db.query(models.ReviewItem)
        .filter(models.ReviewItem.status == models.ReviewItemStatus.open)
        .count()
    )
    pending_drafts_count = (
        db.query(models.Draft).filter(models.Draft.status == models.DraftStatus.draft).count()
    )

    monthly_totals: dict[str, float] = defaultdict(float)
    cutoff = today - timedelta(days=183)
    for d in donations:
        if d.txn_date >= cutoff:
            key = d.txn_date.strftime("%Y-%m")
            monthly_totals[key] += float(d.amount)

    monthly = [
        schemas.DashboardMonthly(month=k, amount=round(v, 2))
        for k, v in sorted(monthly_totals.items())
    ]

    return schemas.DashboardOut(
        total_donors=total_donors,
        total_donations=total_donations,
        total_amount=round(total_amount, 2),
        retention_rate=round(retention_rate, 1),
        recurring_count=recurring_count,
        at_risk_count=at_risk_count,
        pending_review_count=pending_review_count,
        pending_drafts_count=pending_drafts_count,
        monthly=monthly,
    )
