import csv
import io
from datetime import datetime

from sqlalchemy.orm import Session

from app import models, schemas
from app.services import copilot_service, dedupe_service, reconcile_service
from app.services.normalize import (
    normalize_amount,
    normalize_email,
    normalize_name,
    normalize_phone,
)

DATE_FORMATS = ["%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%d %b %Y"]


def _parse_date(raw: str | None):
    if not raw:
        return None
    raw = raw.strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    return None


def _parse_razorpay_row(row: dict) -> dict:
    return {
        "raw_name": row.get("name"),
        "raw_email": row.get("email"),
        "raw_phone": row.get("phone"),
        "raw_amount": row.get("amount"),
        "raw_date": row.get("date"),
        "reference": row.get("payment_id"),
        "campaign": row.get("campaign"),
    }


def _parse_bank_row(row: dict) -> dict:
    narration = row.get("narration", "") or ""
    parts = [p.strip() for p in narration.split("/")]
    reference = parts[1] if len(parts) > 1 else None
    name_fragment = parts[2] if len(parts) > 2 else None
    return {
        "raw_name": name_fragment,
        "raw_email": None,
        "raw_phone": None,
        "raw_amount": row.get("amount"),
        "raw_date": row.get("txn_date"),
        "reference": reference,
        "campaign": None,
    }


def _parse_sheet_row(row: dict) -> dict:
    return {
        "raw_name": row.get("name"),
        "raw_email": None,
        "raw_phone": row.get("phone"),
        "raw_amount": row.get("amount"),
        "raw_date": row.get("date"),
        "reference": None,
        "campaign": row.get("campaign"),
    }


PARSERS = {
    models.SourceType.razorpay: _parse_razorpay_row,
    models.SourceType.bank: _parse_bank_row,
    models.SourceType.sheet: _parse_sheet_row,
}


def ingest_csv(
    db: Session, source_type: models.SourceType, filename: str, content: bytes
) -> schemas.ImportSummary:
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    parser = PARSERS[source_type]

    batch = models.ImportBatch(source_type=source_type, filename=filename)
    db.add(batch)
    db.flush()

    donors_created = 0
    donors_matched = 0
    donations_reconciled = 0
    review_items_created = 0
    row_count = 0
    error_count = 0

    for row in reader:
        row_count += 1
        parsed = parser(row)

        normalized_name = normalize_name(parsed["raw_name"])
        normalized_email = normalize_email(parsed["raw_email"])
        normalized_phone = normalize_phone(parsed["raw_phone"])
        amount = normalize_amount(parsed["raw_amount"])
        txn_date = _parse_date(parsed["raw_date"])

        is_invalid = False
        invalid_reason = None

        raw_phone = parsed["raw_phone"]
        if raw_phone and (normalized_phone is None or len(normalized_phone) != 10):
            is_invalid = True
            invalid_reason = "invalid phone number"
        elif amount is None:
            is_invalid = True
            invalid_reason = "invalid or missing amount"
        elif txn_date is None:
            is_invalid = True
            invalid_reason = "invalid or missing date"
        elif not normalized_name:
            is_invalid = True
            invalid_reason = "missing donor name"

        record = models.RawRecord(
            batch_id=batch.id,
            source_type=source_type,
            raw_name=parsed["raw_name"],
            raw_email=parsed["raw_email"],
            raw_phone=parsed["raw_phone"],
            normalized_name=normalized_name,
            normalized_email=normalized_email,
            normalized_phone=normalized_phone,
            amount=amount,
            txn_date=txn_date,
            reference=parsed["reference"],
            campaign=parsed["campaign"],
            is_invalid=is_invalid,
            invalid_reason=invalid_reason,
        )
        db.add(record)
        db.flush()

        if is_invalid:
            error_count += 1
            record.match_status = models.MatchStatus.needs_review
            continue

        donor = None
        created = False
        review_item = None

        if not normalized_email and not normalized_phone:
            donor = dedupe_service.find_donor_via_transaction_corroboration(db, record)
            if donor:
                dedupe_service.attach_alias(db, donor, record)

        if donor is None:
            donor, created, review_item = dedupe_service.match_or_create_donor(db, record)

        if created:
            donors_created += 1
        else:
            donors_matched += 1
        if review_item:
            review_items_created += 1

        donation, review_item2, draft_queued = reconcile_service.reconcile_record(db, record)
        if review_item2:
            review_items_created += 1
        if donation and donation.status == models.DonationStatus.reconciled:
            donations_reconciled += 1
        if draft_queued and donation:
            copilot_service.generate_draft(db, donor, donation, kind="thank_you")

    batch.row_count = row_count
    batch.error_count = error_count

    if error_count > 0:
        bad_records = (
            db.query(models.RawRecord)
            .filter(models.RawRecord.batch_id == batch.id, models.RawRecord.is_invalid.is_(True))
            .all()
        )
        reasons = {}
        for r in bad_records:
            reasons[r.invalid_reason] = reasons.get(r.invalid_reason, 0) + 1
        reason_text = ", ".join(f"{count} rows: {reason}" for reason, count in reasons.items())
        review_item = models.ReviewItem(
            type=models.ReviewItemType.import_error,
            title=f"Import needs fixing: {filename}",
            description=f"{reason_text}.",
            payload={
                "batch_id": batch.id,
                "row_ids": [r.id for r in bad_records],
            },
        )
        db.add(review_item)
        review_items_created += 1

    db.commit()

    return schemas.ImportSummary(
        batch_id=batch.id,
        source_type=source_type.value,
        filename=filename,
        row_count=row_count,
        error_count=error_count,
        donors_created=donors_created,
        donors_matched=donors_matched,
        donations_reconciled=donations_reconciled,
        review_items_created=review_items_created,
    )
