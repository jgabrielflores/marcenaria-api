import enum
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    CHAR,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base

if TYPE_CHECKING:
    from src.models.order_history import OrderStatusHistory
    from src.models.user import User


class OrderStatus(str, enum.Enum):
    AGUARDANDO_ANALISE = "AGUARDANDO_ANALISE"
    EM_ORCAMENTO = "EM_ORCAMENTO"
    APROVADO = "APROVADO"
    EM_PRODUCAO = "EM_PRODUCAO"
    INSTALACAO_AGENDADA = "INSTALACAO_AGENDADA"
    CONCLUIDO = "CONCLUIDO"
    CANCELADO = "CANCELADO"


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        Index("ix_orders_status", "status"),
        Index("ix_orders_user_id_status", "user_id", "status"),
        Index("ix_orders_created_at", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    order_number: Mapped[int] = mapped_column(
        Integer,
        server_default=text("nextval('orders_number_seq')"),
        unique=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
    )

    # client_name / client_email are set only on admin-created orders for
    # walk-in customers; otherwise the identity comes from the user relationship.
    client_name: Mapped[str | None] = mapped_column(String(255))
    client_email: Mapped[str | None] = mapped_column(String(254))
    whatsapp: Mapped[str] = mapped_column(String(20))
    cep: Mapped[str] = mapped_column(String(9))
    city: Mapped[str] = mapped_column(String(120))
    state: Mapped[str] = mapped_column(CHAR(2))
    address_line: Mapped[str | None] = mapped_column(String(255))

    environments: Mapped[str] = mapped_column(Text)
    furniture_types: Mapped[str | None] = mapped_column(Text)
    observations: Mapped[str | None] = mapped_column(Text)

    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="order_status", create_type=True),
        server_default=text(f"'{OrderStatus.AGUARDANDO_ANALISE.value}'"),
    )

    project_value: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    estimated_cost: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    due_date: Mapped[date | None] = mapped_column(Date)
    install_date: Mapped[date | None] = mapped_column(Date)

    admin_notes: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    history: Mapped[list["OrderStatusHistory"]] = relationship(
        "OrderStatusHistory",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderStatusHistory.created_at",
    )
    user: Mapped["User"] = relationship("User")
