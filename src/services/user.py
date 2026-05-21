from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.models.user import User
from src.schemas.user import PasswordChange, UserUpdate
from src.services.auth import pwd_context


def update_me(db: Session, user: User, body: UserUpdate) -> User:
    user.name = body.name
    db.commit()
    db.refresh(user)
    return user


def change_password(db: Session, user: User, body: PasswordChange) -> None:
    if not pwd_context.verify(body.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    user.password_hash = pwd_context.hash(body.new_password)
    db.commit()
