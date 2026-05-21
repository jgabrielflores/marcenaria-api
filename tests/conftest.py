import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from src.config import get_settings
from src.database import get_db
from src.main import app
from src.models.user import Role, User
from src.services.auth import create_access_token, pwd_context

ORDER_PAYLOAD = {
    "whatsapp": "11999999999",
    "cep": "01001-000",
    "city": "São Paulo",
    "state": "SP",
    "environments": "Cozinha",
    "furniture_types": "armário",
    "observations": "Projeto de teste",
}


@pytest.fixture(scope="session")
def _engine():
    return create_engine(get_settings().database_url, pool_pre_ping=True)


@pytest.fixture
def db(_engine):
    """Each test gets an isolated transaction that is rolled back on teardown."""
    with _engine.connect() as conn:
        trans = conn.begin()
        session = Session(conn, join_transaction_mode="create_savepoint")
        yield session
        session.close()
        trans.rollback()


@pytest.fixture
def client(db):
    def _get_db():
        yield db

    app.dependency_overrides[get_db] = _get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def customer_headers(db, client):
    user = User(
        name="Alice",
        email="alice@test.com",
        password_hash=pwd_context.hash("password123"),
        role=Role.CUSTOMER,
        email_verified=True,
    )
    db.add(user)
    db.flush()
    token = create_access_token(user)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(db, client):
    admin = User(
        name="Admin",
        email="admin@test.com",
        password_hash=pwd_context.hash("admin123"),
        role=Role.ADMIN,
        email_verified=True,
    )
    db.add(admin)
    db.flush()
    token = create_access_token(admin)
    return {"Authorization": f"Bearer {token}"}
