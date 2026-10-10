from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services import import_service
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/imports", tags=["imports"], dependencies=[Depends(get_current_user)])


@router.post("", response_model=schemas.ImportSummary)
async def create_import(
    source_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    try:
        source = models.SourceType(source_type)
    except ValueError:
        raise HTTPException(400, f"Unknown source_type '{source_type}'")

    content = await file.read()
    return import_service.ingest_csv(db, source, file.filename or "upload.csv", content)


@router.get("", response_model=list[schemas.ImportSummary])
def list_imports(db: Session = Depends(get_db)):
    batches = db.query(models.ImportBatch).order_by(models.ImportBatch.imported_at.desc()).all()
    out = []
    for b in batches:
        donors_created = sum(1 for r in b.records if r.match_status != models.MatchStatus.needs_review)
        out.append(
            schemas.ImportSummary(
                batch_id=b.id,
                source_type=b.source_type.value,
                filename=b.filename,
                row_count=b.row_count,
                error_count=b.error_count,
                donors_created=0,
                donors_matched=donors_created,
                donations_reconciled=0,
                review_items_created=0,
            )
        )
    return out


@router.get("/{batch_id}/rows")
def list_import_rows(batch_id: int, db: Session = Depends(get_db)):
    records = (
        db.query(models.RawRecord).filter(models.RawRecord.batch_id == batch_id).all()
    )
    return [
        {
            "id": r.id,
            "raw_name": r.raw_name,
            "amount": float(r.amount) if r.amount is not None else None,
            "txn_date": str(r.txn_date) if r.txn_date else None,
            "is_invalid": r.is_invalid,
            "invalid_reason": r.invalid_reason,
            "match_status": r.match_status.value,
            "donor_id": r.donor_id,
            "donation_id": r.donation_id,
        }
        for r in records
    ]
