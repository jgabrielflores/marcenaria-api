import uuid
from datetime import UTC, date, datetime, timedelta

import pytest
from fastapi import HTTPException

from src.models.order import Order, OrderStatus
from src.models.order_history import OrderStatusHistory
from src.models.user import Role, User
from src.schemas.order import OrderCreate, OrderUpdateAdmin
from src.services.order import (
    create_order,
    get_order,
    is_valid_transition,
    list_orders,
    serialize_order,
    update_order_admin,
)


def _make_user(role: Role = Role.CUSTOMER) -> User:
    user = User()
    user.id = uuid.uuid4()
    user.role = role
    return user


def _make_order(user_id: uuid.UUID, status: OrderStatus = OrderStatus.AGUARDANDO_ANALISE) -> Order:
    owner = User()
    owner.id = user_id
    owner.name = "Cliente Teste"
    owner.email = "cliente@test.com"
    order = Order()
    order.id = uuid.uuid4()
    order.order_number = 1
    order.user_id = user_id
    order.user = owner
    order.client_name = None
    order.client_email = None
    order.whatsapp = "11999999999"
    order.cep = "01001-000"
    order.city = "São Paulo"
    order.state = "SP"
    order.address_line = None
    order.environments = "Cozinha"
    order.furniture_types = "armário"
    order.observations = None
    order.status = status
    order.project_value = None
    order.estimated_cost = None
    order.due_date = None
    order.install_date = None
    order.admin_notes = None
    order.created_at = datetime.now(UTC)
    order.updated_at = datetime.now(UTC)
    return order


def _body() -> OrderCreate:
    return OrderCreate(
        whatsapp="(11) 99999-9999",
        cep="01001-000",
        city="São Paulo",
        state="sp",
        environments="Cozinha, Closet",
        furniture_types="armário, bancada",
        observations="Quero algo moderno.",
    )


# ── is_valid_transition ───────────────────────────────────────────────────────


@pytest.mark.unit
def test_valid_transition_forward_step_is_allowed():
    assert is_valid_transition(OrderStatus.AGUARDANDO_ANALISE, OrderStatus.EM_ORCAMENTO)
    assert is_valid_transition(OrderStatus.EM_PRODUCAO, OrderStatus.INSTALACAO_AGENDADA)
    assert is_valid_transition(OrderStatus.INSTALACAO_AGENDADA, OrderStatus.CONCLUIDO)


@pytest.mark.unit
def test_valid_transition_skipping_step_is_rejected():
    assert not is_valid_transition(OrderStatus.AGUARDANDO_ANALISE, OrderStatus.APROVADO)


@pytest.mark.unit
def test_valid_transition_one_step_backward_is_allowed():
    assert is_valid_transition(OrderStatus.APROVADO, OrderStatus.EM_ORCAMENTO)
    assert is_valid_transition(OrderStatus.EM_PRODUCAO, OrderStatus.APROVADO)


@pytest.mark.unit
def test_valid_transition_backward_skipping_is_rejected():
    assert not is_valid_transition(OrderStatus.EM_PRODUCAO, OrderStatus.EM_ORCAMENTO)


@pytest.mark.unit
def test_valid_transition_em_producao_can_finish_without_installation():
    assert is_valid_transition(OrderStatus.EM_PRODUCAO, OrderStatus.CONCLUIDO)


@pytest.mark.unit
def test_valid_transition_cancel_from_non_terminal_is_allowed():
    assert is_valid_transition(OrderStatus.AGUARDANDO_ANALISE, OrderStatus.CANCELADO)
    assert is_valid_transition(OrderStatus.EM_PRODUCAO, OrderStatus.CANCELADO)


@pytest.mark.unit
def test_valid_transition_cancel_from_terminal_is_rejected():
    assert not is_valid_transition(OrderStatus.CONCLUIDO, OrderStatus.CANCELADO)
    assert not is_valid_transition(OrderStatus.CANCELADO, OrderStatus.CANCELADO)


@pytest.mark.unit
def test_valid_transition_cannot_leave_cancelled():
    assert not is_valid_transition(OrderStatus.CANCELADO, OrderStatus.EM_ORCAMENTO)
    assert not is_valid_transition(OrderStatus.CANCELADO, OrderStatus.AGUARDANDO_ANALISE)


# ── create_order ──────────────────────────────────────────────────────────────


@pytest.mark.unit
def test_create_order_starts_in_aguardando_analise(mock_db):
    user = _make_user()

    result = create_order(mock_db, user, _body())

    assert result.status == OrderStatus.AGUARDANDO_ANALISE
    assert result.user_id == user.id
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()


@pytest.mark.unit
def test_create_order_writes_initial_history_event(mock_db):
    user = _make_user()

    result = create_order(mock_db, user, _body())

    assert len(result.history) == 1
    assert result.history[0].from_status is None
    assert result.history[0].to_status == OrderStatus.AGUARDANDO_ANALISE
    assert result.history[0].changed_by == user.id


