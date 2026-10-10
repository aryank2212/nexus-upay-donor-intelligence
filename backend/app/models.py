import enum
from datetime import date, datetime

from sqlalchemy import (
    JSON,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SourceType(str, enum.Enum):
    razorpay = "razorpay"
    bank = "bank"
    sheet = "sheet"


class DonorStatus(str, enum.Enum):
    active = "active"
    merged = "merged"


class MatchStatus(str, enum.Enum):
    pending = "pending"
    matched = "matched"
    needs_review = "needs_review"


class DonationStatus(str, enum.Enum):
    reconciled = "reconciled"
    pending_review = "pending_review"


class AckStatus(str, enum.Enum):
    none = "none"
    queued = "queued"
    sent = "sent"


class ReviewItemType(str, enum.Enum):
    possible_duplicate = "possible_duplicate"
    unmatched_bank_credit = "unmatched_bank_credit"
    import_error = "import_error"


class ReviewItemStatus(str, enum.Enum):
    open = "open"
    resolved = "resolved"


class ReviewResolution(str, enum.Enum):
    merge = "merge"
    not_same = "not_same"
    resolved = "resolved"
    fixed = "fixed"


class DraftKind(str, enum.Enum):
    thank_you = "thank_you"
    update = "update"
    alert = "alert"


class DraftChannel(str, enum.Enum):
    whatsapp = "whatsapp"
    email = "email"


class DraftStatus(str, enum.Enum):
    draft = "draft"
    approved = "approved"
    sent = "sent"


class Donor(Base):
    __tablename__ = "donors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    display_name: Mapped[str] = mapped_column(String(255))
    primary_email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    primary_phone: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    status: Mapped[DonorStatus] = mapped_column(Enum(DonorStatus), default=DonorStatus.active)
    merged_into_id: Mapped[int | None] = mapped_column(ForeignKey("donors.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    aliases: Mapped[list["DonorAlias"]] = relationship(
        back_populates="donor", foreign_keys="DonorAlias.donor_id"
    )
    donations: Mapped[list["Donation"]] = relationship(back_populates="donor")


class DonorAlias(Base):
    """A raw name/email/phone variant seen for a donor, captured from one source row."""

    __tablename__ = "donor_aliases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    donor_id: Mapped[int | None] = mapped_column(ForeignKey("donors.id"), nullable=True, index=True)
    raw_record_id: Mapped[int | None] = mapped_column(ForeignKey("raw_records.id"), nullable=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    source: Mapped[SourceType] = mapped_column(Enum(SourceType))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    donor: Mapped["Donor"] = relationship(back_populates="aliases", foreign_keys=[donor_id])


class ImportBatch(Base):
    __tablename__ = "import_batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_type: Mapped[SourceType] = mapped_column(Enum(SourceType))
    filename: Mapped[str] = mapped_column(String(255))
    imported_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    error_count: Mapped[int] = mapped_column(Integer, default=0)

    records: Mapped[list["RawRecord"]] = relationship(back_populates="batch")


class RawRecord(Base):
    """A single row ingested from a CSV, before dedupe/reconciliation collapses it."""

    __tablename__ = "raw_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("import_batches.id"))
    source_type: Mapped[SourceType] = mapped_column(Enum(SourceType))

    raw_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    raw_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    raw_phone: Mapped[str | None] = mapped_column(String(64), nullable=True)

    normalized_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    normalized_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    normalized_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)

    amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    txn_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    campaign: Mapped[str | None] = mapped_column(String(255), nullable=True)

    is_invalid: Mapped[bool] = mapped_column(default=False)
    invalid_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)

    donor_id: Mapped[int | None] = mapped_column(ForeignKey("donors.id"), nullable=True)
    donation_id: Mapped[int | None] = mapped_column(ForeignKey("donations.id"), nullable=True)
    match_status: Mapped[MatchStatus] = mapped_column(Enum(MatchStatus), default=MatchStatus.pending)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    batch: Mapped["ImportBatch"] = relationship(back_populates="records")


class Donation(Base):
    """A canonical, reconciled gift — may be backed by multiple RawRecords across sources."""

    __tablename__ = "donations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    donor_id: Mapped[int] = mapped_column(ForeignKey("donors.id"), index=True)
    campaign: Mapped[str | None] = mapped_column(String(255), nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    txn_date: Mapped[date] = mapped_column(Date)
    reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[DonationStatus] = mapped_column(Enum(DonationStatus), default=DonationStatus.pending_review)
    source_count: Mapped[int] = mapped_column(Integer, default=1)
    acknowledgement_status: Mapped[AckStatus] = mapped_column(Enum(AckStatus), default=AckStatus.none)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    donor: Mapped["Donor"] = relationship(back_populates="donations")


class ReviewItem(Base):
    __tablename__ = "review_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    type: Mapped[ReviewItemType] = mapped_column(Enum(ReviewItemType))
    status: Mapped[ReviewItemStatus] = mapped_column(Enum(ReviewItemStatus), default=ReviewItemStatus.open)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    resolution: Mapped[ReviewResolution | None] = mapped_column(Enum(ReviewResolution), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class Draft(Base):
    """An AI Copilot draft — also doubles as the automation log (nothing sends unapproved)."""

    __tablename__ = "drafts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    donor_id: Mapped[int | None] = mapped_column(ForeignKey("donors.id"), nullable=True)
    donation_id: Mapped[int | None] = mapped_column(ForeignKey("donations.id"), nullable=True)
    kind: Mapped[DraftKind] = mapped_column(Enum(DraftKind), default=DraftKind.thank_you)
    channel: Mapped[DraftChannel] = mapped_column(Enum(DraftChannel), default=DraftChannel.email)
    status: Mapped[DraftStatus] = mapped_column(Enum(DraftStatus), default=DraftStatus.draft)
    subject: Mapped[str] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(Text)
    sources: Mapped[list] = mapped_column(JSON, default=list)
    generated_by: Mapped[str] = mapped_column(String(32), default="template")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    donor: Mapped["Donor"] = relationship()
    donation: Mapped["Donation"] = relationship()


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), default="staff")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime)

    user: Mapped["User"] = relationship()


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
