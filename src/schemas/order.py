import re
import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from src.models.order import OrderStatus

_DIGITS = re.compile(r"\D")


class OrderCreate(BaseModel):
    whatsapp: str = Field(min_length=10, max_length=20)
    cep: str = Field(min_length=8, max_length=9)
    city: str = Field(min_length=1, max_length=120)
    state: str = Field(min_length=2, max_length=2)
    address_line: str | None = Field(default=None, max_length=255)
    environments: str = Field(min_length=1, max_length=300)
    furniture_types: str | None = Field(default=None, max_length=500)
    observations: str | None = Field(default=None, max_length=2000)
    # Honored only for admin-created orders (see services.order.create_order).
    client_name: str | None = Field(default=None, max_length=255)
    client_email: EmailStr | None = None

    @field_validator("whatsapp")
    @classmethod
    def _normalize_whatsapp(cls, v: str) -> str:
        digits = _DIGITS.sub("", v)
        if not 10 <= len(digits) <= 11:
            raise ValueError("WhatsApp deve ter 10 ou 11 dígitos")
        return digits

    @field_validator("cep")
    @classmethod
    def _normalize_cep(cls, v: str) -> str:
        digits = _DIGITS.sub("", v)
        if len(digits) != 8:
            raise ValueError("CEP deve ter 8 dígitos")
        return f"{digits[:5]}-{digits[5:]}"

    @field_validator("state")
    @classmethod
    def _uppercase_state(cls, v: str) -> str:
        return v.upper()


class OrderUpdateAdmin(BaseModel):
    """Partial admin update. Every field is optional; only provided fields change."""

    status: OrderStatus | None = None
    project_value: Decimal | None = Field(default=None, ge=0)
    estimated_cost: Decimal | None = Field(default=None, ge=0)
    due_date: date | None = None
    install_date: date | None = None
    admin_notes: str | None = Field(default=None, max_length=2000)
    city: str | None = Field(default=None, min_length=1, max_length=120)
    state: str | None = Field(default=None, min_length=2, max_length=2)
    address_line: str | None = Field(default=None, max_length=255)
    # Editable client/project fields (only honored when status is AGUARDANDO_ANALISE).
    whatsapp: str | None = Field(default=None, min_length=10, max_length=20)
    environments: str | None = Field(default=None, min_length=1, max_length=300)
    furniture_types: str | None = Field(default=None, max_length=500)
    observations: str | None = Field(default=None, max_length=2000)
    # Optional note attached to the history entry when status changes.
    note: str | None = Field(default=None, max_length=500)

    @field_validator("whatsapp")
    @classmethod
    def _normalize_whatsapp(cls, v: str | None) -> str | None:
        if v is None:
            return None
        digits = _DIGITS.sub("", v)
        if not 10 <= len(digits) <= 11:
            raise ValueError("WhatsApp deve ter 10 ou 11 dígitos")
        return digits


class OrderHistoryEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    from_status: OrderStatus | None
    to_status: OrderStatus
    note: str | None
    created_at: datetime


class OrderImageRead(BaseModel):
    """Metadata for an attached environment photo. The bytes are served by a
    dedicated endpoint, never embedded in the order payload."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    filename: str
    content_type: str
    size: int
    created_at: datetime


class OrderRead(BaseModel):
    """Single read shape. Admin-only fields are redacted to None for customers
    (see src.services.order.serialize_order)."""

    id: uuid.UUID
    order_number: int
    user_id: uuid.UUID
    # Customer identity — populated only in the admin view.
    customer_name: str | None
    customer_email: str | None
    status: OrderStatus
    whatsapp: str
    cep: str
    city: str
    state: str
    address_line: str | None
    environments: str
    furniture_types: str | None
    observations: str | None
    # Visible to the customer only once the order leaves AGUARDANDO_ANALISE.
    project_value: Decimal | None
    # Admin-only — always None in customer responses.
    estimated_cost: Decimal | None
    profit: Decimal | None
    admin_notes: str | None
    due_date: date | None
    install_date: date | None
    created_at: datetime
    updated_at: datetime
    history: list[OrderHistoryEntry]
    images: list[OrderImageRead]


class PaginatedOrders(BaseModel):
    items: list[OrderRead]
    total: int
    page: int
    limit: int
    pages: int


class DashboardSummary(BaseModel):
    counts_by_status: dict[OrderStatus, int]
    revenue_month: Decimal
    cost_month: Decimal
    profit_month: Decimal
    overdue_count: int
    recent_orders: list[OrderRead]
