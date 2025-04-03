from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Body,
    Cookie,
    Response,
    Request,
)
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger
from pydantic import EmailStr

from src.db import get_session
from src.core.settings import settings
from src.api.models.user import (
    UserCreate,
    UserRead,
    Token,
    TokenData,
    UserResponse,
    UserLogin,
)
from src.db.models.user import User
from src.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
)

router = APIRouter(prefix="/auth", tags=["authentication"])

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")


# Token dependency with user extraction
async def get_current_user(
    request: Request,
    session: AsyncSession = Depends(get_session),
    token: str = Depends(oauth2_scheme),
    access_token: Optional[str] = Cookie(None),
) -> User:
    """Get the current user based on the JWT token in authorization header or cookie."""
    # Use token from either Authorization header or cookie
    logger.debug(f"Auth header: {request.headers.get('Authorization')}")
    logger.debug(f"Cookies: {request.cookies}")

    token_to_use = token or access_token
    logger.debug(f"Token used: {token_to_use}")

    if not token_to_use:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # For additional security, check if request came from an allowed origin
    origin = request.headers.get("origin", "")
    if (
        origin
        and settings.ENFORCE_ORIGIN_CHECK
        and origin not in settings.ALLOWED_ORIGINS
    ):
        logger.warning(f"Suspicious request from unauthorized origin: {origin}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized request origin",
        )

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode and verify the token
        payload = jwt.decode(
            token_to_use, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )

        # Extract username and token type
        username: str = payload.get("sub")
        token_type: str = payload.get("type", "access")

        # Ensure we have a username and it's an access token
        if username is None:
            raise credentials_exception
        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token_data = TokenData(username=username)
    except JWTError as e:
        logger.error(f"JWT error: {str(e)}")
        raise credentials_exception

    # Query user from database
    result = await session.execute(
        select(User).where(User.username == token_data.username)
    )
    user = result.scalars().first()

    if user is None:
        logger.warning(f"User not found: {token_data.username}")
        raise credentials_exception

    # Check if user's token is revoked or account is locked
    if user.token_revoked_at and user.token_revoked_at > datetime.fromtimestamp(
        payload.get("iat", 0)
    ):
        logger.warning(f"Attempt to use revoked token for user: {user.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Check if the current user is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive"
        )
    return current_user


# Role-based authorization
def check_user_role(required_roles: list[str]):
    async def role_checker(current_user: User = Depends(get_current_active_user)):
        if current_user.user_type not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {', '.join(required_roles)}",
            )
        return current_user

    return role_checker


# Auth endpoints
@router.post("/register", response_model=UserResponse)
async def register(
    user_create: UserCreate, session: AsyncSession = Depends(get_session)
):
    """Register a new user account"""
    try:
        logger.info(user_create)
        # Check for existing email
        result = await session.execute(
            select(User).where(User.email == user_create.email)
        )
        existing_email = result.scalars().first()

        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Check for existing username
        result = await session.execute(
            select(User).where(User.username == user_create.username)
        )
        existing_username = result.scalars().first()

        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken"
            )

        # Validate and hash password
        if len(user_create.password) < settings.MIN_PASSWORD_LENGTH:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Password must be at least {settings.MIN_PASSWORD_LENGTH} characters",
            )

        hashed_password = get_password_hash(user_create.password)

        # Create user object
        db_user = User(
            email=user_create.email,
            username=user_create.username,
            full_name=user_create.full_name,
            hashed_password=hashed_password,
            user_type=user_create.user_type,
            grade_level=user_create.grade_level,
            school_type=user_create.school_type,
        )

        # Add to session and commit
        session.add(db_user)
        await session.commit()
        await session.refresh(db_user)

        logger.info(f"New user registered: {db_user.username} ({db_user.user_type})")
        return db_user

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error during user registration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during registration",
        )


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session),
):
    """OAuth2 compatible token login endpoint."""
    try:
        # Query user from database
        result = await session.execute(
            select(User).where(User.username == form_data.username)
        )
        user = result.scalars().first()

        # Check if user exists and password is correct
        if not user or not verify_password(form_data.password, user.hashed_password):
            # Update failed login attempts for rate limiting
            if user:
                user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
                user.last_login_attempt = datetime.utcnow()

                # Lock account after too many failed attempts
                if user.failed_login_attempts >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
                    user.is_active = False
                    logger.warning(
                        f"Account locked due to too many failed attempts: {user.username}"
                    )

                await session.commit()

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check if account is locked
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is locked. Please contact support.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Reset failed login counter on successful login
        user.failed_login_attempts = 0
        user.last_login = datetime.utcnow()
        await session.commit()

        # Create access and refresh tokens
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )

        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = create_refresh_token(
            data={"sub": user.username}, expires_delta=refresh_token_expires
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error during token generation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during authentication",
        )


