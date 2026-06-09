"""Seed script regression tests.

The seed runs in production at container boot (migrate + create admin). It is
idempotent: it creates the ADMIN only if absent and never duplicates it.

Each test patches ``get_settings`` with its own admin e-mail so it is independent
of whatever admin already exists in the database (the local dev DB is seeded).
"""

from unittest.mock import MagicMock, patch

import pytest

from src.models.user import Role, User
from src.scripts.seed_admin import seed
from src.services.auth import pwd_context


def _fake_settings(email: str, password: str = "seed-password-123") -> MagicMock:
    settings = MagicMock()
    settings.admin_email = email
    settings.admin_password.get_secret_value.return_value = password
    return settings


@pytest.mark.integration
def test_seed_admin_creates_admin_when_absent(db):
    email = "seed-create@example.com"
    with patch("src.scripts.seed_admin.get_settings", return_value=_fake_settings(email)):
        seed(db)

    admins = db.query(User).filter(User.email == email).all()
    assert len(admins) == 1
    assert admins[0].role == Role.ADMIN
    assert admins[0].email_verified is True


@pytest.mark.integration
def test_seed_admin_is_idempotent(db):
    email = "seed-idempotent@example.com"
    with patch("src.scripts.seed_admin.get_settings", return_value=_fake_settings(email)):
        seed(db)
        seed(db)  # second run must not create a duplicate

    admins = db.query(User).filter(User.email == email).all()
    assert len(admins) == 1


@pytest.mark.integration
def test_seed_admin_marks_existing_unverified_admin_as_verified(db):
    email = "seed-unverified@example.com"
    db.add(
        User(
            name="Admin",
            email=email,
            password_hash=pwd_context.hash("whatever"),
            role=Role.ADMIN,
            email_verified=False,
        )
    )
    db.flush()

    with patch("src.scripts.seed_admin.get_settings", return_value=_fake_settings(email)):
        seed(db)

    admin = db.query(User).filter(User.email == email).one()
    assert admin.email_verified is True
