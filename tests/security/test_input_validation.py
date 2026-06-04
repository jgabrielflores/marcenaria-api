"""
Input validation attack simulations.
Source: OWASP Testing Guide v4.2 — OTG-INPVAL-005 (SQL injection), OTG-INPVAL-001 (reflected XSS)
"""

import pytest

from tests.conftest import ORDER_PAYLOAD


@pytest.mark.security
def test_sql_injection_in_login_email_is_safe(client):
    """SQL injection payload in email must not bypass authentication or crash the server."""
    resp = client.post(
        "/auth/login",
        json={
            "email": "' OR '1'='1' --",
            "password": "anything",
        },
    )
    assert resp.status_code in (401, 422)


@pytest.mark.security
def test_sql_injection_in_register_name_does_not_execute(client):
    """SQL injection in name field must be stored as literal text, not executed."""
    resp = client.post(
        "/auth/register",
        json={
            "name": "'; DROP TABLE users; --",
            "email": "attacker@test.com",
            "password": "password123",
        },
    )
    assert resp.status_code in (201, 422)
    if resp.status_code == 201:
        assert resp.json()["name"] == "'; DROP TABLE users; --"


@pytest.mark.security
def test_sql_injection_in_order_observations_is_stored_literally(client, customer_headers):
    """Free-text order fields must be persisted literally, never executed."""
    payload = {**ORDER_PAYLOAD, "observations": "'; DROP TABLE orders; --"}
    resp = client.post("/api/v1/orders", json=payload, headers=customer_headers)
    assert resp.status_code == 201
    assert resp.json()["observations"] == "'; DROP TABLE orders; --"


@pytest.mark.security
def test_invalid_whatsapp_returns_422(client, customer_headers):
    # 13 digits — long enough to pass min_length but not a valid phone number.
    payload = {**ORDER_PAYLOAD, "whatsapp": "1234567890123"}
    resp = client.post("/api/v1/orders", json=payload, headers=customer_headers)
    assert resp.status_code == 422


@pytest.mark.security
def test_invalid_cep_returns_422(client, customer_headers):
    # 9 digits — passes min_length but is not a valid 8-digit CEP.
    payload = {**ORDER_PAYLOAD, "cep": "123456789"}
    resp = client.post("/api/v1/orders", json=payload, headers=customer_headers)
    assert resp.status_code == 422


@pytest.mark.security
def test_empty_environments_returns_422(client, customer_headers):
    payload = {**ORDER_PAYLOAD, "environments": ""}
    resp = client.post("/api/v1/orders", json=payload, headers=customer_headers)
    assert resp.status_code == 422


@pytest.mark.security
def test_oversized_observations_returns_422(client, customer_headers):
    payload = {**ORDER_PAYLOAD, "observations": "A" * 2001}
    resp = client.post("/api/v1/orders", json=payload, headers=customer_headers)
    assert resp.status_code == 422


@pytest.mark.security
def test_oversized_environments_returns_422(client, customer_headers):
    payload = {**ORDER_PAYLOAD, "environments": "A" * 301}
    resp = client.post("/api/v1/orders", json=payload, headers=customer_headers)
    assert resp.status_code == 422


@pytest.mark.security
def test_invalid_uuid_in_order_path_returns_422(client, customer_headers):
    resp = client.get("/api/v1/orders/not-a-uuid", headers=customer_headers)
    assert resp.status_code == 422


@pytest.mark.security
def test_password_below_minimum_length_returns_422(client):
    resp = client.post(
        "/auth/register",
        json={
            "name": "Alice",
            "email": "alice@test.com",
            "password": "short",
        },
    )
    assert resp.status_code == 422


@pytest.mark.security
def test_invalid_email_format_in_register_returns_422(client):
    resp = client.post(
        "/auth/register",
        json={
            "name": "Alice",
            "email": "not-an-email",
            "password": "password123",
        },
    )
    assert resp.status_code == 422
