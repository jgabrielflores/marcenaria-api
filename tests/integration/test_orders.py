from datetime import date, timedelta

import pytest

from tests.conftest import ORDER_PAYLOAD

FUTURE_DATE = (date.today() + timedelta(days=60)).isoformat()


def _advance(client, order_id, status, headers, **extra):
    return client.patch(
        f"/api/v1/orders/{order_id}", json={"status": status, **extra}, headers=headers
    )


# ── POST /api/v1/orders ───────────────────────────────────────────────────────

@pytest.mark.integration
def test_create_order_returns_201_with_initial_status(client, customer_headers):
    resp = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "AGUARDANDO_ANALISE"
    assert body["environments"] == "Cozinha"
    assert isinstance(body["order_number"], int)
    assert "id" in body and "user_id" in body


@pytest.mark.integration
def test_create_order_records_initial_history_event(client, customer_headers):
    resp = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers)
    history = resp.json()["history"]
    assert len(history) == 1
    assert history[0]["from_status"] is None
    assert history[0]["to_status"] == "AGUARDANDO_ANALISE"


@pytest.mark.integration
def test_create_order_normalizes_whatsapp_and_cep(client, customer_headers):
    payload = {**ORDER_PAYLOAD, "whatsapp": "(11) 99999-9999", "cep": "01001000"}
    body = client.post("/api/v1/orders", json=payload, headers=customer_headers).json()
    assert body["whatsapp"] == "11999999999"
    assert body["cep"] == "01001-000"


@pytest.mark.integration
def test_create_order_without_auth_returns_4xx(client):
    resp = client.post("/api/v1/orders", json=ORDER_PAYLOAD)
    assert resp.status_code in (401, 403)


# ── GET /api/v1/orders ────────────────────────────────────────────────────────

@pytest.mark.integration
def test_customer_list_orders_returns_only_own_orders(client, customer_headers, admin_headers):
    client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers)
    client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=admin_headers)

    resp = client.get("/api/v1/orders", headers=customer_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert len(body["items"]) == 1


@pytest.mark.integration
def test_admin_list_orders_returns_all_orders(client, customer_headers, admin_headers):
    client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers)
    client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=admin_headers)

    admin_total = client.get("/api/v1/orders", headers=admin_headers).json()["total"]
    customer_total = client.get("/api/v1/orders", headers=customer_headers).json()["total"]

    # The customer sees only their single order; the admin sees strictly more.
    assert customer_total == 1
    assert admin_total > customer_total


@pytest.mark.integration
def test_list_orders_response_has_pagination_shape(client, customer_headers):
    body = client.get("/api/v1/orders", headers=customer_headers).json()
    assert {"items", "total", "page", "limit", "pages"} <= body.keys()


@pytest.mark.integration
def test_list_orders_pagination_limits_results(client, customer_headers):
    for _ in range(3):
        client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers)

    body = client.get("/api/v1/orders?page=1&limit=2", headers=customer_headers).json()
    assert len(body["items"]) == 2
    assert body["total"] == 3
    assert body["pages"] == 2


@pytest.mark.integration
def test_admin_can_filter_orders_by_status(client, customer_headers, admin_headers):
    client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers)

    resp = client.get("/api/v1/orders?status=CANCELADO", headers=admin_headers)
    assert resp.status_code == 200
    # The filter is applied — every returned order matches the requested status.
    assert all(item["status"] == "CANCELADO" for item in resp.json()["items"])


# ── GET /api/v1/orders/{id} ───────────────────────────────────────────────────

@pytest.mark.integration
def test_get_order_owner_receives_order(client, customer_headers):
    created = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers).json()

    resp = client.get(f"/api/v1/orders/{created['id']}", headers=customer_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]


@pytest.mark.integration
def test_get_order_not_found_returns_404(client, customer_headers):
    resp = client.get(
        "/api/v1/orders/00000000-0000-0000-0000-000000000000", headers=customer_headers
    )
    assert resp.status_code == 404


@pytest.mark.integration
def test_customer_cannot_read_another_users_order(client, customer_headers, admin_headers):
    admin_order = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=admin_headers).json()

    resp = client.get(f"/api/v1/orders/{admin_order['id']}", headers=customer_headers)
    assert resp.status_code == 403


# ── PATCH /api/v1/orders/{id} ─────────────────────────────────────────────────

@pytest.mark.integration
def test_admin_advances_order_status(client, customer_headers, admin_headers):
    order = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers).json()

    resp = _advance(client, order["id"], "EM_ORCAMENTO", admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "EM_ORCAMENTO"
    assert body["history"][-1]["to_status"] == "EM_ORCAMENTO"


@pytest.mark.integration
def test_admin_advances_order_through_multiple_steps(client, customer_headers, admin_headers):
    order = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers).json()
    _advance(client, order["id"], "EM_ORCAMENTO", admin_headers)
    resp = _advance(
        client,
        order["id"],
        "APROVADO",
        admin_headers,
        project_value="9000.00",
        due_date=FUTURE_DATE,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "APROVADO"


@pytest.mark.integration
def test_advance_to_aprovado_without_required_fields_returns_400(
    client, customer_headers, admin_headers
):
    order = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers).json()
    _advance(client, order["id"], "EM_ORCAMENTO", admin_headers)
    resp = _advance(client, order["id"], "APROVADO", admin_headers)
    assert resp.status_code == 400


