"""Idempotent seed script — creates the first ADMIN user from env vars.

Usage:
    docker-compose exec api python -m src.scripts.seed_admin
"""

from sqlalchemy.orm import Session

from src.config import get_settings
from src.database import SessionLocal
from src.models.user import Role, User
from src.services.auth import pwd_context


def seed(db: Session | None = None) -> None:
    """Create the first ADMIN user from env vars. Idempotent.

    Accepts an optional session so the seed can be exercised inside a test
    transaction; in production it opens (and owns) its own session.
    """
    settings = get_settings()
    email = settings.admin_email
    password = settings.admin_password.get_secret_value()

    owns_session = db is None
    if db is None:
        db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            if not existing.email_verified:
                existing.email_verified = True
                db.commit()
            print(f"Admin already exists: {email}")
            return

        admin = User(
            name="Admin",
            email=email,
            password_hash=pwd_context.hash(password),
            role=Role.ADMIN,
            email_verified=True,
        )
        db.add(admin)
        db.commit()
        print(f"Admin created: {email}")
    finally:
        if owns_session:
            db.close()


if __name__ == "__main__":  # pragma: no cover
    seed()
