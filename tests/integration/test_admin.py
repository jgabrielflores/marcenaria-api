from datetime import date, timedelta

import pytest

from tests.conftest import ORDER_PAYLOAD

_DUE_DATE = (date.today() + timedelta(days=45)).isoformat()
_INSTALL_DATE = (date.today() + timedelta(days=60)).isoformat()


@pytest.mark.integration
def test_dashboard_returns_summary_shape(client, admin_headers):
    body = client.get("/api/v1/admin/dashboard", headers=admin_headers).json()
    assert {
        "counts_by_status",
        "revenue_month",
        "cost_month",
        "profit_month",
        "overdue_count",
        "recent_orders",
    } <= body.keys()


@pytest.mark.integration
def test_dashboard_counts_orders_by_status(client, customer_headers, admin_headers):
    client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers)

    body = client.get("/api/v1/admin/dashboard", headers=admin_headers).json()
    assert body["counts_by_status"]["AGUARDANDO_ANALISE"] >= 1


@pytest.mark.integration
def test_dashboard_lists_recent_orders(client, customer_headers, admin_headers):
    client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers)

    body = client.get("/api/v1/admin/dashboard", headers=admin_headers).json()
    assert len(body["recent_orders"]) >= 1


@pytest.mark.integration
def test_dashboard_revenue_and_profit_reflect_concluded_orders(
    client, customer_headers, admin_headers
):
    order = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers).json()
    oid = order["id"]

    def patch(payload):
        return client.patch(f"/api/v1/orders/{oid}", json=payload, headers=admin_headers)

    patch({"status": "EM_ORCAMENTO"})
    patch({"status": "APROVADO", "project_value": "8000.00", "due_date": _DUE_DATE})
    patch({"status": "EM_PRODUCAO", "estimated_cost": "5000.00"})
    patch({"status": "INSTALACAO_AGENDADA", "install_date": _INSTALL_DATE})
    patch({"status": "CONCLUIDO"})

    body = client.get("/api/v1/admin/dashboard", headers=admin_headers).json()
    assert float(body["revenue_month"]) >= 8000
    assert float(body["cost_month"]) >= 5000
    assert float(body["profit_month"]) == float(body["revenue_month"]) - float(body["cost_month"])


@pytest.mark.integration
def test_dashboard_requires_admin(client, customer_headers):
    resp = client.get("/api/v1/admin/dashboard", headers=customer_headers)
    assert resp.status_code == 403


@pytest.mark.integration
def test_dashboard_requires_auth(client):
    resp = client.get("/api/v1/admin/dashboard")
    assert resp.status_code in (401, 403)
