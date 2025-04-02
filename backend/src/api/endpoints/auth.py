from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Body, Cookie, Response
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import Session, select

from src.db import get_session
from src.core.settings import settings
from src.api.models.user import UserCreate, UserRead, Token, TokenData
from src.db.models.user import User

router = APIRouter(prefix="/auth", tags=["authentication"])

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")


# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt


async def get_current_user(
    session: Session = Depends(get_session),
    token: str = Depends(oauth2_scheme),
    access_token: Optional[str] = Cookie(None),
) -> User:
    """Get the current user based on the JWT token in authorization header or cookie."""
    # Use token from either Authorization header or cookie
    token_to_use = token or access_token
    if not token_to_use:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token_to_use, settings.SECRET_KEY, algorithms=["HS256"])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = session.exec(
        select(User).where(User.username == token_data.username)
    ).first()
    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Check if the current user is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    return current_user


# Auth endpoints
@router.post("/register", response_model=UserRead)
async def register(user_create: UserCreate, session: Session = Depends(get_session)):
    """Register a new user."""
    # Check if user with the same email or username already exists
    existing_email = session.exec(
        select(User).where(User.email == user_create.email)
    ).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    existing_username = session.exec(
        select(User).where(User.username == user_create.username)
    ).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken"
        )

    # Create new user
    hashed_password = get_password_hash(user_create.password)
    db_user = User(
        email=user_create.email,
        username=user_create.username,
        full_name=user_create.full_name,
        hashed_password=hashed_password,
        user_type=user_create.user_type,
        grade_level=user_create.grade_level
        if user_create.user_type == "student"
        else None,
        school_type=user_create.school_type
        if user_create.user_type == "student"
        else None,
    )

    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    return db_user


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    """OAuth2 compatible token login endpoint."""
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=dict)
async def login(
    response: Response,
    email: str = Body(...),
    password: str = Body(...),
    user_type: str = Body(...),
    session: Session = Depends(get_session),
):
    """Login endpoint with cookie support for frontend."""
    user = session.exec(
        select(User).where(User.email == email).where(User.user_type == user_type)
    ).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect credentials"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
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
        "token_type": "bearer",
    }


@router.post("/logout")
async def logout(response: Response):
    """Logout user by clearing the cookie."""
    response.delete_cookie(key="access_token")
    return {"detail": "Successfully logged out"}


@router.get("/me", response_model=UserRead)
async def get_user_me(current_user: User = Depends(get_current_active_user)):
    """Get current user details."""
    return current_user
