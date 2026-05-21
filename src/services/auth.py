import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from src.config import get_settings
from src.models.user import Role, User
from src.schemas.auth import RegisterRequest

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_VERIFY_PURPOSE = "email_verify"
_INVALID_VERIFICATION = HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Invalid or expired verification token",
)


def register_user(db: Session, request: RegisterRequest) -> User:
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        name=request.name,
        email=request.email,
        password_hash=pwd_context.hash(request.password),
        role=Role.CUSTOMER,
        email_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Dummy verify prevents timing-based user enumeration (OWASP ASVS v4 2.2.2)
        pwd_context.dummy_verify()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid credentials")
    if not pwd_context.verify(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid credentials")
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="EMAIL_NOT_VERIFIED"
        )
    return user


def create_access_token(user: User) -> str:
    settings = get_settings()
    payload = {
        "sub": str(user.id),
        "role": user.role.value,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes),
    }
    return jwt.encode(payload, settings.secret_key.get_secret_value(), algorithm=settings.algorithm)


def create_verification_token(user: User) -> str:
    settings = get_settings()
    payload = {
        "sub": str(user.id),
        "purpose": _VERIFY_PURPOSE,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    }
    return jwt.encode(payload, settings.secret_key.get_secret_value(), algorithm=settings.algorithm)


def verify_email(db: Session, token: str) -> User:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token, settings.secret_key.get_secret_value(), algorithms=[settings.algorithm]
        )
    except JWTError:
        raise _INVALID_VERIFICATION

    if payload.get("purpose") != _VERIFY_PURPOSE:
        raise _INVALID_VERIFICATION

    try:
        user_id = uuid.UUID(payload.get("sub", ""))
    except ValueError:
        raise _INVALID_VERIFICATION

    user = db.get(User, user_id)
    if user is None:
        raise _INVALID_VERIFICATION

    user.email_verified = True
    db.commit()
    return user
