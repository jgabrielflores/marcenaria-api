"""
Information-disclosure attack simulations.
Source: OWASP Testing Guide v4.2 — OTG-INFO, OWASP ASVS v4 §2.2 (authentication error uniformity)
"""
import pytest

from src.models.user import User
from tests.conftest import ORDER_PAYLOAD


@pytest.mark.security
def test_wrong_email_and_wrong_password_return_identical_error(client):
    """Both unknown e-mail and wrong password must return the same 401 body.

    Differing messages allow an attacker to enumerate valid e-mail addresses.
    (OWASP ASVS v4 §2.2.2)
    """
    client.post("/auth/register", json={
        "name": "Known",
        "email": "known@test.com",
        "password": "password123",
    })

    resp_unknown = client.post("/auth/login", json={
        "email": "unknown@test.com",
        "password": "anypassword",
    })
    resp_wrong_pw = client.post("/auth/login", json={
        "email": "known@test.com",
        "password": "wrongpassword",
    })

    assert resp_unknown.status_code == 401
    assert resp_wrong_pw.status_code == 401
    assert resp_unknown.json()["detail"] == resp_wrong_pw.json()["detail"]
    assert resp_unknown.json()["detail"] == "invalid credentials"


@pytest.mark.security
def test_register_response_never_exposes_password_hash(client):
    resp = client.post("/auth/register", json={
        "name": "Alice",
        "email": "alice@test.com",
        "password": "password123",
    })
    assert resp.status_code == 201
    body = resp.json()
    assert "password_hash" not in body
    assert "password" not in body


@pytest.mark.security
def test_login_response_never_exposes_password_hash(client, db):
    client.post("/auth/register", json={
        "name": "Alice",
        "email": "alice@test.com",
        "password": "password123",
    })
    user = db.query(User).filter(User.email == "alice@test.com").first()
    user.email_verified = True
    db.flush()

    resp = client.post("/auth/login", json={
        "email": "alice@test.com",
        "password": "password123",
    })
    assert resp.status_code == 200
    body = resp.json()
    assert "password_hash" not in body
    assert "password" not in body


@pytest.mark.security
def test_order_response_never_exposes_password_hash(client, customer_headers):
    resp = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers)
    assert resp.status_code == 201
    assert "password_hash" not in resp.json()


@pytest.mark.security
def test_error_responses_do_not_leak_stack_traces(client):
    resp = client.get("/api/v1/orders/00000000-0000-0000-0000-000000000001")
    assert "Traceback" not in resp.text
    assert "File " not in resp.text
    assert "Exception" not in resp.text
