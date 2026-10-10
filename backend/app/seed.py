from pathlib import Path

from sqlalchemy.orm import Session

from app import models, schemas
from app.services import auth_service, import_service

SEED_DIR = Path(__file__).parent / "seed_data"

DEMO_USERNAME = "staff"
DEMO_PASSWORD = "upay2026"


def ensure_demo_user(db: Session) -> None:
    """A real, working account so the login screen isn't a dead end on first boot.
    Idempotent: safe to call on every startup."""
    existing = db.query(models.User).filter(models.User.username == DEMO_USERNAME).first()
    if existing:
        return
    user = models.User(
        username=DEMO_USERNAME,
        display_name="UPAY Fundraising Staff",
        password_hash=auth_service.hash_password(DEMO_PASSWORD),
    )
    db.add(user)
    db.commit()

# Order matters: Razorpay first (establishes clean identity + payment reference),
# then the UPAY sheet (phone-matched), then bank statements last (so they can
# corroborate against a reference/amount/date already on file).
SEED_FILES = [
    (models.SourceType.razorpay, "razorpay_export.csv"),
    (models.SourceType.sheet, "upay_sheet.csv"),
    (models.SourceType.bank, "bank_statement.csv"),
]


def load_demo_data(db: Session) -> list[schemas.ImportSummary]:
    summaries = []
    for source_type, filename in SEED_FILES:
        content = (SEED_DIR / filename).read_bytes()
        summaries.append(import_service.ingest_csv(db, source_type, filename, content))
    return summaries


def reset_all_data(db: Session) -> None:
    db.query(models.Draft).delete()
    db.query(models.ReviewItem).delete()
    db.query(models.DonorAlias).delete()
    db.query(models.RawRecord).delete()
    db.query(models.Donation).delete()
    db.query(models.Donor).delete()
    db.query(models.ImportBatch).delete()
    db.commit()
