import logging

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from src.config import get_settings
from src.database import get_db
from src.limiter import limiter
from src.models.user import User
from src.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    ResendVerificationRequest,
    TokenResponse,
    UserRead,
)
from src.services import auth as auth_service
from src.services.email import send_verification_email

router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger("src.routers.auth")


def _send_verification(user: User) -> None:
    try:
        token = auth_service.create_verification_token(user)
        send_verification_email(user.email, token)
    except Exception:  # noqa: BLE001 — a mail failure must not break the flow
        logger.exception("Failed to send verification e-mail to %s", user.email)


@router.post("/register", status_code=201, response_model=UserRead)
def register(body: RegisterRequest, db: Session = Depends(get_db)) -> User:
    user = auth_service.register_user(db, body)
    _send_verification(user)
    return user


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = auth_service.authenticate_user(db, body.email, body.password)
    return TokenResponse(access_token=auth_service.create_access_token(user))


@router.get("/verify")
def verify(token: str = Query(...), db: Session = Depends(get_db)) -> RedirectResponse:
    login_url = f"{get_settings().frontend_origin}/login"
    try:
        auth_service.verify_email(db, token)
    except Exception:  # noqa: BLE001 — render a friendly page either way
        return RedirectResponse(url=f"{login_url}?verified=0", status_code=303)
    return RedirectResponse(url=f"{login_url}?verified=1", status_code=303)


@router.post("/resend-verification")
@limiter.limit("5/minute")
def resend_verification(
    request: Request,
    body: ResendVerificationRequest,
    db: Session = Depends(get_db),
) -> dict:
    user = db.query(User).filter(User.email == body.email).first()
    if user is not None and not user.email_verified:
        _send_verification(user)
    # Uniform response — never reveal whether the e-mail exists.
    return {"detail": "Se o e-mail estiver cadastrado e pendente, enviamos um novo link."}
