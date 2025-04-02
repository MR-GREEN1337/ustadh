import pytest
from typing import Any, Dict

from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from src.main import app as main_app
from src.db import get_session

# Import all models to ensure they're registered with SQLModel

# Test database settings
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(name="engine")
def engine_fixture():
    """Create an in-memory SQLite test database engine."""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)


@pytest.fixture(name="session")
def session_fixture(engine):
    """Create a new database session for each test."""
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(engine):
    """Create a FastAPI TestClient with a test database session."""

    def get_test_session():
        with Session(engine) as session:
            yield session

    # Override the get_session dependency
    main_app.dependency_overrides[get_session] = get_test_session

    with TestClient(main_app) as client:
        yield client

    # Remove the override after the test
    main_app.dependency_overrides.clear()


@pytest.fixture(name="test_password")
def test_password_fixture() -> str:
    """Return a standard password for test users."""
    return "testpassword123"


@pytest.fixture(name="test_user_data")
def test_user_data_fixture(test_password: str) -> Dict[str, Any]:
    """Create test user data."""
    return {
        "email": "test@example.com",
        "username": "testuser",
        "full_name": "Test User",
        "password": test_password,
        "user_type": "student",
        "grade_level": "9th Grade",
        "school_type": "high_school",
    }


@pytest.fixture(name="test_parent_data")
def test_parent_data_fixture(test_password: str) -> Dict[str, Any]:
    """Create test parent data."""
    return {
        "email": "parent@example.com",
        "username": "parentuser",
        "full_name": "Parent User",
        "password": test_password,
        "user_type": "parent",
    }


@pytest.fixture(name="auth_headers")
def auth_headers_fixture(
    client: TestClient, test_user_data: Dict[str, Any]
) -> Dict[str, str]:
    """Create authentication headers for API requests."""
    # Register a test user
    client.post("/api/v1/auth/register", json=test_user_data)

    # Log in and get token
    login_data = {
        "username": test_user_data["username"],
        "password": test_user_data["password"],
    }
    response = client.post("/api/v1/auth/token", data=login_data)
    token = response.json()["access_token"]

    # Return headers with authentication
    return {"Authorization": f"Bearer {token}"}
