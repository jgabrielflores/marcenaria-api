import uuid
from datetime import UTC, datetime
from decimal import Decimal

from fastapi import HTTPException
from fastapi import status as http_status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from src.models.order import Order, OrderStatus
from src.models.order_history import OrderStatusHistory
from src.models.user import User
from src.schemas.order import (
    DashboardSummary,
    OrderCreate,
    OrderHistoryEntry,
    OrderImageRead,
    OrderRead,
    OrderUpdateAdmin,
)

# Forward adjacency. EM_PRODUCAO may finish directly or schedule an installation.
_FORWARD: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.AGUARDANDO_ANALISE: {OrderStatus.EM_ORCAMENTO},
    OrderStatus.EM_ORCAMENTO: {OrderStatus.APROVADO},
    OrderStatus.APROVADO: {OrderStatus.EM_PRODUCAO},
    OrderStatus.EM_PRODUCAO: {OrderStatus.INSTALACAO_AGENDADA, OrderStatus.CONCLUIDO},
    OrderStatus.INSTALACAO_AGENDADA: {OrderStatus.CONCLUIDO},
}

_TERMINAL: frozenset[OrderStatus] = frozenset({OrderStatus.CONCLUIDO, OrderStatus.CANCELADO})

# Fields that must already be filled before an order may enter a given status.
_REQUIRED_FOR_STATUS: dict[OrderStatus, tuple[str, ...]] = {
    OrderStatus.APROVADO: ("project_value", "due_date"),
    OrderStatus.INSTALACAO_AGENDADA: ("install_date",),
}


def is_valid_transition(current: OrderStatus, new: OrderStatus) -> bool:
    """One step forward, one step back, or cancel from any non-terminal state."""
    if new == OrderStatus.CANCELADO:
        return current not in _TERMINAL
    if new in _FORWARD.get(current, set()):
        return True
    return current in _FORWARD.get(new, set())


def _get_order_or_404(db: Session, order_id: uuid.UUID) -> Order:
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


def serialize_order(order: Order, *, viewer_is_admin: bool) -> OrderRead:
    """Build the read shape, redacting admin-only fields for customers.

    Customers never receive estimated_cost / profit / admin_notes, and only see
    project_value once the order has left the AGUARDANDO_ANALISE stage.
    """
    show_value = viewer_is_admin or order.status != OrderStatus.AGUARDANDO_ANALISE

    profit: Decimal | None = None
    if viewer_is_admin and order.project_value is not None and order.estimated_cost is not None:
        profit = order.project_value - order.estimated_cost

    customer_name: str | None = None
    customer_email: str | None = None
    if viewer_is_admin:
        customer_name = order.client_name or order.user.name
        # A walk-in order carries its own optional e-mail; a registered
        # customer's e-mail comes from the user account.
        customer_email = order.client_email if order.client_name else order.user.email

    return OrderRead(
        id=order.id,
        order_number=order.order_number,
        user_id=order.user_id,
        customer_name=customer_name,
        customer_email=customer_email,
        status=order.status,
        whatsapp=order.whatsapp,
        cep=order.cep,
        city=order.city,
        state=order.state,
        address_line=order.address_line,
        environments=order.environments,
        furniture_types=order.furniture_types,
        observations=order.observations,
        project_value=order.project_value if show_value else None,
        estimated_cost=order.estimated_cost if viewer_is_admin else None,
        profit=profit,
        admin_notes=order.admin_notes if viewer_is_admin else None,
        due_date=order.due_date,
        install_date=order.install_date,
        created_at=order.created_at,
        updated_at=order.updated_at,
        history=[OrderHistoryEntry.model_validate(h) for h in order.history],
        images=[OrderImageRead.model_validate(img) for img in order.images],
    )


