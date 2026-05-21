from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.dependencies import get_current_user
from src.models.user import User
from src.schemas.auth import UserRead
from src.schemas.user import PasswordChange, UserUpdate
from src.services import user as user_service

router = APIRouter(prefix="/api/v1/me", tags=["Profile"])


@router.get("", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("", response_model=UserRead)
def update_me(
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    return user_service.update_me(db, current_user, body)


@router.patch("/password", status_code=204)
def change_password(
    body: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    user_service.change_password(db, current_user, body)
