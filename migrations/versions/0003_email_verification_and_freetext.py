"""email verification, client_name, free-text order fields

Revision ID: 0003_email_verification
Revises: 0002_expand_orders
Create Date: 2026-05-20

Adds users.email_verified, orders.client_name (admin walk-in orders), and
converts orders.environments / orders.furniture_types from TEXT[] to plain
TEXT (the UI moved from structured multi-select to free-text fields).
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003_email_verification"
down_revision: Union[str, Sequence[str], None] = "0002_expand_orders"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "email_verified",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )
    op.add_column("orders", sa.Column("client_name", sa.String(length=255), nullable=True))
    op.alter_column(
        "orders",
        "environments",
        type_=sa.Text(),
        postgresql_using="array_to_string(environments, ', ')",
    )
    op.alter_column(
        "orders",
        "furniture_types",
        type_=sa.Text(),
        nullable=True,
        postgresql_using="array_to_string(furniture_types, ', ')",
    )


def downgrade() -> None:
    op.alter_column(
        "orders",
        "furniture_types",
        type_=postgresql.ARRAY(sa.Text()),
        nullable=False,
        postgresql_using="string_to_array(coalesce(furniture_types, ''), ', ')",
    )
    op.alter_column(
        "orders",
        "environments",
        type_=postgresql.ARRAY(sa.Text()),
        postgresql_using="string_to_array(coalesce(environments, ''), ', ')",
    )
    op.drop_column("orders", "client_name")
    op.drop_column("users", "email_verified")
