"""
Access-control attack simulations.
Source: OWASP Testing Guide v4.2 — OTG-AUTHZ-001 (IDOR), OTG-AUTHZ-002 (privilege escalation)
"""

import pytest

from tests.conftest import ORDER_PAYLOAD


@pytest.mark.security
def test_idor_customer_cannot_read_another_users_order(client, customer_headers, admin_headers):
    """Customer A cannot retrieve Customer B's order by guessing its ID."""
    other_order = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=admin_headers).json()

    resp = client.get(f"/api/v1/orders/{other_order['id']}", headers=customer_headers)

    assert resp.status_code == 403


@pytest.mark.security
def test_customer_cannot_list_all_orders(client, customer_headers, admin_headers):
    """Customer only sees own orders; admin's orders must not appear in the list."""
    client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers)
    client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=admin_headers)

    resp = client.get("/api/v1/orders", headers=customer_headers)

    assert resp.status_code == 200
    assert resp.json()["total"] == 1


@pytest.mark.security
def test_customer_cannot_update_order(client, customer_headers):
    """Customers must not be able to call the admin-only PATCH /orders/{id} endpoint."""
    order = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers).json()

    resp = client.patch(
        f"/api/v1/orders/{order['id']}",
        json={"status": "EM_ORCAMENTO"},
        headers=customer_headers,
    )

    assert resp.status_code == 403


@pytest.mark.security
def test_customer_cannot_set_financial_fields(client, customer_headers):
    """Even with a valid token, a customer cannot write project_value/estimated_cost."""
    order = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers).json()

    resp = client.patch(
        f"/api/v1/orders/{order['id']}",
        json={"estimated_cost": "1.00"},
        headers=customer_headers,
    )

    assert resp.status_code == 403


@pytest.mark.security
def test_customer_never_receives_estimated_cost(client, customer_headers, admin_headers):
    """estimated_cost is admin-only and must never leak into a customer response."""
    order = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers).json()
    client.patch(
        f"/api/v1/orders/{order['id']}",
        json={"status": "EM_ORCAMENTO", "estimated_cost": "5200.00", "project_value": "8500.00"},
        headers=admin_headers,
    )

    body = client.get(f"/api/v1/orders/{order['id']}", headers=customer_headers).json()

    assert body["estimated_cost"] is None
    assert body["profit"] is None
    # The customer-facing project_value IS visible once quoted.
    assert body["project_value"] == "8500.00"


@pytest.mark.security
def test_customer_cannot_access_admin_dashboard(client, customer_headers):
    resp = client.get("/api/v1/admin/dashboard", headers=customer_headers)
    assert resp.status_code == 403


@pytest.mark.security
def test_unauthenticated_request_cannot_list_orders(client):
    resp = client.get("/api/v1/orders")
    assert resp.status_code in (401, 403)


@pytest.mark.security
def test_unauthenticated_request_cannot_create_order(client):
    resp = client.post("/api/v1/orders", json=ORDER_PAYLOAD)
    assert resp.status_code in (401, 403)


@pytest.mark.security
def test_unauthenticated_request_cannot_update_order(client):
    resp = client.patch(
        "/api/v1/orders/00000000-0000-0000-0000-000000000001",
        json={"status": "EM_ORCAMENTO"},
    )
    assert resp.status_code in (401, 403)
