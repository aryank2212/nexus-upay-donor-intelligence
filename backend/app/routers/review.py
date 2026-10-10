from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/review-queue", tags=["review"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[schemas.ReviewItemOut])
def list_review_items(db: Session = Depends(get_db)):
    return (
        db.query(models.ReviewItem)
        .filter(models.ReviewItem.status == models.ReviewItemStatus.open)
        .order_by(models.ReviewItem.created_at.desc())
        .all()
    )


def _merge_donors(db: Session, keep_id: int, drop_id: int) -> None:
    if keep_id == drop_id:
        return
    keep = db.get(models.Donor, keep_id)
    drop = db.get(models.Donor, drop_id)
    if not keep or not drop:
        raise HTTPException(404, "Donor not found")

    db.query(models.Donation).filter(models.Donation.donor_id == drop.id).update(
        {"donor_id": keep.id}
    )
    db.query(models.DonorAlias).filter(models.DonorAlias.donor_id == drop.id).update(
        {"donor_id": keep.id}
    )
    db.query(models.RawRecord).filter(models.RawRecord.donor_id == drop.id).update(
        {"donor_id": keep.id}
    )
    if not keep.primary_email and drop.primary_email:
        keep.primary_email = drop.primary_email
    if not keep.primary_phone and drop.primary_phone:
        keep.primary_phone = drop.primary_phone

    drop.status = models.DonorStatus.merged
    drop.merged_into_id = keep.id


@router.post("/{item_id}/resolve", response_model=schemas.ReviewItemOut)
def resolve_review_item(item_id: int, body: schemas.ReviewResolveIn, db: Session = Depends(get_db)):
    item = db.get(models.ReviewItem, item_id)
    if not item:
        raise HTTPException(404, "Review item not found")
    if item.status == models.ReviewItemStatus.resolved:
        raise HTTPException(400, "Review item already resolved")

    if item.type == models.ReviewItemType.possible_duplicate:
        if body.action == "merge":
            _merge_donors(
                db, item.payload["donor_a_id"], item.payload["donor_b_id"]
            )
            item.resolution = models.ReviewResolution.merge
        elif body.action == "not_same":
            item.resolution = models.ReviewResolution.not_same
        else:
            raise HTTPException(400, "Action must be 'merge' or 'not_same'")
    elif item.type == models.ReviewItemType.unmatched_bank_credit:
        if body.action != "resolved":
            raise HTTPException(400, "Action must be 'resolved'")
        item.resolution = models.ReviewResolution.resolved
    elif item.type == models.ReviewItemType.import_error:
        if body.action != "fixed":
            raise HTTPException(400, "Action must be 'fixed'")
        item.resolution = models.ReviewResolution.fixed
    else:
        raise HTTPException(400, "Unknown review item type")

    item.status = models.ReviewItemStatus.resolved
    item.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return item
