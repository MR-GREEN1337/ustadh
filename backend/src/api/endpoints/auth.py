from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Tuple

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
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from loguru import logger

from src.db import get_session
from src.core.settings import settings

from src.api.models.auth import (
    UserCreate,
    TokenData,
    UserResponse,
    UserLogin,
    SchoolUserLogin,
    Token,
)
from src.db.models.user import User, Guardian
from src.db.models.school import School, SchoolStudent, SchoolStaff
from src.db.models.professor import SchoolProfessor
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
        user_type: str = payload.get("user_type", "student")
        school_id: Optional[int] = payload.get("school_id")

        # Ensure we have a username and it's an access token
        if username is None:
            raise credentials_exception
        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token_data = TokenData(
            username=username, user_type=user_type, school_id=school_id
        )
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


# School-specific authorization
async def get_school_admin(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Check if user is a school admin and return both user and school."""
    if current_user.user_type != "school_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint requires school administrator privileges",
        )

    # Get the school this admin is associated with
    result = await session.execute(
        select(School).where(School.admin_user_id == current_user.id)
    )
    school = result.scalars().first()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No associated school found for this admin",
        )

    return {"user": current_user, "school": school}


async def get_admin_user(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
) -> Tuple[User, Optional[int]]:
    """
    Check if the current user is an administrator.
    This dependency is used to protect admin-only endpoints.

    Returns a tuple of (user, school_id) where school_id might be None for platform admins.
    Raises 403 Forbidden if the user doesn't have admin privileges.
    """
    # Check if user has admin user_type
    if current_user.user_type != "school_admin":
        # If not directly an admin, check if they're a school staff with admin privileges
        if current_user.user_type == "staff" or current_user.user_type == "teacher":
            # Query for SchoolStaff record
            result = await session.execute(
                select(SchoolStaff)
                .where(SchoolStaff.user_id == current_user.id)
                .where(SchoolStaff.staff_type.in_(["admin", "principal", "director"]))
                .where(SchoolStaff.is_active)
            )
            staff = result.scalars().first()

            # If no admin staff record found, deny access
            if not staff:
                logger.warning(
                    f"User {current_user.username} attempted to access admin endpoint without privileges"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User does not have administrator privileges",
                )

            logger.info(
                f"Staff user {current_user.username} accessing as school admin for school ID: {staff.school_id}"
            )
            return current_user, staff.school_id
        else:
            # Neither admin user_type nor staff with admin privileges
            logger.warning(
                f"User {current_user.username} attempted to access admin endpoint without privileges"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have administrator privileges",
            )

    # For users with admin user_type, check if they have a school staff assignment
    # This is for platform admins who might be managing specific schools
    result = await session.execute(
        select(SchoolStaff)
        .where(SchoolStaff.user_id == current_user.id)
        .where(SchoolStaff.is_active)
    )
    staff = result.scalars().first()

    if staff:
        logger.info(
            f"Admin user {current_user.username} accessing as school admin for school ID: {staff.school_id}"
        )
        return current_user, staff.school_id
    else:
        # Admin without a school association - might be a platform-level admin
        logger.info(
            f"Admin user {current_user.username} accessing as platform admin (no school association)"
        )
        return current_user, None


# Auth endpoints
@router.post("/register", response_model=UserResponse)
async def register(
    user_create: UserCreate, session: AsyncSession = Depends(get_session)
):
    """Register a new user account"""
    try:
        logger.info(
            f"Registering new user: {user_create.email} ({user_create.user_type})"
        )

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
            has_onboarded=user_create.has_onboarded or False,
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


@router.post("/login", response_model=dict)
async def login(
    response: Response,
    user_data: UserLogin,
    session: AsyncSession = Depends(get_session),
):
    """Login endpoint for regular users with cookie support for frontend."""
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
                # Convert timezone-aware datetime to timezone-naive before storing
                naive_now = datetime.now(timezone.utc).replace(tzinfo=None)
                user.last_login_attempt = naive_now
                await session.commit()

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

        # Create access and refresh tokens with improved token data
        token_data = {
            "sub": user.username,
            "username": user.username,
            "user_id": user.id,
            "user_type": user.user_type,
            "school_id": None,  # Regular users don't have a school_id
        }

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data=token_data,
            expires_delta=access_token_expires,
        )

        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = create_refresh_token(
            data=token_data,
            expires_delta=refresh_token_expires,
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
        user_data = {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "user_type": user.user_type,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "has_onboarded": user.has_onboarded,
            "education_level": user.education_level,
            "school_type": user.school_type,
            "region": user.region,
            "academic_track": user.academic_track,
            "learning_style": user.learning_style,
            "study_habits": user.study_habits or [],
            "academic_goals": user.academic_goals or [],
        }

        return {
            "user": user_data,
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


@router.post("/school-login", response_model=dict)
async def school_login(
    response: Response,
    login_data: SchoolUserLogin,
    session: AsyncSession = Depends(get_session),
):
    """Login endpoint for school users (students, professors, staff)."""
    try:
        # Log the request for debugging
        logger.info(
            f"School login attempt: school_code={login_data.school_code}, user_type={login_data.user_type}"
        )

        # First, find the school by code
        school_result = await session.execute(
            select(School).where(School.code == login_data.school_code)
        )
        school = school_result.scalars().first()
        print(school)

        if not school:
            logger.warning(f"School not found with code: {login_data.school_code}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid school code",
            )

        logger.info(f"School found: {school.name} (ID: {school.id})")

        # Based on user type, check the appropriate table
        user = None
        school_user = None
        user_type = login_data.user_type

        if user_type == "school_student":
            # Check the SchoolStudent table
            logger.info(
                f"Looking for student with ID: {login_data.identifier} in school: {school.id}"
            )
            result = await session.execute(
                select(SchoolStudent).where(
                    and_(
                        SchoolStudent.school_id == school.id,
                        SchoolStudent.student_id == login_data.identifier,
                        SchoolStudent.is_active,
                    )
                )
            )
            school_user = result.scalars().first()
            if school_user:
                logger.info(f"Found school student with user_id: {school_user.user_id}")
                user_result = await session.execute(
                    select(User).where(User.id == school_user.user_id)
                )
                user = user_result.scalars().first()
            else:
                logger.warning(f"Student not found with ID: {login_data.identifier}")

        elif user_type == "school_professor":
            # Check the SchoolProfessor table
            logger.info(
                f"Looking for professor with ID: {login_data.identifier} in school: {school.id}"
            )
            result = await session.execute(
                select(SchoolProfessor).where(
                    and_(
                        SchoolProfessor.school_id == school.id,
                        SchoolProfessor.id == login_data.identifier,
                        SchoolProfessor.is_active,
                    )
                )
            )
            school_user = result.scalars().first()
            if school_user:
                logger.info(
                    f"Found school professor with user_id: {school_user.user_id}"
                )
                user_result = await session.execute(
                    select(User).where(User.id == school_user.user_id)
                )
                user = user_result.scalars().first()
            else:
                logger.warning(f"Professor not found with ID: {login_data.identifier}")

        elif user_type == "school_staff" or user_type == "school_admin":
            # Check the SchoolStaff table
            staff_type_condition = (
                SchoolStaff.staff_type == "admin"
                if user_type == "school_admin"
                else SchoolStaff.staff_type != "admin"
            )
            logger.info(
                f"Looking for staff with ID: {login_data.identifier} in school: {school.id}, staff_type: {user_type}"
            )

            result = await session.execute(
                select(SchoolStaff).where(
                    and_(
                        SchoolStaff.school_id == school.id,
                        SchoolStaff.employee_id == login_data.identifier,
                        SchoolStaff.is_active,
                        staff_type_condition,
                    )
                )
            )
            school_user = result.scalars().first()
            if school_user:
                logger.info(f"Found school staff with user_id: {school_user.user_id}")
                user_result = await session.execute(
                    select(User).where(User.id == school_user.user_id)
                )
                user = user_result.scalars().first()
            else:
                logger.warning(f"Staff not found with ID: {login_data.identifier}")
        else:
            logger.warning(f"Invalid user type: {user_type}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid user type: {user_type}",
            )

        # Check if user exists
        if not user:
            logger.warning(
                f"User not found for given identifier: {login_data.identifier}"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials - user not found",
            )

        # Check if password is correct
        if not verify_password(login_data.password, user.hashed_password):
            logger.warning(f"Invalid password for user: {user.username}")

            # Update failed login attempts for rate limiting
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            user.last_login_attempt = datetime.now(timezone.utc).replace(tzinfo=None)

            # Lock account after too many failed attempts
            if user.failed_login_attempts >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
                user.is_active = False
                logger.warning(
                    f"Account locked due to too many failed attempts: {user.username}"
                )

            await session.commit()

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials - incorrect password",
            )

        # Check if account is locked
        if not user.is_active:
            logger.warning(f"Attempt to login to locked account: {user.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is locked. Please contact your school administrator.",
            )

        # Reset failed login counter on successful login
        user.failed_login_attempts = 0
        user.last_login = datetime.utcnow()
        await session.commit()

        logger.info(f"Authentication successful for user: {user.username}")

        # Create access and refresh tokens with school information
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": user.username,
                "username": user.username,
                "user_id": user.id,
                "user_type": user_type,
                "school_id": school.id,
            },
            expires_delta=access_token_expires,
        )

        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = create_refresh_token(
            data={
                "sub": user.username,
                "username": user.username,
                "user_id": user.id,
                "user_type": user_type,
                "school_id": school.id,
            },
            expires_delta=refresh_token_expires,
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
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
            expires=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
            samesite="lax",
            secure=not settings.DEBUG,  # Set to True in production
        )

        # Prepare additional data based on user type
        additional_data = {}

        if user_type == "school_student":
            additional_data = {
                "student_id": school_user.student_id,
                "education_level": school_user.education_level,
                "academic_track": school_user.academic_track,
                "enrollment_date": school_user.enrollment_date,
            }
        elif user_type == "school_professor":
            additional_data = {
                "title": school_user.title,
                "academic_rank": school_user.academic_rank,
                "specializations": school_user.specializations,
                "department_id": school_user.department_id,
            }

        logger.info(
            f"Login successful for {user_type}: {user.username} in school: {school.name}"
        )

        # Return user data with school information and token
        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "user_type": user_type,  # Using the school-specific user type
                "is_active": user.is_active,
                "created_at": user.created_at,
                "school": {
                    "id": school.id,
                    "name": school.name,
                    "code": school.code,
                    "type": school.school_type,
                },
                **additional_data,
            },
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error during school login: {str(e)}")
        # Print stack trace for debugging
        import traceback

        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login",
        )


@router.get("/me", response_model=dict)
async def get_user_me(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Get current user details."""
    # Extract token data to check if it's a school user
    auth_header = getattr(current_user, "authorization", None)
    school_id = None
    user_type = current_user.user_type

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
            )
            school_id = payload.get("school_id")
            user_type = payload.get("user_type", user_type)
        except Exception:
            pass

    # Base user data
    user_data = {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "user_type": user_type,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "has_onboarded": current_user.has_onboarded,
        "education_level": current_user.education_level,
        "school_type": current_user.school_type,
        "region": current_user.region,
        "academic_track": current_user.academic_track,
        "learning_style": current_user.learning_style,
        "study_habits": current_user.study_habits or [],
        "academic_goals": current_user.academic_goals or [],
    }

    # Add school info for school users
    if school_id and user_type in [
        "school_student",
        "school_professor",
        "school_staff",
        "school_admin",
    ]:
        # Get school details
        result = await session.execute(select(School).where(School.id == school_id))
        school = result.scalars().first()

        if school:
            user_data["school"] = {
                "id": school.id,
                "name": school.name,
                "code": school.code,
                "type": school.school_type,
            }

            # Get role-specific details
            if user_type == "school_student":
                student_result = await session.execute(
                    select(SchoolStudent).where(
                        and_(
                            SchoolStudent.user_id == current_user.id,
                            SchoolStudent.school_id == school_id,
                        )
                    )
                )
                student = student_result.scalars().first()
                if student:
                    user_data["school_profile"] = {
                        "student_id": student.student_id,
                        "education_level": student.education_level,
                        "academic_track": student.academic_track,
                        "enrollment_date": student.enrollment_date,
                    }

            elif user_type == "school_professor":
                professor_result = await session.execute(
                    select(SchoolProfessor).where(
                        and_(
                            SchoolProfessor.user_id == current_user.id,
                            SchoolProfessor.school_id == school_id,
                        )
                    )
                )
                professor = professor_result.scalars().first()
                if professor:
                    user_data["school_profile"] = {
                        "title": professor.title,
                        "academic_rank": professor.academic_rank,
                        "specializations": professor.specializations,
                        "department_id": professor.department_id,
                    }

    # For regular students, check if they have any guardians
    if user_type == "student":
        guardian_result = await session.execute(
            select(Guardian).where(Guardian.student_id == current_user.id)
        )
        guardians: List[Guardian] = guardian_result.scalars().all()

        if guardians:
            guardian_data: List[Dict[str, Any]] = []
            for guardian in guardians:
                parent_result = await session.execute(
                    select(User).where(User.id == guardian.parent_id)
                )
                parent: User = parent_result.scalars().first()
                if parent:
                    guardian_data.append(
                        {
                            "id": guardian.id,
                            "relationship": guardian.relationship,
                            "parent_id": guardian.parent_id,
                            "parent_name": parent.full_name,
                            "can_view_progress": guardian.can_view_progress,
                            "can_view_messages": guardian.can_view_messages,
                            "can_edit_profile": guardian.can_edit_profile,
                        }
                    )

            user_data["guardians"] = guardian_data

    return user_data


@router.get("/onboarding-status")
async def get_onboarding_status(
    current_user: User = Depends(get_current_active_user),
):
    """Check if user has completed onboarding."""
    return {
        "has_onboarded": current_user.has_onboarded,
        "user_type": current_user.user_type,
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    response: Response,
    refresh_data: dict = Body(...),
    session: AsyncSession = Depends(get_session),
):
    """Refresh access token using refresh token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Extract the refresh_token from the request body
    refresh_token = refresh_data.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="refresh_token is required",
        )

    try:
        # Decode and verify the refresh token
        payload = jwt.decode(
            refresh_token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )

        # Rest of the function remains the same...
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
