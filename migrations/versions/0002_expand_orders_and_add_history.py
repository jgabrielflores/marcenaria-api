"""expand orders schema and add status history

Revision ID: 0002_expand_orders
Revises: 2f49bf7193e9
Create Date: 2026-05-19

Recreates the orders table with the production order-management schema
(7-state lifecycle, address, multi-environment, financial fields) and adds
the order_status_history timeline table. The pre-existing orders rows are
test fixtures and are not preserved (fresh start).
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002_expand_orders"
down_revision: Union[str, Sequence[str], None] = "2f49bf7193e9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_NEW_STATUSES = (
    "AGUARDANDO_ANALISE",
    "EM_ORCAMENTO",
    "APROVADO",
    "EM_PRODUCAO",
    "INSTALACAO_AGENDADA",
    "CONCLUIDO",
    "CANCELADO",
)
_OLD_STATUSES = ("PENDING", "IN_PROGRESS", "DONE")


def upgrade() -> None:
    op.drop_index("ix_orders_user_id_status", table_name="orders")
    op.drop_index("ix_orders_status", table_name="orders")
    op.drop_index(op.f("ix_orders_user_id"), table_name="orders")
    op.drop_table("orders")
    op.execute(sa.text("DROP TYPE IF EXISTS order_status"))

    order_status = postgresql.ENUM(*_NEW_STATUSES, name="order_status", create_type=False)
    order_status.create(op.get_bind(), checkfirst=True)

    op.execute(sa.text("CREATE SEQUENCE orders_number_seq START 1"))

    op.create_table(
        "orders",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column(
            "order_number",
            sa.Integer(),
            server_default=sa.text("nextval('orders_number_seq')"),
            nullable=False,
        ),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("whatsapp", sa.String(length=20), nullable=False),
        sa.Column("cep", sa.String(length=9), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("state", sa.CHAR(length=2), nullable=False),
        sa.Column("address_line", sa.String(length=255), nullable=True),
        sa.Column("environments", postgresql.ARRAY(sa.Text()), nullable=False),
        sa.Column("furniture_types", postgresql.ARRAY(sa.Text()), nullable=False),
        sa.Column("observations", sa.Text(), nullable=True),
        sa.Column(
            "status",
            order_status,
            server_default=sa.text("'AGUARDANDO_ANALISE'"),
            nullable=False,
        ),
        sa.Column("project_value", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("estimated_cost", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("install_date", sa.Date(), nullable=True),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_number"),
    )
    op.execute(sa.text("ALTER SEQUENCE orders_number_seq OWNED BY orders.order_number"))

    op.create_table(
        "order_status_history",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("order_id", sa.UUID(), nullable=False),
        sa.Column("from_status", order_status, nullable=True),
        sa.Column("to_status", order_status, nullable=False),
        sa.Column("changed_by", sa.UUID(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["changed_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(op.f("ix_orders_user_id"), "orders", ["user_id"], unique=False)
    op.create_index("ix_orders_status", "orders", ["status"], unique=False)
    op.create_index("ix_orders_user_id_status", "orders", ["user_id", "status"], unique=False)
    op.create_index("ix_orders_created_at", "orders", ["created_at"], unique=False)
    op.create_index(
        "ix_order_status_history_order_id_created_at",
        "order_status_history",
        ["order_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_order_status_history_order_id_created_at", table_name="order_status_history"
    )
    op.drop_index("ix_orders_created_at", table_name="orders")
    op.drop_index("ix_orders_user_id_status", table_name="orders")
    op.drop_index("ix_orders_status", table_name="orders")
    op.drop_index(op.f("ix_orders_user_id"), table_name="orders")
    op.drop_table("order_status_history")
    op.drop_table("orders")
    op.execute(sa.text("DROP SEQUENCE IF EXISTS orders_number_seq"))
    op.execute(sa.text("DROP TYPE IF EXISTS order_status"))

    old_status = postgresql.ENUM(*_OLD_STATUSES, name="order_status", create_type=False)
    old_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "orders",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("furniture_type", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("measurements", sa.Text(), nullable=False),
        sa.Column("contact", sa.String(length=255), nullable=False),
        sa.Column(
            "status",
            old_status,
            server_default=sa.text("'PENDING'"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_orders_user_id"), "orders", ["user_id"], unique=False)
    op.create_index("ix_orders_status", "orders", ["status"], unique=False)
    op.create_index("ix_orders_user_id_status", "orders", ["user_id", "status"], unique=False)
