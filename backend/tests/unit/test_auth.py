# backend/tests/unit/test_auth.py
from datetime import datetime, timedelta

from jose import jwt
from passlib.context import CryptContext

from src.api.endpoints.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
)
from src.core.settings import settings


def test_password_hashing():
    """Test that password hashing works correctly."""
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")  # noqa: F841

    # Test password hashing
    raw_password = "testpassword123"
    hashed_password = get_password_hash(raw_password)

    # Verify the hashed password doesn't match the raw password
    assert hashed_password != raw_password

    # Verify password verification works
    assert verify_password(raw_password, hashed_password) is True
    assert verify_password("wrongpassword", hashed_password) is False


def test_access_token_creation():
    """Test that JWT token creation works correctly."""
    # Create a token with test data
    test_data = {"sub": "testuser"}
    expires_delta = timedelta(minutes=30)

    token = create_access_token(test_data, expires_delta)

    # Verify the token is a string and not empty
    assert isinstance(token, str)
    assert token

    # Decode the token and verify its contents
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])

    # Check the subject matches
    assert decoded["sub"] == "testuser"

    # Check that expiration is set
    assert "exp" in decoded

    # Verify the expiration is in the future
    now = datetime.utcnow().timestamp()
    assert decoded["exp"] > now

    # Verify the expiration is within the expected range
    expected_exp = (datetime.utcnow() + expires_delta).timestamp()
    assert abs(decoded["exp"] - expected_exp) < 5  # Allow 5 seconds tolerance


def test_access_token_without_expiry():
    """Test that token creation works with default expiry."""
    test_data = {"sub": "testuser"}

    token = create_access_token(test_data)

    # Decode the token and verify its contents
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])

    # Check that expiration is set
    assert "exp" in decoded

    # Verify the expiration is set to the default (settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    now = datetime.utcnow().timestamp()  # noqa: F841
    expected_exp = (
        datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    ).timestamp()

    # Allow a tolerance of 5 seconds due to test execution time
    assert abs(decoded["exp"] - expected_exp) < 5
