from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import schemas, seed
from app.database import get_db
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/seed", tags=["seed"], dependencies=[Depends(get_current_user)])


@router.post("/demo", response_model=list[schemas.ImportSummary])
def seed_demo(db: Session = Depends(get_db)):
    return seed.load_demo_data(db)


@router.post("/reset")
def reset(db: Session = Depends(get_db)):
    seed.reset_all_data(db)
    return {"status": "reset"}