@pytest.mark.unit
def test_create_order_stores_environments_text(mock_db):
    result = create_order(mock_db, _make_user(), _body())

    assert result.environments == "Cozinha, Closet"


@pytest.mark.unit
def test_create_order_ignores_client_name_for_customer(mock_db):
    body = _body()
    body.client_name = "Spoofed Name"

    result = create_order(mock_db, _make_user(Role.CUSTOMER), body)

    assert result.client_name is None


@pytest.mark.unit
def test_create_order_keeps_client_name_for_admin(mock_db):
    body = _body()
    body.client_name = "Cliente WhatsApp"

    result = create_order(mock_db, _make_user(Role.ADMIN), body)

    assert result.client_name == "Cliente WhatsApp"


# ── list_orders ───────────────────────────────────────────────────────────────


@pytest.mark.unit
def test_list_orders_customer_sees_only_own_orders(mock_db):
    user = _make_user(Role.CUSTOMER)
    own_order = _make_order(user.id)
    base = mock_db.query.return_value.options.return_value
    q = base.filter.return_value
    q.count.return_value = 1
    q.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [own_order]

    items, total = list_orders(mock_db, user)

    base.filter.assert_called_once()
    assert items == [own_order]
    assert total == 1


@pytest.mark.unit
def test_list_orders_admin_sees_all_orders(mock_db):
    admin = _make_user(Role.ADMIN)
    orders = [_make_order(uuid.uuid4()), _make_order(uuid.uuid4())]
    q = mock_db.query.return_value.options.return_value
    q.count.return_value = 2
    q.order_by.return_value.offset.return_value.limit.return_value.all.return_value = orders

    items, total = list_orders(mock_db, admin)

    q.filter.assert_not_called()
    assert items == orders
    assert total == 2


# ── get_order ─────────────────────────────────────────────────────────────────


@pytest.mark.unit
def test_get_order_owner_can_read_own_order(mock_db):
    user = _make_user()
    order = _make_order(user.id)
    mock_db.get.return_value = order

    assert get_order(mock_db, user, order.id) == order


@pytest.mark.unit
def test_get_order_not_found_raises_404(mock_db):
    mock_db.get.return_value = None

    with pytest.raises(HTTPException) as exc:
        get_order(mock_db, _make_user(), uuid.uuid4())

    assert exc.value.status_code == 404


@pytest.mark.unit
def test_get_order_customer_cannot_read_another_users_order(mock_db):
    user = _make_user(Role.CUSTOMER)
    other_order = _make_order(uuid.uuid4())
    mock_db.get.return_value = other_order

    with pytest.raises(HTTPException) as exc:
        get_order(mock_db, user, other_order.id)

    assert exc.value.status_code == 403


# ── update_order_admin ────────────────────────────────────────────────────────


@pytest.mark.unit
def test_update_order_admin_advances_status_and_records_history(mock_db):
    admin = _make_user(Role.ADMIN)
    order = _make_order(uuid.uuid4(), OrderStatus.AGUARDANDO_ANALISE)
    mock_db.get.return_value = order

    result = update_order_admin(
        mock_db, admin, order.id, OrderUpdateAdmin(status=OrderStatus.EM_ORCAMENTO)
    )

    assert result.status == OrderStatus.EM_ORCAMENTO
    assert len(result.history) == 1
    assert result.history[-1].from_status == OrderStatus.AGUARDANDO_ANALISE
    assert result.history[-1].to_status == OrderStatus.EM_ORCAMENTO
    assert result.history[-1].changed_by == admin.id


@pytest.mark.unit
def test_update_order_admin_invalid_transition_raises_409(mock_db):
    admin = _make_user(Role.ADMIN)
    order = _make_order(uuid.uuid4(), OrderStatus.AGUARDANDO_ANALISE)
    mock_db.get.return_value = order

    with pytest.raises(HTTPException) as exc:
        update_order_admin(mock_db, admin, order.id, OrderUpdateAdmin(status=OrderStatus.CONCLUIDO))

    assert exc.value.status_code == 409


@pytest.mark.unit
def test_update_order_admin_aprovado_without_required_fields_raises_400(mock_db):
    admin = _make_user(Role.ADMIN)
    order = _make_order(uuid.uuid4(), OrderStatus.EM_ORCAMENTO)
    mock_db.get.return_value = order

    with pytest.raises(HTTPException) as exc:
        update_order_admin(mock_db, admin, order.id, OrderUpdateAdmin(status=OrderStatus.APROVADO))

    assert exc.value.status_code == 400


