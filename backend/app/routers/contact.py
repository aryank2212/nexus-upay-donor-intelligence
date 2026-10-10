from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DbSession

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/api/contact", tags=["contact"])


@router.post("", response_model=schemas.ContactOut)
def submit_contact(body: schemas.ContactIn, db: DbSession = Depends(get_db)):
    message = models.ContactMessage(name=body.name, email=body.email, message=body.message)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
