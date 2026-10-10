from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    display_name: str
    role: str
    created_at: datetime


class RegisterIn(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=6, max_length=128)
    display_name: str = Field(min_length=1, max_length=255)


class LoginIn(BaseModel):
    username: str
    password: str


class AuthOut(BaseModel):
    token: str
    user: UserOut


class ContactIn(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: str = Field(min_length=3, max_length=255)
    message: str = Field(min_length=1, max_length=4000)


class ContactOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    message: str
    created_at: datetime


class DonorAliasOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str | None
    email: str | None
    phone: str | None
    source: str


class DonationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    campaign: str | None
    amount: float
    txn_date: date
    reference: str | None
    status: str
    source_count: int
    acknowledgement_status: str


class DonorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    display_name: str
    primary_email: str | None
    primary_phone: str | None
    status: str
    created_at: datetime


class DonorDetailOut(DonorOut):
    aliases: list[DonorAliasOut]
    donations: list[DonationOut]
    total_given: float
    donation_count: int


class ImportSummary(BaseModel):
    batch_id: int
    source_type: str
    filename: str
    row_count: int
    error_count: int
    donors_created: int
    donors_matched: int
    donations_reconciled: int
    review_items_created: int


class ReviewItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    type: str
    status: str
    title: str
    description: str
    payload: dict
    resolution: str | None = None
    created_at: datetime
    resolved_at: datetime | None = None


class ReviewResolveIn(BaseModel):
    action: str  # merge | not_same | resolved | fixed


class DraftOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    donor_id: int | None
    donation_id: int | None
    kind: str
    status: str
    subject: str
    body: str
    sources: list
    generated_by: str
    created_at: datetime


class DraftGenerateIn(BaseModel):
    donor_id: int
    donation_id: int | None = None
    kind: str = "thank_you"


class DashboardMonthly(BaseModel):
    month: str
    amount: float


class DashboardOut(BaseModel):
    total_donors: int
    total_donations: int
    total_amount: float
    retention_rate: float
    recurring_count: int
    at_risk_count: int
    pending_review_count: int
    pending_drafts_count: int
    monthly: list[DashboardMonthly]