@router.post("/login", response_model=dict)
async def login(
    response: Response,
    user_data: UserLogin,
    session: AsyncSession = Depends(get_session),
):
    """Login endpoint with cookie support for frontend."""
    try:
        # Query user from database
        result = await session.execute(
            select(User)
            .where(User.email == user_data.email)
            .where(User.user_type == user_data.user_type)
        )
        user = result.scalars().first()

        # Check if user exists and password is correct
        if not user or not verify_password(user_data.password, user.hashed_password):
            # Update failed login attempts for rate limiting
            if user:
                user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
                user.last_login_attempt = datetime.now(timezone.utc)

                # Lock account after too many failed attempts
                if user.failed_login_attempts >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
                    user.is_active = False
                    logger.warning(
                        f"Account locked due to too many failed attempts: {user.username}"
                    )

                await session.commit()

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email, password, or user type",
            )

        # Check if account is locked
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is locked. Please contact support.",
            )

        # Reset failed login counter on successful login
        user.failed_login_attempts = 0
        user.last_login = datetime.utcnow()
        await session.commit()

        # Create access and refresh tokens
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )

        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = create_refresh_token(
            data={"sub": user.username}, expires_delta=refresh_token_expires
        )

        # Set cookies for browser
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            samesite="lax",
            secure=not settings.DEBUG,  # Set to True in production
        )

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS
            * 86400,  # Convert days to seconds
            expires=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
            samesite="lax",
            secure=not settings.DEBUG,  # Set to True in production
        )

        # Return user data and token
        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "user_type": user.user_type,
                "grade_level": user.grade_level,
                "school_type": user.school_type,
                "is_active": user.is_active,
                "created_at": user.created_at,
            },
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login",
        )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    response: Response,
    refresh_token: str = Body(...),
    session: AsyncSession = Depends(get_session),
):
    """Refresh access token using refresh token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode and verify the refresh token
        payload = jwt.decode(
            refresh_token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )

        # Extract username and token type
        username: str = payload.get("sub")
        token_type: str = payload.get("type", "")

        # Ensure we have a username and it's a refresh token
        if username is None or token_type != "refresh":
            raise credentials_exception

        # Query user from database
        result = await session.execute(select(User).where(User.username == username))
        user = result.scalars().first()

        if user is None or not user.is_active:
            raise credentials_exception

        # Check if user's token is revoked
        if user.token_revoked_at and user.token_revoked_at > datetime.fromtimestamp(
            payload.get("iat", 0)
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Create new access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": username}, expires_delta=access_token_expires
        )

        # Set cookie for browser
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            expires=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            samesite="lax",
            secure=not settings.DEBUG,  # Set to True in production
        )

        return {"access_token": access_token, "token_type": "bearer"}

    except JWTError:
        raise credentials_exception
    except Exception as e:
        logger.error(f"Error during token refresh: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during token refresh",
        )


@router.post("/logout")
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Logout user by clearing cookies and invalidating tokens."""
    try:
        # Revoke all current tokens
        current_user.token_revoked_at = datetime.utcnow()
        await session.commit()

        # Clear cookies
        response.delete_cookie(key="access_token")
        response.delete_cookie(key="refresh_token")

        return {"detail": "Successfully logged out"}
    except Exception as e:
        logger.error(f"Error during logout: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during logout",
        )


@router.get("/me", response_model=UserRead)
async def get_user_me(current_user: User = Depends(get_current_active_user)):
    """Get current user details."""
    return current_user


@router.post("/change-password")
async def change_password(
    current_password: str = Body(...),
    new_password: str = Body(...),
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Change user password."""
    # Verify current password
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password"
        )

    # Validate new password
    if len(new_password) < settings.MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password must be at least {settings.MIN_PASSWORD_LENGTH} characters",
        )

    # Hash and update password
    current_user.hashed_password = get_password_hash(new_password)

    # Revoke all current tokens to force re-login with new password
    current_user.token_revoked_at = datetime.utcnow()

    await session.commit()
    return {"detail": "Password updated successfully"}


@router.post("/request-password-reset")
async def request_password_reset(
    email: EmailStr = Body(...), session: AsyncSession = Depends(get_session)
):
    """Request a password reset link."""
    # Find user by email
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalars().first()

    # Always return success even if email not found for security
    if not user:
        logger.info(f"Password reset requested for non-existent email: {email}")
        return {"detail": "If the email exists, a password reset link will be sent"}

    # Generate reset token
    reset_token_expires = timedelta(hours=24)
    reset_token = create_access_token(
        data={"sub": user.username, "type": "reset"}, expires_delta=reset_token_expires
    )

    # Store reset token hash for verification
    # In a real app, you would send this token via email
    # Here we just log it for demonstration
    logger.info(f"Password reset token for {email}: {reset_token}")

    return {"detail": "If the email exists, a password reset link will be sent"}


@router.post("/reset-password")
async def reset_password(
    token: str = Body(...),
    new_password: str = Body(...),
    session: AsyncSession = Depends(get_session),
):
    """Reset user password using reset token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token"
    )

    try:
        # Decode and verify the token
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )

        # Extract username and token type
        username: str = payload.get("sub")
        token_type: str = payload.get("type", "")

        # Ensure we have a username and it's a reset token
        if username is None or token_type != "reset":
            raise credentials_exception

        # Find user by username
        result = await session.execute(select(User).where(User.username == username))
        user = result.scalars().first()

        if user is None:
            raise credentials_exception

        # Validate new password
        if len(new_password) < settings.MIN_PASSWORD_LENGTH:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Password must be at least {settings.MIN_PASSWORD_LENGTH} characters",
            )

        # Hash and update password
        user.hashed_password = get_password_hash(new_password)

        # Revoke all current tokens
        user.token_revoked_at = datetime.utcnow()

        await session.commit()
        return {"detail": "Password reset successful"}

    except JWTError:
        raise credentials_exception
