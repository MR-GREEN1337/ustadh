from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from jose import jwt

from src.core.settings import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate a password hash."""
    return pwd_context.hash(password)


def create_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
    token_type: str = "access",
) -> str:
    """Create a JWT token with expiration."""
    to_encode = data.copy()

    # Set expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Default expiration based on token type
        if token_type == "access":
            expire = datetime.utcnow() + timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )
        elif token_type == "refresh":
            expire = datetime.utcnow() + timedelta(
                days=settings.REFRESH_TOKEN_EXPIRE_DAYS
            )
        else:  # For password reset or other tokens
            expire = datetime.utcnow() + timedelta(hours=24)

    # Add token claims
    to_encode.update(
        {
            "exp": expire,
            "iat": datetime.utcnow(),  # Issued at time
            "type": token_type,
        }
    )

    # Create and return the token
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def create_access_token(
    data: Dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """Create an access token."""
    return create_token(data, expires_delta, token_type="access")


def create_refresh_token(
    data: Dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """Create a refresh token."""
    return create_token(data, expires_delta, token_type="refresh")


def is_strong_password(password: str) -> bool:
    """
    Check if a password meets the strength requirements.
    Returns True if the password is strong enough, False otherwise.
    """
    if len(password) < settings.MIN_PASSWORD_LENGTH:
        return False

    # Check for at least one uppercase letter
    if not any(c.isupper() for c in password):
        return False

    # Check for at least one lowercase letter
    if not any(c.islower() for c in password):
        return False

    # Check for at least one digit
    if not any(c.isdigit() for c in password):
        return False

    # Check for at least one special character
    special_chars = "!@#$%^&*()_-+={}[]\\|:;\"'<>,.?/"
    if not any(c in special_chars for c in password):
        return False

    return True
