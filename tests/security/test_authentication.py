"""
JWT authentication attack simulations.
Source: OWASP Testing Guide v4.2 — OTG-AUTHN-006
"""

import base64
import json
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from jose import jwt

from src.config import get_settings
from src.models.user import Role, User
from src.services.auth import create_access_token, pwd_context


def _token_with_delta(user_id: uuid.UUID, role: Role, delta: timedelta) -> str:
    settings = get_settings()
    payload = {
        "sub": str(user_id),
        "role": role.value,
        "exp": datetime.now(UTC) + delta,
    }
    return jwt.encode(payload, settings.secret_key.get_secret_value(), algorithm=settings.algorithm)


def _make_user(db, role: Role = Role.CUSTOMER) -> User:
    user = User(
        name="Tester",
        email=f"{uuid.uuid4()}@test.com",
        password_hash=pwd_context.hash("pw12345678"),
        role=role,
        email_verified=True,
    )
    db.add(user)
    db.flush()
    return user


@pytest.mark.security
def test_missing_token_is_rejected(client):
    resp = client.get("/api/v1/orders")
    assert resp.status_code in (401, 403)


@pytest.mark.security
def test_expired_token_returns_401(client, db):
    user = _make_user(db)
    token = _token_with_delta(user.id, Role.CUSTOMER, timedelta(hours=-1))

    resp = client.get("/api/v1/orders", headers={"Authorization": f"Bearer {token}"})

    assert resp.status_code == 401


@pytest.mark.security
def test_token_signed_with_wrong_key_returns_401(client, db):
    user = _make_user(db)
    payload = {
        "sub": str(user.id),
        "role": Role.CUSTOMER.value,
        "exp": datetime.now(UTC) + timedelta(hours=1),
    }
    token = jwt.encode(payload, "wrong-secret-key-32-characters--!", algorithm="HS256")

    resp = client.get("/api/v1/orders", headers={"Authorization": f"Bearer {token}"})

    assert resp.status_code == 401


@pytest.mark.security
def test_alg_none_attack_is_rejected(client, db):
    """Attacker crafts a token with alg:none to bypass signature validation."""
    user = _make_user(db)
    header = (
        base64.urlsafe_b64encode(json.dumps({"alg": "none", "typ": "JWT"}).encode())
        .rstrip(b"=")
        .decode()
    )
    payload_b64 = (
        base64.urlsafe_b64encode(
            json.dumps(
                {
                    "sub": str(user.id),
                    "role": "ADMIN",
                    "exp": int((datetime.now(UTC) + timedelta(hours=1)).timestamp()),
                }
            ).encode()
        )
        .rstrip(b"=")
        .decode()
    )
    token = f"{header}.{payload_b64}."

    resp = client.get("/api/v1/orders", headers={"Authorization": f"Bearer {token}"})

    assert resp.status_code == 401


@pytest.mark.security
def test_tampered_role_claim_is_rejected(client, db):
    """Attacker decodes a valid customer token, elevates role to ADMIN, re-signs with wrong key."""
    user = _make_user(db, Role.CUSTOMER)
    valid_token = create_access_token(user)

    parts = valid_token.split(".")
    padded = parts[1] + "=" * (4 - len(parts[1]) % 4)
    payload = json.loads(base64.urlsafe_b64decode(padded))
    payload["role"] = "ADMIN"

    forged_token = jwt.encode(payload, "attacker-key-32-characters-pad!!", algorithm="HS256")

    resp = client.patch(
        f"/api/v1/orders/{uuid.uuid4()}",
        json={"status": "EM_ORCAMENTO"},
        headers={"Authorization": f"Bearer {forged_token}"},
    )

    assert resp.status_code == 401


@pytest.mark.security
def test_nonexistent_user_id_in_valid_token_returns_401(client):
    """Token is cryptographically valid but references a user that doesn't exist in the DB."""
    settings = get_settings()
    payload = {
        "sub": str(uuid.uuid4()),
        "role": Role.CUSTOMER.value,
        "exp": datetime.now(UTC) + timedelta(hours=1),
    }
    token = jwt.encode(
        payload, settings.secret_key.get_secret_value(), algorithm=settings.algorithm
    )

    resp = client.get("/api/v1/orders", headers={"Authorization": f"Bearer {token}"})

    assert resp.status_code == 401
