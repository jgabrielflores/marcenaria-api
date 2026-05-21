"""add orders.client_email for admin-created walk-in orders

Revision ID: 0004_client_email
Revises: 0003_email_verification
Create Date: 2026-05-20
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004_client_email"
down_revision: Union[str, Sequence[str], None] = "0003_email_verification"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("client_email", sa.String(length=254), nullable=True))


def downgrade() -> None:
    op.drop_column("orders", "client_email")
