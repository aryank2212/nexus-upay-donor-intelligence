from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services import anomaly_service, urgency_service
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/insights", tags=["insights"], dependencies=[Depends(get_current_user)])


@router.get("/anomalies", response_model=list[schemas.AnomalyOut])
def anomalies(db: Session = Depends(get_db)):
    findings = anomaly_service.scan(db)
    return [
        schemas.AnomalyOut(
            type=f["type"],
            title=f["title"],
            description=f["description"],
            donor_ids=f.get("donor_ids") or ([f["donor_id"]] if "donor_id" in f else []),
        )
        for f in findings
    ]


@router.get("/at-risk", response_model=list[schemas.AtRiskDonorOut])
def at_risk(db: Session = Depends(get_db), limit: int = 10):
    donors = db.query(models.Donor).filter(models.Donor.status == models.DonorStatus.active).all()
    pairs = [(d, d.donations) for d in donors]
    ranked = urgency_service.rank_at_risk(pairs)
    return [schemas.AtRiskDonorOut(**r) for r in ranked[:limit]]
