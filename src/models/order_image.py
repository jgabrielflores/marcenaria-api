import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, Integer, LargeBinary, String, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base

if TYPE_CHECKING:
    from src.models.order import Order


class OrderImage(Base):
    """A photo of the environment where the furniture will be installed.

    The bytes live in Postgres (BYTEA); there is no external object storage.
    Customers attach 1-5 of these per order so the workshop can see the space
    before drafting the project/quote.
    """

    __tablename__ = "order_images"
    __table_args__ = (Index("ix_order_images_order_id_created_at", "order_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE")
    )
    filename: Mapped[str] = mapped_column(String(255))
    content_type: Mapped[str] = mapped_column(String(100))
    size: Mapped[int] = mapped_column(Integer)
    # Deferred: the bytes are heavy and never needed for list/detail serialization
    # (only OrderImage metadata is). They load lazily when explicitly accessed, e.g.
    # when streaming a single image via the download endpoint.
    data: Mapped[bytes] = mapped_column(LargeBinary, deferred=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    order: Mapped["Order"] = relationship("Order", back_populates="images")