def create_order(db: Session, user: User, body: OrderCreate) -> Order:
    order = Order(
        user_id=user.id,
        # client_name / client_email are honored only for admin-created orders.
        client_name=body.client_name if user.is_admin else None,
        client_email=body.client_email if user.is_admin else None,
        whatsapp=body.whatsapp,
        cep=body.cep,
        city=body.city,
        state=body.state,
        address_line=body.address_line,
        environments=body.environments,
        furniture_types=body.furniture_types,
        observations=body.observations,
        status=OrderStatus.AGUARDANDO_ANALISE,
    )
    order.history.append(
        OrderStatusHistory(
            from_status=None,
            to_status=OrderStatus.AGUARDANDO_ANALISE,
            changed_by=user.id,
            note="Pedido criado",
        )
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def list_orders(
    db: Session,
    user: User,
    page: int = 1,
    limit: int = 20,
    status: OrderStatus | None = None,
) -> tuple[list[Order], int]:
    q = db.query(Order).options(
        selectinload(Order.history), selectinload(Order.images), selectinload(Order.user)
    )
    if not user.is_admin:
        q = q.filter(Order.user_id == user.id)
    elif status is not None:
        q = q.filter(Order.status == status)
    total = q.count()
    items = q.order_by(Order.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return items, total


def get_order(db: Session, user: User, order_id: uuid.UUID) -> Order:
    order = _get_order_or_404(db, order_id)
    if not user.is_admin and order.user_id != user.id:
        raise HTTPException(status_code=http_status.HTTP_403_FORBIDDEN, detail="Not your order")
    return order


def update_order_admin(
    db: Session, admin: User, order_id: uuid.UUID, body: OrderUpdateAdmin
) -> Order:
    order = _get_order_or_404(db, order_id)

    fields = body.model_dump(exclude_unset=True)
    new_status: OrderStatus | None = fields.pop("status", None)
    note: str | None = fields.pop("note", None)

    # A newly set scheduling date cannot be in the past (an existing past
    # date may be re-sent unchanged by the edit form — that is allowed).
    today = datetime.now(UTC).date()
    for date_field in ("due_date", "install_date"):
        if date_field in fields:
            value = fields[date_field]
            if value is not None and value != getattr(order, date_field) and value < today:
                raise HTTPException(
                    status_code=http_status.HTTP_400_BAD_REQUEST,
                    detail=f"{date_field} cannot be in the past",
                )

    for attr, value in fields.items():
        setattr(order, attr, value)

    if order.due_date and order.install_date and order.install_date < order.due_date:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="install_date cannot be before due_date",
        )

    if new_status is not None and new_status != order.status:
        if not is_valid_transition(order.status, new_status):
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail="Invalid status transition",
            )
        missing = [
            field
            for field in _REQUIRED_FOR_STATUS.get(new_status, ())
            if getattr(order, field) is None
        ]
        if missing:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required fields for {new_status.value}: {', '.join(missing)}",
            )
        order.history.append(
            OrderStatusHistory(
                from_status=order.status,
                to_status=new_status,
                changed_by=admin.id,
                note=note,
            )
        )
        order.status = new_status

    db.commit()
    db.refresh(order)
    return order


def dashboard_summary(
    db: Session, year: int | None = None, month: int | None = None
) -> DashboardSummary:
    counts = dict.fromkeys(OrderStatus, 0)
    for row_status, count in db.query(Order.status, func.count(Order.id)).group_by(Order.status):
        counts[row_status] = count

    today = datetime.now(UTC).date()
    if year is not None and month is not None:
        month_start = today.replace(year=year, month=month, day=1)
    else:
        month_start = today.replace(day=1)
    month_end = (
        month_start.replace(year=month_start.year + 1, month=1)
        if month_start.month == 12
        else month_start.replace(month=month_start.month + 1)
    )

    overdue_count = (
        db.query(func.count(Order.id))
        .filter(Order.due_date.is_not(None))
        .filter(Order.due_date < today)
        .filter(Order.status.notin_(_TERMINAL))
        .scalar()
        or 0
    )

    # Revenue and cost = project_value / estimated_cost of orders that
    # reached CONCLUIDO in the selected month.
    revenue_month, cost_month = (
        db.query(
            func.coalesce(func.sum(Order.project_value), 0),
            func.coalesce(func.sum(Order.estimated_cost), 0),
        )
        .join(OrderStatusHistory, OrderStatusHistory.order_id == Order.id)
        .filter(OrderStatusHistory.to_status == OrderStatus.CONCLUIDO)
        .filter(OrderStatusHistory.created_at >= month_start)
        .filter(OrderStatusHistory.created_at < month_end)
        .one()
    )

    recent = (
        db.query(Order)
        .options(selectinload(Order.history), selectinload(Order.images), selectinload(Order.user))
        .order_by(Order.created_at.desc())
        .limit(5)
        .all()
    )

    return DashboardSummary(
        counts_by_status=counts,
        revenue_month=revenue_month,
        cost_month=cost_month,
        profit_month=revenue_month - cost_month,
        overdue_count=overdue_count,
        recent_orders=[serialize_order(o, viewer_is_admin=True) for o in recent],
    )
