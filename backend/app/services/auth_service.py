import hashlib
import secrets
from datetime import datetime, timedelta

import bcrypt
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session as DbSession

from app import models
from app.database import get_db

SESSION_LIFETIME = timedelta(days=7)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def issue_session(db: DbSession, user: models.User) -> str:
    raw_token = secrets.token_urlsafe(32)
    session = models.Session(
        user_id=user.id,
        token_hash=_hash_token(raw_token),
        expires_at=datetime.utcnow() + SESSION_LIFETIME,
    )
    db.add(session)
    db.flush()
    return raw_token


def revoke_session(db: DbSession, raw_token: str) -> None:
    token_hash = _hash_token(raw_token)
    db.query(models.Session).filter(models.Session.token_hash == token_hash).delete()
    db.commit()


def get_current_user(
    authorization: str | None = Header(default=None),
    db: DbSession = Depends(get_db),
) -> models.User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Not authenticated")
    raw_token = authorization.split(" ", 1)[1].strip()
    token_hash = _hash_token(raw_token)

    session = (
        db.query(models.Session).filter(models.Session.token_hash == token_hash).first()
    )
    if not session or session.expires_at < datetime.utcnow():
        raise HTTPException(401, "Session expired or invalid")

    user = db.get(models.User, session.user_id)
    if not user:
        raise HTTPException(401, "User not found")
    return user
