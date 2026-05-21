from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies import require_admin
from src.models.user import User
from src.schemas.order import DashboardSummary
from src.services import order as order_service

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


@router.get("/dashboard", response_model=DashboardSummary)
def dashboard(
    year: int | None = Query(default=None, ge=2000, le=2100),
    month: int | None = Query(default=None, ge=1, le=12),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> DashboardSummary:
    return order_service.dashboard_summary(db, year=year, month=month)