@pytest.mark.integration
def test_admin_can_revert_status_one_step(client, customer_headers, admin_headers):
    order = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers).json()
    _advance(client, order["id"], "EM_ORCAMENTO", admin_headers)
    resp = _advance(client, order["id"], "AGUARDANDO_ANALISE", admin_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "AGUARDANDO_ANALISE"


@pytest.mark.integration
def test_admin_cannot_set_due_date_in_the_past(client, customer_headers, admin_headers):
    order = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers).json()
    resp = client.patch(
        f"/api/v1/orders/{order['id']}",
        json={"due_date": "2020-01-01"},
        headers=admin_headers,
    )
    assert resp.status_code == 400


@pytest.mark.integration
def test_admin_cannot_set_install_date_before_due_date(client, customer_headers, admin_headers):
    order = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers).json()
    near = (date.today() + timedelta(days=10)).isoformat()
    resp = client.patch(
        f"/api/v1/orders/{order['id']}",
        json={"due_date": FUTURE_DATE, "install_date": near},
        headers=admin_headers,
    )
    assert resp.status_code == 400


@pytest.mark.integration
def test_admin_can_cancel_order(client, customer_headers, admin_headers):
    order = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers).json()

    resp = _advance(client, order["id"], "CANCELADO", admin_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "CANCELADO"


@pytest.mark.integration
def test_customer_cannot_change_order_status(client, customer_headers):
    order = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers).json()

    resp = _advance(client, order["id"], "EM_ORCAMENTO", customer_headers)
    assert resp.status_code == 403


@pytest.mark.integration
def test_update_status_skipping_step_returns_409(client, customer_headers, admin_headers):
    order = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers).json()

    resp = _advance(client, order["id"], "CONCLUIDO", admin_headers)
    assert resp.status_code == 409


@pytest.mark.integration
def test_update_status_order_not_found_returns_404(client, admin_headers):
    resp = _advance(
        client, "00000000-0000-0000-0000-000000000000", "EM_ORCAMENTO", admin_headers
    )
    assert resp.status_code == 404


@pytest.mark.integration
def test_admin_sets_financial_fields_and_dates(client, customer_headers, admin_headers):
    order = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers).json()

    resp = client.patch(
        f"/api/v1/orders/{order['id']}",
        json={"project_value": "8500.00", "estimated_cost": "5200.00", "due_date": "2026-06-20"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["project_value"] == "8500.00"
    assert body["estimated_cost"] == "5200.00"
    assert body["profit"] == "3300.00"
    assert body["due_date"] == "2026-06-20"


@pytest.mark.integration
def test_admin_sees_customer_identity_on_order(client, customer_headers, admin_headers):
    order = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers).json()

    body = client.get(f"/api/v1/orders/{order['id']}", headers=admin_headers).json()
    assert body["customer_name"] == "Alice"
    assert body["customer_email"] == "alice@test.com"


@pytest.mark.integration
def test_admin_creates_order_with_client_name(client, admin_headers):
    payload = {**ORDER_PAYLOAD, "client_name": "Cliente WhatsApp"}
    created = client.post("/api/v1/orders", json=payload, headers=admin_headers).json()

    body = client.get(f"/api/v1/orders/{created['id']}", headers=admin_headers).json()
    assert body["customer_name"] == "Cliente WhatsApp"
    assert body["customer_email"] is None


@pytest.mark.integration
def test_customer_cannot_spoof_client_name(client, customer_headers, admin_headers):
    payload = {**ORDER_PAYLOAD, "client_name": "Fake Name"}
    created = client.post("/api/v1/orders", json=payload, headers=customer_headers).json()

    body = client.get(f"/api/v1/orders/{created['id']}", headers=admin_headers).json()
    assert body["customer_name"] == "Alice"


@pytest.mark.integration
def test_customer_does_not_receive_customer_identity_fields(client, customer_headers):
    order = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers).json()

    body = client.get(f"/api/v1/orders/{order['id']}", headers=customer_headers).json()
    assert body["customer_name"] is None
    assert body["customer_email"] is None


@pytest.mark.integration
def test_customer_does_not_receive_admin_only_financial_fields(
    client, customer_headers, admin_headers
):
    order = client.post("/api/v1/orders", json=ORDER_PAYLOAD, headers=customer_headers).json()
    client.patch(
        f"/api/v1/orders/{order['id']}",
        json={"project_value": "8500.00", "estimated_cost": "5200.00"},
        headers=admin_headers,
    )

    body = client.get(f"/api/v1/orders/{order['id']}", headers=customer_headers).json()
    assert body["estimated_cost"] is None
    assert body["profit"] is None
    assert body["admin_notes"] is None
