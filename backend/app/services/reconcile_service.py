from datetime import timedelta

from sqlalchemy.orm import Session

from app import models
from app.config import get_settings
from app.services.normalize import extract_reference_tokens

settings = get_settings()


def reconcile_record(
    db: Session, record: models.RawRecord
) -> tuple[models.Donation | None, models.ReviewItem | None, bool]:
    """Try to fold a raw record into a reconciled Donation.

    Returns (donation_or_none, review_item_or_none, draft_was_queued).
    """
    if record.donor_id is None or record.amount is None or record.txn_date is None:
        return None, None, False

    window = timedelta(days=settings.reconcile_date_window_days)
    record_tokens = extract_reference_tokens(record.reference)

    # 1. Does this match an already-reconciled Donation for the same donor?
    existing = (
        db.query(models.Donation)
        .filter(
            models.Donation.donor_id == record.donor_id,
            models.Donation.amount == record.amount,
        )
        .all()
    )
    for donation in existing:
        if abs((donation.txn_date - record.txn_date).days) <= window.days:
            donation.source_count += 1
            if donation.status != models.DonationStatus.reconciled:
                donation.status = models.DonationStatus.reconciled
            record.donation_id = donation.id
            record.match_status = models.MatchStatus.matched
            return donation, None, False

    # 2. Does this corroborate another still-unlinked raw record for the same donor?
    candidates = (
        db.query(models.RawRecord)
        .filter(
            models.RawRecord.donor_id == record.donor_id,
            models.RawRecord.donation_id.is_(None),
            models.RawRecord.id != record.id,
            models.RawRecord.amount == record.amount,
            models.RawRecord.is_invalid.is_(False),
        )
        .all()
    )
    close_candidates = [
        c for c in candidates if c.txn_date and abs((c.txn_date - record.txn_date).days) <= window.days
    ]
    if close_candidates:
        chosen = None
        for c in close_candidates:
            if extract_reference_tokens(c.reference) & record_tokens:
                chosen = c
                break
        if chosen is None:
            chosen = close_candidates[0]

        donation = models.Donation(
            donor_id=record.donor_id,
            campaign=record.campaign or chosen.campaign,
            amount=record.amount,
            txn_date=min(record.txn_date, chosen.txn_date),
            reference=record.reference or chosen.reference,
            status=models.DonationStatus.reconciled,
            source_count=2,
        )
        db.add(donation)
        db.flush()
        record.donation_id = donation.id
        record.match_status = models.MatchStatus.matched
        chosen.donation_id = donation.id
        chosen.match_status = models.MatchStatus.matched
        return donation, None, True

    # 3. No corroboration found yet.
    if record.source_type == models.SourceType.bank:
        review_item = models.ReviewItem(
            type=models.ReviewItemType.unmatched_bank_credit,
            title=f"Unmatched bank credit: {_fmt_amount(record.amount)} on {record.txn_date}",
            description=(
                f"A bank credit of {_fmt_amount(record.amount)} on {record.txn_date} "
                f"(ref {record.reference or 'unknown'}) has no matching donor record yet."
            ),
            payload={
                "raw_record_id": record.id,
                "amount": float(record.amount),
                "txn_date": str(record.txn_date),
                "reference": record.reference,
            },
        )
        db.add(review_item)
        db.flush()
        record.match_status = models.MatchStatus.needs_review
        return None, review_item, False

    if record.source_type == models.SourceType.razorpay:
        # A gateway-confirmed payment is trustworthy on its own.
        donation = models.Donation(
            donor_id=record.donor_id,
            campaign=record.campaign,
            amount=record.amount,
            txn_date=record.txn_date,
            reference=record.reference,
            status=models.DonationStatus.reconciled,
            source_count=1,
        )
        db.add(donation)
        db.flush()
        record.donation_id = donation.id
        record.match_status = models.MatchStatus.matched
        return donation, None, True

    # A standalone sheet/manual entry waits for a corroborating payment record.
    donation = models.Donation(
        donor_id=record.donor_id,
        campaign=record.campaign,
        amount=record.amount,
        txn_date=record.txn_date,
        reference=record.reference,
        status=models.DonationStatus.pending_review,
        source_count=1,
    )
    db.add(donation)
    db.flush()
    record.donation_id = donation.id
    record.match_status = models.MatchStatus.matched
    return donation, None, False


def _fmt_amount(amount) -> str:
    return f"₹{float(amount):,.0f}"
