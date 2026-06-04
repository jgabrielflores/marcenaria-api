import math
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies import get_current_user, require_admin
from src.models.order import OrderStatus
from src.models.user import User
from src.schemas.order import OrderCreate, OrderRead, OrderUpdateAdmin, PaginatedOrders
from src.services import order as order_service

router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])


@router.post("", status_code=201, response_model=OrderRead)
def create(
    body: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderRead:
    order = order_service.create_order(db, current_user, body)
    return order_service.serialize_order(order, viewer_is_admin=current_user.is_admin)


@router.get("", response_model=PaginatedOrders)
def list_all(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: OrderStatus | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaginatedOrders:
    items, total = order_service.list_orders(db, current_user, page, limit, status)
    return PaginatedOrders(
        items=[
            order_service.serialize_order(o, viewer_is_admin=current_user.is_admin) for o in items
        ],
        total=total,
        page=page,
        limit=limit,
        pages=max(1, math.ceil(total / limit)),
    )


@router.get("/{order_id}", response_model=OrderRead)
def get_one(
    order_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderRead:
    order = order_service.get_order(db, current_user, order_id)
    return order_service.serialize_order(order, viewer_is_admin=current_user.is_admin)


@router.patch("/{order_id}", response_model=OrderRead)
def update(
    order_id: uuid.UUID,
    body: OrderUpdateAdmin,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> OrderRead:
    order = order_service.update_order_admin(db, admin, order_id, body)
    return order_service.serialize_order(order, viewer_is_admin=True)
