from datetime import timedelta

from rapidfuzz import fuzz, process
from sqlalchemy.orm import Session

from app import models
from app.config import get_settings
from app.services.normalize import extract_reference_tokens

settings = get_settings()


def find_donor_via_transaction_corroboration(
    db: Session, record: models.RawRecord
) -> models.Donor | None:
    """For records with no email/phone (typically bank rows), see if an already-matched
    record shares amount + a close date + an overlapping reference token. If so, it's
    almost certainly the same transaction seen from another source - use that donor
    instead of guessing from a partial name fragment.
    """
    if record.amount is None or record.txn_date is None:
        return None
    record_tokens = extract_reference_tokens(record.reference)
    if not record_tokens:
        return None

    window = timedelta(days=settings.reconcile_date_window_days)
    candidates = (
        db.query(models.RawRecord)
        .filter(
            models.RawRecord.donor_id.is_not(None),
            models.RawRecord.id != record.id,
            models.RawRecord.amount == record.amount,
            models.RawRecord.is_invalid.is_(False),
        )
        .all()
    )
    for candidate in candidates:
        if not candidate.txn_date or abs((candidate.txn_date - record.txn_date).days) > window.days:
            continue
        if extract_reference_tokens(candidate.reference) & record_tokens:
            return db.get(models.Donor, candidate.donor_id)
    return None


def _candidate_donors(db: Session) -> list[models.Donor]:
    return (
        db.query(models.Donor)
        .filter(models.Donor.status == models.DonorStatus.active)
        .all()
    )


def _best_name_match(name: str, donors: list[models.Donor]) -> tuple[models.Donor, float] | None:
    if not name or not donors:
        return None
    choices = {d.id: d.display_name for d in donors}
    result = process.extractOne(name, choices, scorer=fuzz.WRatio)
    if result is None:
        return None
    _matched_name, score, donor_id = result
    donor = next(d for d in donors if d.id == donor_id)
    return donor, score


def match_or_create_donor(
    db: Session, record: models.RawRecord
) -> tuple[models.Donor, bool, models.ReviewItem | None]:
    """Resolve a raw record to a Donor. Returns (donor, was_newly_created, review_item_if_any)."""

    # 1. Exact email match is the strongest signal.
    if record.normalized_email:
        donor = (
            db.query(models.Donor)
            .filter(
                models.Donor.primary_email == record.normalized_email,
                models.Donor.status == models.DonorStatus.active,
            )
            .first()
        )
        if donor:
            _attach_alias(db, donor, record)
            return donor, False, None

    # 2. Exact phone match is next strongest.
    if record.normalized_phone:
        donor = (
            db.query(models.Donor)
            .filter(
                models.Donor.primary_phone == record.normalized_phone,
                models.Donor.status == models.DonorStatus.active,
            )
            .first()
        )
        if donor:
            _attach_alias(db, donor, record)
            if not donor.primary_email and record.normalized_email:
                donor.primary_email = record.normalized_email
            return donor, False, None

    # 3. Fuzzy name match against the existing donor pool.
    donors = _candidate_donors(db)
    best = _best_name_match(record.normalized_name or "", donors)

    if best is not None:
        candidate, score = best
        if score >= settings.dedupe_auto_merge_score:
            _attach_alias(db, candidate, record)
            if not candidate.primary_email and record.normalized_email:
                candidate.primary_email = record.normalized_email
            if not candidate.primary_phone and record.normalized_phone:
                candidate.primary_phone = record.normalized_phone
            return candidate, False, None

        if score >= settings.dedupe_review_score:
            new_donor = _create_donor(db, record)
            review_item = models.ReviewItem(
                type=models.ReviewItemType.possible_duplicate,
                title=f'Possible duplicate: "{candidate.display_name}" and "{new_donor.display_name}"',
                description=(
                    f'New record for "{new_donor.display_name}" is {score:.0f}% similar to existing '
                    f'donor "{candidate.display_name}" (id {candidate.id}). Confirm whether these are '
                    "the same person."
                ),
                payload={
                    "donor_a_id": candidate.id,
                    "donor_a_name": candidate.display_name,
                    "donor_b_id": new_donor.id,
                    "donor_b_name": new_donor.display_name,
                    "similarity": round(score, 1),
                },
            )
            db.add(review_item)
            db.flush()
            return new_donor, True, review_item

    # 4. No match at all: brand new donor.
    new_donor = _create_donor(db, record)
    return new_donor, True, None


def _create_donor(db: Session, record: models.RawRecord) -> models.Donor:
    donor = models.Donor(
        display_name=record.normalized_name or "Unknown Donor",
        primary_email=record.normalized_email,
        primary_phone=record.normalized_phone,
    )
    db.add(donor)
    db.flush()
    _attach_alias(db, donor, record)
    return donor


def attach_alias(db: Session, donor: models.Donor, record: models.RawRecord) -> None:
    _attach_alias(db, donor, record)


def _attach_alias(db: Session, donor: models.Donor, record: models.RawRecord) -> None:
    alias = models.DonorAlias(
        donor_id=donor.id,
        raw_record_id=record.id,
        name=record.raw_name,
        email=record.raw_email,
        phone=record.raw_phone,
        source=record.source_type,
    )
    db.add(alias)
    record.donor_id = donor.id
