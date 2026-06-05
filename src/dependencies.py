import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from src.config import get_settings
from src.database import get_db
from src.models.user import User

_bearer = HTTPBearer()
_INVALID_TOKEN = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.secret_key.get_secret_value(),
            algorithms=[settings.algorithm],
        )
        user_id_str: str | None = payload.get("sub")
    except JWTError:
        raise _INVALID_TOKEN from None

    if user_id_str is None:
        raise _INVALID_TOKEN

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise _INVALID_TOKEN from None

    user = db.get(User, user_id)
    if user is None:
        raise _INVALID_TOKEN
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user
