from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session as DbSession

from app import models, schemas
from app.database import get_db
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=schemas.AuthOut)
def register(body: schemas.RegisterIn, db: DbSession = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.username == body.username).first()
    if existing:
        raise HTTPException(409, "That username is already taken")

    user = models.User(
        username=body.username,
        display_name=body.display_name,
        password_hash=auth_service.hash_password(body.password),
    )
    db.add(user)
    db.flush()
    token = auth_service.issue_session(db, user)
    db.commit()
    db.refresh(user)
    return schemas.AuthOut(token=token, user=schemas.UserOut.model_validate(user))


@router.post("/login", response_model=schemas.AuthOut)
def login(body: schemas.LoginIn, db: DbSession = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == body.username).first()
    if not user or not auth_service.verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Incorrect username or password")

    token = auth_service.issue_session(db, user)
    db.commit()
    return schemas.AuthOut(token=token, user=schemas.UserOut.model_validate(user))


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(auth_service.get_current_user)):
    return current_user


@router.post("/logout")
def logout(authorization: str | None = Header(default=None), db: DbSession = Depends(get_db)):
    if authorization and authorization.lower().startswith("bearer "):
        auth_service.revoke_session(db, authorization.split(" ", 1)[1].strip())
    return {"status": "logged_out"}