@pytest.mark.unit
def test_update_order_admin_aprovado_with_required_fields_succeeds(mock_db):
    admin = _make_user(Role.ADMIN)
    order = _make_order(uuid.uuid4(), OrderStatus.EM_ORCAMENTO)
    mock_db.get.return_value = order
    future = date.today() + timedelta(days=30)

    result = update_order_admin(
        mock_db,
        admin,
        order.id,
        OrderUpdateAdmin(status=OrderStatus.APROVADO, project_value=9000, due_date=future),
    )

    assert result.status == OrderStatus.APROVADO


@pytest.mark.unit
def test_update_order_admin_rejects_due_date_in_the_past(mock_db):
    admin = _make_user(Role.ADMIN)
    order = _make_order(uuid.uuid4(), OrderStatus.EM_ORCAMENTO)
    mock_db.get.return_value = order

    with pytest.raises(HTTPException) as exc:
        update_order_admin(mock_db, admin, order.id, OrderUpdateAdmin(due_date=date(2020, 1, 1)))

    assert exc.value.status_code == 400


@pytest.mark.unit
def test_update_order_admin_financial_fields_without_status_change_keep_history_empty(mock_db):
    admin = _make_user(Role.ADMIN)
    order = _make_order(uuid.uuid4(), OrderStatus.EM_ORCAMENTO)
    mock_db.get.return_value = order

    result = update_order_admin(
        mock_db, admin, order.id, OrderUpdateAdmin(project_value=8500, estimated_cost=5200)
    )

    assert result.project_value == 8500
    assert result.estimated_cost == 5200
    assert result.history == []


@pytest.mark.unit
def test_update_order_admin_not_found_raises_404(mock_db):
    mock_db.get.return_value = None

    with pytest.raises(HTTPException) as exc:
        update_order_admin(
            mock_db,
            _make_user(Role.ADMIN),
            uuid.uuid4(),
            OrderUpdateAdmin(status=OrderStatus.EM_ORCAMENTO),
        )

    assert exc.value.status_code == 404


@pytest.mark.unit
def test_update_order_admin_can_cancel_from_non_terminal(mock_db):
    admin = _make_user(Role.ADMIN)
    order = _make_order(uuid.uuid4(), OrderStatus.EM_PRODUCAO)
    mock_db.get.return_value = order

    result = update_order_admin(
        mock_db, admin, order.id, OrderUpdateAdmin(status=OrderStatus.CANCELADO)
    )

    assert result.status == OrderStatus.CANCELADO


# ── serialize_order (redaction) ───────────────────────────────────────────────


@pytest.mark.unit
def test_serialize_order_hides_financials_from_customer():
    order = _make_order(uuid.uuid4(), OrderStatus.EM_PRODUCAO)
    order.project_value = 8500
    order.estimated_cost = 5200
    order.admin_notes = "internal"

    view = serialize_order(order, viewer_is_admin=False)

    assert view.estimated_cost is None
    assert view.profit is None
    assert view.admin_notes is None
    assert view.project_value == 8500  # value is visible past AGUARDANDO_ANALISE


@pytest.mark.unit
def test_serialize_order_hides_project_value_while_awaiting_analysis():
    order = _make_order(uuid.uuid4(), OrderStatus.AGUARDANDO_ANALISE)
    order.project_value = 8500

    view = serialize_order(order, viewer_is_admin=False)

    assert view.project_value is None


@pytest.mark.unit
def test_serialize_order_admin_sees_financials_and_computed_profit():
    order = _make_order(uuid.uuid4(), OrderStatus.EM_PRODUCAO)
    order.project_value = 8500
    order.estimated_cost = 5200

    view = serialize_order(order, viewer_is_admin=True)

    assert view.estimated_cost == 5200
    assert view.profit == 3300


@pytest.mark.unit
def test_serialize_order_admin_sees_customer_identity():
    order = _make_order(uuid.uuid4(), OrderStatus.EM_ORCAMENTO)

    view = serialize_order(order, viewer_is_admin=True)

    assert view.customer_name == "Cliente Teste"
    assert view.customer_email == "cliente@test.com"


@pytest.mark.unit
def test_serialize_order_hides_customer_identity_from_customer():
    order = _make_order(uuid.uuid4(), OrderStatus.EM_ORCAMENTO)

    view = serialize_order(order, viewer_is_admin=False)

    assert view.customer_name is None
    assert view.customer_email is None


@pytest.mark.unit
def test_serialize_order_includes_history_entries():
    order = _make_order(uuid.uuid4(), OrderStatus.EM_ORCAMENTO)
    entry = OrderStatusHistory(
        from_status=None, to_status=OrderStatus.AGUARDANDO_ANALISE, note="Pedido criado"
    )
    entry.id = uuid.uuid4()
    entry.created_at = datetime.now(UTC)
    order.history.append(entry)

    view = serialize_order(order, viewer_is_admin=True)

    assert len(view.history) == 1
    assert view.history[0].to_status == OrderStatus.AGUARDANDO_ANALISE
