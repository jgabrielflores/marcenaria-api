import pytest

from src.models.user import User
from src.services.auth import create_verification_token


def _register(client, email="bob@test.com"):
    return client.post(
        "/auth/register",
        json={"name": "Bob", "email": email, "password": "password123"},
    )


@pytest.mark.integration
def test_health_returns_ok(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@pytest.mark.integration
def test_register_creates_customer_account(client):
    resp = client.post(
        "/auth/register",
        json={
            "name": "Bob",
            "email": "bob@test.com",
            "password": "password123",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "bob@test.com"
    assert body["role"] == "CUSTOMER"
    assert "password_hash" not in body


@pytest.mark.integration
def test_register_with_duplicate_email_returns_409(client):
    payload = {"name": "Bob", "email": "bob@test.com", "password": "password123"}
    client.post("/auth/register", json=payload)

    resp = client.post("/auth/register", json=payload)
    assert resp.status_code == 409


@pytest.mark.integration
def test_login_before_email_verification_returns_403(client):
    _register(client)
    resp = client.post("/auth/login", json={"email": "bob@test.com", "password": "password123"})
    assert resp.status_code == 403
    assert resp.json()["detail"] == "EMAIL_NOT_VERIFIED"


@pytest.mark.integration
def test_login_with_correct_credentials_returns_token(client, db):
    _register(client)
    user = db.query(User).filter(User.email == "bob@test.com").first()
    user.email_verified = True
    db.flush()

    resp = client.post("/auth/login", json={"email": "bob@test.com", "password": "password123"})
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


@pytest.mark.integration
def test_verify_email_then_login_succeeds(client, db):
    _register(client)
    user = db.query(User).filter(User.email == "bob@test.com").first()
    token = create_verification_token(user)

    verify = client.get(f"/auth/verify?token={token}", follow_redirects=False)
    assert verify.status_code == 303
    assert "verified=1" in verify.headers["location"]

    db.refresh(user)
    assert user.email_verified is True

    login = client.post("/auth/login", json={"email": "bob@test.com", "password": "password123"})
    assert login.status_code == 200


@pytest.mark.integration
def test_verify_email_with_bad_token_redirects_with_failure(client):
    resp = client.get("/auth/verify?token=garbage", follow_redirects=False)
    assert resp.status_code == 303
    assert "verified=0" in resp.headers["location"]


@pytest.mark.integration
def test_resend_verification_returns_200(client):
    _register(client)
    resp = client.post("/auth/resend-verification", json={"email": "bob@test.com"})
    assert resp.status_code == 200


@pytest.mark.integration
def test_resend_verification_for_unknown_email_still_returns_200(client):
    resp = client.post("/auth/resend-verification", json={"email": "nobody@test.com"})
    assert resp.status_code == 200


@pytest.mark.integration
def test_login_with_wrong_password_returns_401(client):
    client.post(
        "/auth/register",
        json={
            "name": "Bob",
            "email": "bob@test.com",
            "password": "password123",
        },
    )
    resp = client.post(
        "/auth/login",
        json={
            "email": "bob@test.com",
            "password": "wrongpassword",
        },
    )
    assert resp.status_code == 401
    assert resp.json()["detail"] == "invalid credentials"


@pytest.mark.integration
def test_login_with_unknown_email_returns_401(client):
    resp = client.post(
        "/auth/login",
        json={
            "email": "nobody@test.com",
            "password": "anypassword",
        },
    )
    assert resp.status_code == 401
    assert resp.json()["detail"] == "invalid credentials"


@pytest.mark.integration
def test_protected_endpoint_without_token_returns_4xx(client):
    resp = client.get("/api/v1/orders")
    assert resp.status_code in (401, 403)


@pytest.mark.integration
def test_protected_endpoint_with_invalid_token_returns_401(client):
    resp = client.get("/api/v1/orders", headers={"Authorization": "Bearer invalid.token.here"})
    assert resp.status_code == 401
