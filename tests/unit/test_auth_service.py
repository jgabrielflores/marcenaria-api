import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from src.models.user import Role, User
from src.schemas.auth import RegisterRequest
from src.services.auth import (
    authenticate_user,
    create_access_token,
    create_verification_token,
    pwd_context as _pwd,
    register_user,
    verify_email,
)


def _fake_refresh(obj: User) -> None:
    obj.id = uuid.uuid4()
    obj.created_at = datetime.now(timezone.utc)
    obj.updated_at = datetime.now(timezone.utc)


@pytest.mark.unit
def test_register_user_returns_user_domain_object(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None
    mock_db.refresh.side_effect = _fake_refresh

    result = register_user(mock_db, RegisterRequest(name="Alice", email="alice@example.com", password="password123"))

    assert result.email == "alice@example.com"
    assert result.role == Role.CUSTOMER
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()


@pytest.mark.unit
def test_register_user_with_duplicate_email_raises_409(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = User(email="alice@example.com")

    with pytest.raises(HTTPException) as exc:
        register_user(mock_db, RegisterRequest(name="Alice", email="alice@example.com", password="password123"))

    assert exc.value.status_code == 409


@pytest.mark.unit
def test_authenticate_user_with_correct_credentials_returns_user(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = User(
        email="alice@example.com",
        password_hash=_pwd.hash("correctpassword"),
        email_verified=True,
    )

    result = authenticate_user(mock_db, "alice@example.com", "correctpassword")

    assert result.email == "alice@example.com"


@pytest.mark.unit
def test_authenticate_user_with_unverified_email_raises_403(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = User(
        email="alice@example.com",
        password_hash=_pwd.hash("correctpassword"),
        email_verified=False,
    )

    with pytest.raises(HTTPException) as exc:
        authenticate_user(mock_db, "alice@example.com", "correctpassword")

    assert exc.value.status_code == 403
    assert exc.value.detail == "EMAIL_NOT_VERIFIED"


@pytest.mark.unit
def test_authenticate_user_with_wrong_password_raises_401(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = User(
        email="alice@example.com",
        password_hash=_pwd.hash("correctpassword"),
    )

    with pytest.raises(HTTPException) as exc:
        authenticate_user(mock_db, "alice@example.com", "wrongpassword")

    assert exc.value.status_code == 401
    assert exc.value.detail == "invalid credentials"


@pytest.mark.unit
def test_authenticate_user_with_unknown_email_raises_401(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    with pytest.raises(HTTPException) as exc:
        authenticate_user(mock_db, "unknown@example.com", "anypassword")

    assert exc.value.status_code == 401
    assert exc.value.detail == "invalid credentials"


def _verify_settings() -> MagicMock:
    settings = MagicMock()
    settings.secret_key.get_secret_value.return_value = "a" * 32
    settings.algorithm = "HS256"
    settings.access_token_expire_minutes = 60
    return settings


@pytest.mark.unit
def test_verify_email_marks_user_verified(mock_db):
    user = User()
    user.id = uuid.uuid4()
    user.email_verified = False
    mock_db.get.return_value = user

    with patch("src.services.auth.get_settings", return_value=_verify_settings()):
        token = create_verification_token(user)
        result = verify_email(mock_db, token)

    assert result.email_verified is True
    mock_db.commit.assert_called_once()


@pytest.mark.unit
def test_verify_email_with_invalid_token_raises_400(mock_db):
    with patch("src.services.auth.get_settings", return_value=_verify_settings()):
        with pytest.raises(HTTPException) as exc:
            verify_email(mock_db, "not.a.valid.token")

    assert exc.value.status_code == 400


@pytest.mark.unit
def test_verify_email_rejects_access_token_used_as_verification(mock_db):
    """An access token (no 'email_verify' purpose) must not verify an account."""
    user = User()
    user.id = uuid.uuid4()
    user.role = Role.CUSTOMER

    with patch("src.services.auth.get_settings", return_value=_verify_settings()):
        access_token = create_access_token(user)
        with pytest.raises(HTTPException) as exc:
            verify_email(mock_db, access_token)

    assert exc.value.status_code == 400


@pytest.mark.unit
def test_create_access_token_contains_expected_claims():
    from jose import jwt

    mock_settings = MagicMock()
    mock_settings.secret_key.get_secret_value.return_value = "a" * 32
    mock_settings.algorithm = "HS256"
    mock_settings.access_token_expire_minutes = 1440

    user = User()
    user.id = uuid.UUID("12345678-1234-5678-1234-567812345678")
    user.role = Role.CUSTOMER

    with patch("src.services.auth.get_settings", return_value=mock_settings):
        token = create_access_token(user)

    payload = jwt.decode(token, "a" * 32, algorithms=["HS256"])

    assert payload["sub"] == "12345678-1234-5678-1234-567812345678"
    assert payload["role"] == "CUSTOMER"
    assert "exp" in payload
