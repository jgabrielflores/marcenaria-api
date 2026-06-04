import logging
import sys

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pythonjsonlogger.jsonlogger import JsonFormatter
from slowapi.errors import RateLimitExceeded

from src.config import get_settings
from src.limiter import limiter
from src.routers.admin import router as admin_router
from src.routers.auth import router as auth_router
from src.routers.orders import router as orders_router
from src.routers.users import router as users_router


def _setup_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    if get_settings().env == "production":
        handler.setFormatter(JsonFormatter("%(asctime)s %(name)s %(levelname)s %(message)s"))
    else:
        handler.setFormatter(logging.Formatter("%(asctime)s %(name)s %(levelname)s %(message)s"))
    log = logging.getLogger("src")
    log.setLevel(logging.INFO)
    log.addHandler(handler)
    # Prevent double logging: uvicorn manages the root logger; we own only "src.*"
    log.propagate = False


_setup_logging()


async def _rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(status_code=429, content={"detail": f"Rate limit exceeded: {exc.detail}"})


app = FastAPI(
    title="Marcenaria API",
    description="Order management for a custom-furniture workshop.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[get_settings().frontend_origin],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)

app.state.limiter = limiter
# slowapi's handler signature (Request, RateLimitExceeded) is narrower than Starlette's
# (Request, Exception); this is the documented slowapi pattern.
app.add_exception_handler(RateLimitExceeded, _rate_limit_handler)  # type: ignore[arg-type]

app.include_router(auth_router)
app.include_router(orders_router)
app.include_router(admin_router)
app.include_router(users_router)


@app.get("/health", tags=["Health"])
def health() -> dict:
    return {"status": "ok"}
