from typing import List, Optional, Dict, Any, Union, Tuple
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    BackgroundTasks,
    UploadFile,
    File,
)
from sqlmodel import select
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import csv
import io
import uuid
import resend
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.engine import Result

from src.db.postgresql import get_session
from src.db.models.school import (
    School,
    Department,
    SchoolStaff,
    SchoolCourse,
    SchoolClass,
    SchoolStudent,
    ClassEnrollment,
)
from src.db.models.professor import SchoolProfessor
from src.db.models.user import User
from src.api.endpoints.auth import get_current_active_user
from src.core.settings import settings
from src.core.security import get_password_hash, create_access_token

router = APIRouter(prefix="/school-onboarding", tags=["school-onboarding"])

# Initialize Resend for email
resend.api_key = settings.RESEND_API_KEY


# ============ Pydantic Models for Request/Response ============


class DepartmentCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    education_level: Optional[str] = None


class ProfessorInvite(BaseModel):
    email: EmailStr
    full_name: str
    title: str  # Prof., Dr., etc.
    specializations: List[str]
    academic_rank: str  # Assistant Professor, Associate Professor, etc.
    department_id: Optional[Union[int, str]] = None
    preferred_subjects: Optional[List[str]] = None


class AdminInvite(BaseModel):
    email: EmailStr
    full_name: str
    role: str  # admin, academic_coordinator, etc.
    permissions: List[str] = ["view_dashboard", "manage_staff", "manage_students"]


class BulkInviteResponse(BaseModel):
    success_count: int
    failed_emails: List[Dict[str, str]]
    message: str


class SchoolProfile(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    color_scheme: Optional[str] = None
    education_levels: Optional[List[str]] = None


class OnboardingStatus(BaseModel):
    school_id: int
    profile_completed: bool
    departments_created: bool
    admin_staff_invited: bool
    professors_invited: bool
    courses_created: bool
    classes_created: bool
    students_imported: bool
    onboarding_completed: bool
    completion_percentage: int


# ============ Helper Functions ============


async def send_professor_invitation_email(
    background_tasks: BackgroundTasks,
    recipient_email: str,
    recipient_name: str,
    school_name: str,
    school_code: str,
    professor_id: int,
    temp_password: str,
    role: str,
):
    """Send invitation email to professors with school code, professor ID and temp password."""

    # Login URL (direct to login page instead of token-based activation)
    login_url = f"{settings.FRONTEND_URL}/login"

    # Email content with direct login credentials
    email_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Welcome to {school_name}</h2>
        <p>Hello {recipient_name},</p>
        <p>You have been invited to join the digital platform for {school_name} as a <strong>{role}</strong>.</p>
        <p>Your login information:</p>
        <ul>
            <li><strong>School Code:</strong> {school_code}</li>
            <li><strong>Professor ID:</strong> PROF-{professor_id}</li>
            <li><strong>Email:</strong> {recipient_email}</li>
            <li><strong>Temporary Password:</strong> {temp_password}</li>
        </ul>
        <p>For security reasons, please change your password after your first login.</p>
        <div style="margin: 30px 0;">
            <a href="{login_url}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Login to Your Account
            </a>
        </div>
        <p>If you have any questions, please contact the school administration.</p>
        <p>Best regards,<br>The {school_name} Team</p>
    </div>
    """

    # Send the email asynchronously
    try:
        params = {
            "from": f"{school_name} <onboarding@resend.dev>",
            "to": recipient_email,
            "subject": f"Invitation to join {school_name} as Faculty",
            "html": email_html,
        }

        # Use background task to send email asynchronously
        background_tasks.add_task(resend.Emails.send, params)
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False


async def send_invitation_email(
    background_tasks: BackgroundTasks,
    recipient_email: str,
    recipient_name: str,
    school_name: str,
    school_code: str,
    school_id: int,
    role: str,
    invitation_link: str,
):
    """Send invitation email to staff or faculty members with school code and ID."""

    # Email subject based on role
    subject_map = {
        "professor": f"Invitation to join {school_name} as Faculty",
        "admin": f"Admin Access Invitation for {school_name}",
        "staff": f"Staff Invitation for {school_name}",
        "student": f"Student Invitation for {school_name}",
    }

    # Email content with school code and ID instead of password
    email_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Welcome to {school_name}</h2>
        <p>Hello {recipient_name},</p>
        <p>You have been invited to join the digital platform for {school_name} as a <strong>{role}</strong>.</p>
        <p>Your school information:</p>
        <ul>
            <li><strong>School Code:</strong> {school_code}</li>
            <li><strong>School ID:</strong> {school_id}</li>
        </ul>
        <p>You'll need this information when activating your account.</p>
        <div style="margin: 30px 0;">
            <a href="{invitation_link}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Accept Invitation
            </a>
        </div>
        <p>If you have any questions, please contact the school administration.</p>
        <p>Best regards,<br>The {school_name} Team</p>
    </div>
    """

    # Send the email asynchronously
    try:
        params = {
            "from": f"{school_name} <onboarding@resend.dev>",
            "to": recipient_email,
            "subject": subject_map.get(
                role.lower(), f"Invitation to join {school_name}"
            ),
            "html": email_html,
        }

        # Use background task to send email asynchronously
        background_tasks.add_task(resend.Emails.send, params)
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False


async def create_user_account(
    session: AsyncSession, email: str, full_name: str, user_type: str, school_id: int
) -> Tuple[User, str, str]:
    """Create a new user account with a temporary password."""

    # Generate a temporary password
    temp_password = str(uuid.uuid4())[:8]
    hashed_password = get_password_hash(temp_password)

    # Generate a username based on email
    base_username = email.split("@")[0]
    username = base_username

    # Check if username exists, if so, add a number
    count = 1
    while (
        await session.execute(select(User).where(User.username == username))
    ).first():
        username = f"{base_username}{count}"
        count += 1

    # Create the user
    new_user = User(
        email=email,
        username=username,
        full_name=full_name,
        hashed_password=hashed_password,
        user_type=user_type,
        is_active=True,
        is_verified=True,  # Pre-verified since invited by school admin
        has_onboarded=True,  # Skip individual onboarding for school staff
        locale="en",  # Default language, can be changed by user
    )

    try:
        session.add(new_user)
        await session.commit()
        session.refresh(new_user)

        # Create a token for direct login
        access_token = create_access_token(
            data={"sub": new_user.email, "user_id": new_user.id},
            expires_delta=timedelta(days=7),  # Longer expiration for initial setup
        )

        return new_user, temp_password, access_token
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email {email} already exists",
        )


async def calculate_onboarding_status(
    school: School, session: AsyncSession
) -> OnboardingStatus:
    """Calculate the current onboarding status and completion percentage for a school."""

    # Check if profile is completed (all required fields have values)
    profile_completed = bool(
        school.name
        and school.address
        and school.city
        and school.contact_email
        and school.education_levels
    )

    # Check if departments exist
    result: Result[Department] = await session.execute(
        select(Department).where(Department.school_id == school.id)
    )
    departments_exist = result.scalar_one_or_none() is not None

    # Check if admin staff have been invited
    result = await session.execute(
        select(SchoolStaff).where(
            SchoolStaff.school_id == school.id,
            SchoolStaff.staff_type.in_(["admin", "academic_coordinator", "principal"]),
        )
    )
    admin_staff_exist = result.scalar_one_or_none() is not None

    # Check if professors have been invited
    result = await session.execute(
        select(SchoolProfessor).where(SchoolProfessor.school_id == school.id)
    )
    professors_exist = result.scalar_one_or_none() is not None

    # Check if courses are created
    result = await session.execute(
        select(SchoolCourse).where(SchoolCourse.school_id == school.id)
    )
    courses_exist = result.scalar_one_or_none() is not None

    # Check if classes are created
    result = await session.execute(
        select(SchoolClass).where(SchoolClass.school_id == school.id)
    )
    classes_exist = result.scalar_one_or_none() is not None

    # Calculate completion percentage
    completion_steps = [
        profile_completed,
        departments_exist,
        admin_staff_exist,
        professors_exist,
        courses_exist,
        classes_exist,
    ]

    completion_percentage = int(
        (sum(1 for step in completion_steps if step) / len(completion_steps)) * 100
    )

    # Determine if onboarding is complete (all required steps done)
    onboarding_completed = (
        completion_percentage >= 80
    )  # Consider 80% as "complete" for now

    return OnboardingStatus(
        school_id=school.id,
        profile_completed=profile_completed,
        departments_created=departments_exist,
        admin_staff_invited=admin_staff_exist,
        professors_invited=professors_exist,
        courses_created=courses_exist,
        classes_created=classes_exist,
        students_imported=False,  # This would be set in a separate endpoint
        onboarding_completed=onboarding_completed,
        completion_percentage=completion_percentage,
    )


# ============ API Endpoints ============


@router.get("/status", response_model=OnboardingStatus)
async def get_onboarding_status(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Get the current status of the school onboarding process."""

    # Ensure user is a school admin
    if current_user.user_type != "school_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school administrators can access this endpoint",
        )

    # print("Current user:", current_user)
    # Get the school associated with this admin
    result: Result[School] = await session.execute(
        select(School).where(School.admin_user_id == current_user.id)
    )
    school = result.scalar_one_or_none()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this administrator",
        )

    # Calculate and return the onboarding status
    return await calculate_onboarding_status(school, session)


@router.get("/profile", response_model=School)
async def get_school_profile(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Get the school profile information."""

    # Ensure user is a school admin
    if current_user.user_type != "school_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school administrators can view school profile",
        )

    # Get the school associated with this admin
    result: Result[School] = await session.execute(
        select(School).where(School.admin_user_id == current_user.id)
    )
    school = result.scalar_one_or_none()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this administrator",
        )

    return school


@router.put("/profile", response_model=School)
async def update_school_profile(
    profile: SchoolProfile,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Update the school profile information."""

    # Ensure user is a school admin
    if current_user.user_type != "school_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school administrators can update school profile",
        )

    # Get the school associated with this admin
    result: Result[School] = await session.execute(
        select(School).where(School.admin_user_id == current_user.id)
    )
    school = result.scalar_one_or_none()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this administrator",
        )

    # Update fields only if provided
    update_data = profile.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(school, key, value)

    # Set updated timestamp
    school.updated_at = datetime.utcnow()

    session.add(school)
    await session.commit()
    session.refresh(school)

    return school


@router.post("/departments", response_model=Department)
async def create_department(
    department: DepartmentCreate,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Create a new department for the school."""

    # Ensure user is a school admin
    if current_user.user_type != "school_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school administrators can create departments",
        )

    # Get the school associated with this admin
    result: Result[School] = await session.execute(
        select(School).where(School.admin_user_id == current_user.id)
    )
    school = result.scalar_one_or_none()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this administrator",
        )

    # Check if department code already exists
    existing_dept = (
        await session.execute(
            select(Department).where(
                Department.school_id == school.id, Department.code == department.code
            )
        )
    ).scalar_one_or_none()

    if existing_dept:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Department with code {department.code} already exists in this school",
        )

    # Create the department
    new_department = Department(
        school_id=school.id,
        name=department.name,
        code=department.code,
        description=department.description,
        education_level=department.education_level,
        created_at=datetime.utcnow(),
    )

    session.add(new_department)
    await session.commit()
    session.refresh(new_department)

    return new_department


@router.get("/departments", response_model=List[Department])
async def get_departments(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Get all departments for the school."""

    # Ensure user is associated with a school
    if current_user.user_type not in ["school_admin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school staff can access departments",
        )

    # Get the school associated with this user
    school = None

    if current_user.user_type == "school_admin":
        school = (
            await session.execute(
                select(School).where(School.admin_user_id == current_user.id)
            )
        ).scalar_one_or_none()
    else:
        # For other staff types, find their school through SchoolStaff
        staff = (
            await session.execute(
                select(SchoolStaff).where(SchoolStaff.user_id == current_user.id)
            )
        ).first()

        if staff:
            school = (
                await session.execute(
                    select(School).where(School.id == staff.school_id)
                )
            ).scalar_one_or_none()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this user",
        )

    # Get departments for this school
    departments = (
        await session.execute(
            select(Department)
            .where(Department.school_id == school.id)
            .order_by(Department.name)
        )
    ).all()

    return departments


@router.post("/invite-professor", status_code=status.HTTP_201_CREATED)
async def invite_professor(
    professor: ProfessorInvite,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Invite a professor to join the school platform."""

    # Ensure user is a school admin
    if current_user.user_type != "school_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school administrators can invite professors",
        )

    # Get the school associated with this admin
    school = (
        await session.execute(
            select(School).where(School.admin_user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this administrator",
        )

    # Verify the department if provided
    if professor.department_id:
        department = (
            await session.execute(
                select(Department).where(
                    Department.id == professor.department_id,
                    Department.school_id == school.id,
                )
            )
        ).scalar_one_or_none()

        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found or not part of this school",
            )

    # Check if professor already exists
    existing_professor = (
        await session.execute(select(User).where(User.email == professor.email))
    ).scalar_one_or_none()

    if existing_professor:
        # Check if professor is already part of this school
        existing_school_prof = (
            await session.execute(
                select(SchoolProfessor).where(
                    SchoolProfessor.user_id == existing_professor.id,
                    SchoolProfessor.school_id == school.id,
                )
            )
        ).scalar_one_or_none()

        if existing_school_prof:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Professor with email {professor.email} is already part of this school",
            )

    # Generate a temporary password
    temp_password = str(uuid.uuid4())[:8]
    hashed_password = get_password_hash(temp_password)

    # Generate a username based on email
    base_username = professor.email.split("@")[0]
    username = base_username

    # Check if username exists, if so, add a number
    count = 1
    while (
        await session.execute(select(User).where(User.username == username))
    ).first():
        username = f"{base_username}{count}"
        count += 1

    # Create user account for professor
    new_user = User(
        email=professor.email,
        username=username,
        full_name=professor.full_name,
        hashed_password=hashed_password,
        user_type="professor",
        is_active=True,
        is_verified=True,  # Pre-verified since invited by school admin
        has_onboarded=True,  # Skip individual onboarding for school staff
        locale="en",  # Default language, can be changed by user
    )

    try:
        session.add(new_user)
        await session.commit()
        session.refresh(new_user)

        # Create professor profile with employee_id that follows the pattern PROF-{user_id}
        employee_id = f"{professor.full_name.lower()}-{new_user.id}"

        new_professor = SchoolProfessor(
            user_id=new_user.id,
            school_id=school.id,
            title=professor.title,
            department_id=professor.department_id,
            specializations=professor.specializations,
            academic_rank=professor.academic_rank,
            preferred_subjects=professor.preferred_subjects or [],
            employee_id=employee_id,  # Add standardized employee ID format
            teaching_languages=[
                "en",
                "fr",
                "ar",
            ],  # Default languages, can be updated later
            joined_at=datetime.utcnow(),
            is_active=True,
            account_status="active",
        )

        await session.add(new_professor)
        await session.commit()
        await session.refresh(new_professor)

        # Send invitation email with school code, professor ID, and temp password
        await send_professor_invitation_email(
            background_tasks=background_tasks,
            recipient_email=professor.email,
            recipient_name=professor.full_name,
            school_name=school.name,
            school_code=school.code,
            professor_id=new_user.id,  # Using user_id for the professor ID
            temp_password=temp_password,
            role="professor",
        )

        return {
            "status": "success",
            "message": f"Invitation sent to {professor.email}",
            "professor_id": new_professor.id,
        }

    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email {professor.email} already exists",
        )


@router.post("/invite-admin", status_code=status.HTTP_201_CREATED)
async def invite_admin(
    admin: AdminInvite,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Invite an administrator or staff member to join the school platform."""

    # Ensure user is a school admin
    if current_user.user_type != "school_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school administrators can invite other administrators",
        )

    # Get the school associated with this admin
    school = (
        await session.execute(
            select(School).where(School.admin_user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this administrator",
        )

    # Check if admin already exists
    existing_admin = (
        await session.execute(select(User).where(User.email == admin.email))
    ).scalar_one_or_none()

    if existing_admin:
        # Check if admin is already part of this school
        existing_school_staff = (
            await session.execute(
                select(SchoolStaff).where(
                    SchoolStaff.user_id == existing_admin.id,
                    SchoolStaff.school_id == school.id,
                )
            )
        ).scalar_one_or_none()

        if existing_school_staff:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Administrator with email {admin.email} is already part of this school",
            )

    # Create user account for admin
    new_user, temp_password, access_token = await create_user_account(
        session=session,
        email=admin.email,
        full_name=admin.full_name,
        user_type="school_staff",
        school_id=school.id,
    )

    # Create staff profile
    new_staff = SchoolStaff(
        user_id=new_user.id,
        school_id=school.id,
        staff_type=admin.role,  # admin, academic_coordinator, etc.
        is_active=True,
        work_email=admin.email,
        created_at=datetime.utcnow(),
    )

    session.add(new_staff)
    await session.commit()
    session.refresh(new_staff)

    # Generate invitation link with token
    invitation_link = (
        f"{settings.FRONTEND_URL}/{school.code}/activate?token={access_token}"
    )

    # Send invitation email with school code and ID
    await send_invitation_email(
        background_tasks=background_tasks,
        recipient_email=admin.email,
        recipient_name=admin.full_name,
        school_name=school.name,
        school_code=school.code,
        school_id=school.id,
        role=admin.role,
        invitation_link=invitation_link,
    )

    return {
        "status": "success",
        "message": f"Invitation sent to {admin.email}",
        "staff_id": new_staff.id,
    }


@router.post("/bulk-invite-professors", response_model=BulkInviteResponse)
async def bulk_invite_professors(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    department_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Bulk invite professors from a CSV file.

    CSV Format:
    email,full_name,title,academic_rank,specializations

    Example:
    prof.smith@example.com,John Smith,Dr.,Assistant Professor,"mathematics,physics"
    """

    # Ensure user is a school admin
    if current_user.user_type != "school_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school administrators can bulk invite professors",
        )

    # Get the school associated with this admin
    school = (
        await session.execute(
            select(School).where(School.admin_user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this administrator",
        )

    # Verify the department if provided
    if department_id:
        department = (
            await session.execute(
                select(Department).where(
                    Department.id == department_id, Department.school_id == school.id
                )
            )
        ).scalar_one_or_none()

        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found or not part of this school",
            )

    # Process CSV file
    content = await file.read()

    # Decode the content
    text_content = content.decode("utf-8-sig")  # Handle BOM if present

    # Create CSV reader
    csv_reader = csv.DictReader(io.StringIO(text_content))

    # Variables for tracking results
    success_count = 0
    failed_emails = []

    # Process each row
    for row in csv_reader:
        try:
            # Ensure required fields are present
            email = row.get("email", "").strip()
            full_name = row.get("full_name", "").strip()
            title = row.get("title", "").strip()
            academic_rank = row.get("academic_rank", "").strip()

            # Parse specializations (may be in a quoted string separated by commas)
            specializations_str = row.get("specializations", "").strip()
            specializations = [
                s.strip() for s in specializations_str.split(",") if s.strip()
            ]

            if not all([email, full_name, title, academic_rank]):
                failed_emails.append(
                    {
                        "email": email or "Missing email",
                        "reason": "Missing required fields",
                    }
                )
                continue

            # Check if professor already exists
            existing_user = (
                await session.execute(select(User).where(User.email == email))
            ).scalar_one_or_none()

            if existing_user:
                # Check if already part of this school
                existing_prof = (
                    await session.execute(
                        select(SchoolProfessor).where(
                            SchoolProfessor.user_id == existing_user.id,
                            SchoolProfessor.school_id == school.id,
                        )
                    )
                ).scalar_one_or_none()

                if existing_prof:
                    failed_emails.append(
                        {"email": email, "reason": "Already part of this school"}
                    )
                    continue

            # Create user and professor
            try:
                # Generate a temporary password
                temp_password = str(uuid.uuid4())[:8]
                hashed_password = get_password_hash(temp_password)

                # Generate a username based on email
                base_username = email.split("@")[0]
                username = base_username

                # Check if username exists, if so, add a number
                count = 1
                while (
                    await session.execute(select(User).where(User.username == username))
                ).first():
                    username = f"{base_username}{count}"
                    count += 1

                # Create user account for professor
                new_user = User(
                    email=email,
                    username=username,
                    full_name=full_name,
                    hashed_password=hashed_password,
                    user_type="professor",
                    is_active=True,
                    is_verified=True,  # Pre-verified since invited by school admin
                    has_onboarded=True,  # Skip individual onboarding for school staff
                    locale="en",  # Default language, can be changed by user
                )

                session.add(new_user)
                await session.commit()
                session.refresh(new_user)

                # Create standardized employee ID
                employee_id = f"PROF-{new_user.id}"

                # Create professor profile
                new_professor = SchoolProfessor(
                    user_id=new_user.id,
                    school_id=school.id,
                    title=title,
                    department_id=department_id,
                    specializations=specializations,
                    academic_rank=academic_rank,
                    employee_id=employee_id,
                    joined_at=datetime.utcnow(),
                    is_active=True,
                    account_status="active",
                )

                session.add(new_professor)
                await session.commit()
                session.refresh(new_professor)

                # Send invitation email with school code, professor ID, and temp password
                await send_professor_invitation_email(
                    background_tasks=background_tasks,
                    recipient_email=email,
                    recipient_name=full_name,
                    school_name=school.name,
                    school_code=school.code,
                    professor_id=new_user.id,
                    temp_password=temp_password,
                    role="professor",
                )

                success_count += 1

            except Exception as e:
                await session.rollback()
                failed_emails.append({"email": email, "reason": str(e)})

        except Exception as e:
            failed_emails.append(
                {
                    "email": row.get("email", "Unknown email"),
                    "reason": f"Error processing row: {str(e)}",
                }
            )

    return BulkInviteResponse(
        success_count=success_count,
        failed_emails=failed_emails,
        message=f"Successfully invited {success_count} professors, {len(failed_emails)} failed",
    )


@router.post("/setup-classes", status_code=status.HTTP_201_CREATED)
async def setup_classes(
    classes: List[SchoolClass],
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Set up classes for the school."""

    # Ensure user is a school admin
    if current_user.user_type != "school_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school administrators can set up classes",
        )

    # Get the school associated with this admin
    school = (
        await session.execute(
            select(School).where(School.admin_user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this administrator",
        )

    created_classes = []
    errors = []

    for class_data in classes:
        try:
            # Verify homeroom teacher if provided
            if class_data.homeroom_teacher_id:
                teacher = (
                    await session.execute(
                        select(SchoolStaff).where(
                            SchoolStaff.id == class_data.homeroom_teacher_id,
                            SchoolStaff.school_id == school.id,
                            SchoolStaff.is_teacher,
                        )
                    )
                ).scalar_one_or_none()

                if not teacher:
                    errors.append(
                        {
                            "class_name": class_data.name,
                            "error": f"Teacher with ID {class_data.homeroom_teacher_id} not found or not a teacher",
                        }
                    )
                    continue

            # Create the class
            new_class = SchoolClass(
                school_id=school.id,
                name=class_data.name,
                academic_year=class_data.academic_year,
                education_level=class_data.education_level,
                academic_track=class_data.academic_track,
                room_number=class_data.room_number,
                capacity=class_data.capacity,
                homeroom_teacher_id=class_data.homeroom_teacher_id,
                created_at=datetime.utcnow(),
            )

            session.add(new_class)
            await session.commit()
            session.refresh(new_class)

            created_classes.append(new_class)

        except Exception as e:
            session.rollback()
            errors.append({"class_name": class_data.name, "error": str(e)})

    return {
        "status": "success",
        "message": f"Created {len(created_classes)} classes, {len(errors)} failed",
        "created_classes": created_classes,
        "errors": errors,
    }


class CourseCreate(BaseModel):
    title: str
    code: str
    description: str
    department_id: Optional[int] = None
    teacher_id: Optional[int] = None
    education_level: str
    academic_year: str
    academic_track: Optional[str] = None
    credits: Optional[float] = None
    learning_objectives: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None
    ai_tutoring_enabled: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


@router.post("/courses", status_code=status.HTTP_201_CREATED)
async def create_courses(
    courses: List[CourseCreate],
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Create courses for the school."""

    # Ensure user is a school admin
    if current_user.user_type != "school_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school administrators can create courses",
        )

    # Get the school associated with this admin
    school = (
        await session.execute(
            select(School).where(School.admin_user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this administrator",
        )

    created_courses = []
    errors = []

    for course_data in courses:
        try:
            # Verify department if provided
            if course_data.department_id:
                department = (
                    await session.execute(
                        select(Department).where(
                            Department.id == course_data.department_id,
                            Department.school_id == school.id,
                        )
                    )
                ).scalar_one_or_none()

                if not department:
                    errors.append(
                        {
                            "course_title": course_data.title,
                            "error": f"Department with ID {course_data.department_id} not found or not part of this school",
                        }
                    )
                    continue

            # Verify teacher if provided
            if course_data.teacher_id:
                teacher = (
                    await session.execute(
                        select(SchoolStaff).where(
                            SchoolStaff.id == course_data.teacher_id,
                            SchoolStaff.school_id == school.id,
                            SchoolStaff.is_teacher,
                        )
                    )
                ).scalar_one_or_none()

                if not teacher:
                    errors.append(
                        {
                            "course_title": course_data.title,
                            "error": f"Teacher with ID {course_data.teacher_id} not found or not a teacher",
                        }
                    )
                    continue

            # Check if course code already exists
            existing_course = (
                await session.execute(
                    select(SchoolCourse).where(
                        SchoolCourse.school_id == school.id,
                        SchoolCourse.code == course_data.code,
                    )
                )
            ).scalar_one_or_none()

            if existing_course:
                errors.append(
                    {
                        "course_title": course_data.title,
                        "error": f"Course with code {course_data.code} already exists",
                    }
                )
                continue

            # Create the course
            new_course = SchoolCourse(
                school_id=school.id,
                department_id=course_data.department_id,
                teacher_id=course_data.teacher_id,
                title=course_data.title,
                code=course_data.code,
                description=course_data.description,
                academic_year=course_data.academic_year,
                education_level=course_data.education_level,
                academic_track=course_data.academic_track,
                credits=course_data.credits,
                learning_objectives=course_data.learning_objectives or [],
                prerequisites=course_data.prerequisites or [],
                ai_tutoring_enabled=course_data.ai_tutoring_enabled,
                start_date=course_data.start_date,
                end_date=course_data.end_date,
                created_at=datetime.utcnow(),
                status="active",
            )

            session.add(new_course)
            await session.commit()
            session.refresh(new_course)

            created_courses.append(new_course)

        except Exception as e:
            session.rollback()
            errors.append({"course_title": course_data.title, "error": str(e)})

    return {
        "status": "success",
        "message": f"Created {len(created_courses)} courses, {len(errors)} failed",
        "created_courses": created_courses,
        "errors": errors,
    }


class StudentImport(BaseModel):
    email: EmailStr
    full_name: str
    student_id: str
    education_level: str
    academic_track: Optional[str] = None
    graduation_year: Optional[str] = None
    class_id: Optional[int] = None


@router.post("/import-students", response_model=BulkInviteResponse)
async def import_students(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Import students from a CSV file.

    CSV Format:
    email,full_name,student_id,education_level,academic_track,graduation_year,class_name

    Example:
    student@example.com,Sara Ahmed,ST12345,bac_1,sciences_math_a,2026,Class 10A
    """

    # Ensure user is a school admin
    if current_user.user_type != "school_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school administrators can import students",
        )

    # Get the school associated with this admin
    school = (
        await session.execute(
            select(School).where(School.admin_user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this administrator",
        )

    # Process CSV file
    content = await file.read()

    # Decode the content
    text_content = content.decode("utf-8-sig")  # Handle BOM if present

    # Create CSV reader
    csv_reader = csv.DictReader(io.StringIO(text_content))

    # Variables for tracking results
    success_count = 0
    failed_emails = []

    # Process each row
    for row in csv_reader:
        try:
            # Ensure required fields are present
            email = row.get("email", "").strip()
            full_name = row.get("full_name", "").strip()
            student_id = row.get("student_id", "").strip()
            education_level = row.get("education_level", "").strip()
            academic_track = row.get("academic_track", "").strip() or None
            graduation_year = row.get("graduation_year", "").strip() or None
            class_name = row.get("class_name", "").strip() or None

            if not all([email, full_name, student_id, education_level]):
                failed_emails.append(
                    {
                        "email": email or "Missing email",
                        "reason": "Missing required fields",
                    }
                )
                continue

            # Find class ID if class name provided
            class_id = None
            if class_name:
                class_obj = (
                    await session.execute(
                        select(SchoolClass).where(
                            SchoolClass.school_id == school.id,
                            SchoolClass.name == class_name,
                        )
                    )
                ).scalar_one_or_none()

                if class_obj:
                    class_id = class_obj.id

            # Check if student already exists
            existing_user = (
                await session.execute(select(User).where(User.email == email))
            ).scalar_one_or_none()

            if existing_user:
                # Check if already part of this school
                existing_student = (
                    await session.execute(
                        select(SchoolStudent).where(
                            SchoolStudent.user_id == existing_user.id,
                            SchoolStudent.school_id == school.id,
                        )
                    )
                ).scalar_one_or_none()

                if existing_student:
                    failed_emails.append(
                        {"email": email, "reason": "Already enrolled in this school"}
                    )
                    continue

            # Create user and student profile
            try:
                new_user, temp_password, access_token = await create_user_account(
                    session=session,
                    email=email,
                    full_name=full_name,
                    user_type="student",
                    school_id=school.id,
                )

                # Create student profile
                new_student = SchoolStudent(
                    user_id=new_user.id,
                    school_id=school.id,
                    student_id=student_id,
                    enrollment_date=datetime.utcnow(),
                    education_level=education_level,
                    academic_track=academic_track,
                    graduation_year=graduation_year,
                    is_active=True,
                    created_at=datetime.utcnow(),
                )

                session.add(new_student)
                await session.commit()
                session.refresh(new_student)

                # If class_id is provided, enroll the student in this class
                if class_id:
                    enrollment = ClassEnrollment(
                        student_id=new_student.id,
                        class_id=class_id,
                        academic_year=datetime.utcnow().year,
                        enrollment_date=datetime.utcnow(),
                        status="active",
                        created_at=datetime.utcnow(),
                    )

                    session.add(enrollment)
                    await session.commit()

                # Generate invitation link with token
                invitation_link = f"{settings.FRONTEND_URL}/{school.code}/student/activate?token={access_token}"

                # Send invitation email with school code and ID
                await send_invitation_email(
                    background_tasks=background_tasks,
                    recipient_email=email,
                    recipient_name=full_name,
                    school_name=school.name,
                    school_code=school.code,
                    school_id=school.id,
                    role="student",
                    invitation_link=invitation_link,
                )

                success_count += 1

            except Exception as e:
                session.rollback()
                failed_emails.append({"email": email, "reason": str(e)})

        except Exception as e:
            failed_emails.append(
                {
                    "email": row.get("email", "Unknown email"),
                    "reason": f"Error processing row: {str(e)}",
                }
            )

    return BulkInviteResponse(
        success_count=success_count,
        failed_emails=failed_emails,
        message=f"Successfully imported {success_count} students, {len(failed_emails)} failed",
    )


@router.post("/complete-onboarding", status_code=status.HTTP_200_OK)
async def complete_onboarding(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Mark the school onboarding process as complete."""

    # Ensure user is a school admin
    if current_user.user_type != "school_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school administrators can complete onboarding",
        )

    # Get the school associated with this admin
    school = (
        await session.execute(
            select(School).where(School.admin_user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this administrator",
        )

    # Get current onboarding status
    onboarding_status = calculate_onboarding_status(school, session)

    # Check if key onboarding steps are completed
    if not (
        onboarding_status.profile_completed
        and (
            onboarding_status.professors_invited
            or onboarding_status.admin_staff_invited
        )
    ):
        return {
            "status": "error",
            "message": "Cannot complete onboarding until profile is completed and at least professors or admin staff are invited",
            "onboarding_status": onboarding_status,
        }

    # Update onboarding_completed flag in a custom metadata field
    if not school.integration_settings:
        school.integration_settings = {}

    school.integration_settings["onboarding_completed"] = True
    school.integration_settings["onboarding_completed_at"] = (
        datetime.utcnow().isoformat()
    )

    # Update the school
    school.updated_at = datetime.utcnow()

    session.add(school)
    await session.commit()

    return {
        "status": "success",
        "message": "Onboarding completed successfully",
        "onboarding_status": calculate_onboarding_status(school, session),
    }


class SchoolIntegration(BaseModel):
    """Model for configuring school integrations with external systems."""

    integration_type: str  # google_classroom, moodle, canvas, custom
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    base_url: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None
    enabled: bool = True


@router.post("/integrations", status_code=status.HTTP_201_CREATED)
async def set_up_integration(
    integration: SchoolIntegration,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Set up integration with external school systems (LMS, SIS, etc.)."""

    # Ensure user is a school admin
    if current_user.user_type != "school_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school administrators can set up integrations",
        )

    # Get the school associated with this admin
    school = (
        await session.execute(
            select(School).where(School.admin_user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this administrator",
        )

    # Initialize integration_settings if not already set
    if not school.integration_settings:
        school.integration_settings = {}

    # Store integration configuration
    if "integrations" not in school.integration_settings:
        school.integration_settings["integrations"] = {}

    # Add or update the integration
    integration_data = integration.dict(exclude_unset=True)

    # Add timestamp for tracking
    integration_data["updated_at"] = datetime.utcnow().isoformat()

    # Store in the settings
    school.integration_settings["integrations"][integration.integration_type] = (
        integration_data
    )

    # Update the school record
    school.updated_at = datetime.utcnow()

    session.add(school)
    await session.commit()

    return {
        "status": "success",
        "message": f"{integration.integration_type.capitalize()} integration configured successfully",
        "integration": integration,
    }


@router.get("/integrations", status_code=status.HTTP_200_OK)
async def get_integrations(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Get all configured integrations for the school."""

    # Ensure user is a school admin or staff with appropriate permissions
    if current_user.user_type not in ["school_admin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view integrations",
        )

    # Get the school associated with this user
    school = None

    if current_user.user_type == "school_admin":
        school = (
            await session.execute(
                select(School).where(School.admin_user_id == current_user.id)
            )
        ).scalar_one_or_none()
    else:
        # For other staff types, find their school through SchoolStaff
        staff = (
            await session.execute(
                select(SchoolStaff).where(SchoolStaff.user_id == current_user.id)
            )
        ).scalar_one_or_none()

        if staff and staff.staff_type in ["admin", "academic_coordinator", "principal"]:
            school = (
                await session.execute(
                    select(School).where(School.id == staff.school_id)
                )
            ).scalar_one_or_none()
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view integrations",
            )

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this user",
        )

    # Get integrations from school settings
    integrations = {}

    if school.integration_settings and "integrations" in school.integration_settings:
        integrations = school.integration_settings["integrations"]

        # Redact sensitive information for security
        for integration_type, config in integrations.items():
            if isinstance(config, dict):
                if "api_key" in config:
                    config["api_key"] = "***" if config["api_key"] else None
                if "api_secret" in config:
                    config["api_secret"] = "***" if config["api_secret"] else None

    return {"integrations": integrations}


class EmailTemplate(BaseModel):
    """Model for school email templates."""

    template_type: str  # welcome_student, welcome_teacher, assignment_reminder, etc.
    subject: str
    body_html: str
    enabled: bool = True


@router.post("/email-templates", status_code=status.HTTP_201_CREATED)
async def create_email_template(
    template: EmailTemplate,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Create or update an email template for school communications."""

    # Ensure user is a school admin
    if current_user.user_type != "school_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school administrators can create email templates",
        )

    # Get the school associated with this admin
    school = (
        await session.execute(
            select(School).where(School.admin_user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this administrator",
        )

    # Initialize integration_settings if not already set
    if not school.integration_settings:
        school.integration_settings = {}

    # Store email template
    if "email_templates" not in school.integration_settings:
        school.integration_settings["email_templates"] = {}

    # Add or update the template
    template_data = template.dict(exclude_unset=True)

    # Add timestamp for tracking
    template_data["updated_at"] = datetime.utcnow().isoformat()

    # Store in the settings
    school.integration_settings["email_templates"][template.template_type] = (
        template_data
    )

    # Update the school record
    school.updated_at = datetime.utcnow()

    session.add(school)
    await session.commit()

    return {
        "status": "success",
        "message": f"Email template for {template.template_type} created successfully",
        "template": template,
    }


@router.get("/email-templates", status_code=status.HTTP_200_OK)
async def get_email_templates(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Get all email templates for the school."""

    # Ensure user is a school admin or appropriate staff
    if current_user.user_type not in ["school_admin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view email templates",
        )

    # Get the school associated with this user
    school = None

    if current_user.user_type == "school_admin":
        school = (
            await session.execute(
                select(School).where(School.admin_user_id == current_user.id)
            )
        ).scalar_one_or_none()
    else:
        # For other staff types, find their school through SchoolStaff
        staff = (
            await session.execute(
                select(SchoolStaff).where(SchoolStaff.user_id == current_user.id)
            )
        ).scalar_one_or_none()

        if staff and staff.staff_type in ["admin", "academic_coordinator"]:
            school = (
                await session.execute(
                    select(School).where(School.id == staff.school_id)
                )
            ).scalar_one_or_none()
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view email templates",
            )

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this user",
        )

    # Get templates from school settings
    templates = {}

    if school.integration_settings and "email_templates" in school.integration_settings:
        templates = school.integration_settings["email_templates"]

    return {"email_templates": templates}


class AnalyticsPreferences(BaseModel):
    """Model for school analytics preferences."""

    track_student_progress: bool = True
    track_attendance: bool = True
    generate_weekly_reports: bool = True
    share_anonymized_data: bool = False
    ai_personalization: bool = True


@router.post("/analytics-settings", status_code=status.HTTP_200_OK)
async def set_analytics_preferences(
    preferences: AnalyticsPreferences,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Configure analytics and reporting preferences for the school."""

    # Ensure user is a school admin
    if current_user.user_type != "school_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only school administrators can configure analytics settings",
        )

    # Get the school associated with this admin
    school = (
        await session.execute(
            select(School).where(School.admin_user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this administrator",
        )

    # Initialize integration_settings if not already set
    if not school.integration_settings:
        school.integration_settings = {}

    # Store analytics preferences
    school.integration_settings["analytics_preferences"] = preferences.dict()

    # Update the school record
    school.updated_at = datetime.utcnow()

    session.add(school)
    await session.commit()

    return {
        "status": "success",
        "message": "Analytics preferences updated successfully",
        "preferences": preferences,
    }


@router.get("/analytics-settings", status_code=status.HTTP_200_OK)
async def get_analytics_preferences(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Get analytics and reporting preferences for the school."""

    # Ensure user is a school admin or appropriate staff
    if current_user.user_type not in ["school_admin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view analytics settings",
        )

    # Get the school associated with this user
    school = None

    if current_user.user_type == "school_admin":
        school = (
            await session.execute(
                select(School).where(School.admin_user_id == current_user.id)
            )
        ).scalar_one_or_none()
    else:
        # For other staff types, find their school through SchoolStaff
        staff = (
            await session.execute(
                select(SchoolStaff).where(SchoolStaff.user_id == current_user.id)
            )
        ).first()

        if staff:
            school = (
                await session.execute(
                    select(School).where(School.id == staff.school_id)
                )
            ).scalar_one_or_none()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this user",
        )

    # Get analytics preferences from school settings
    preferences = {
        "track_student_progress": True,
        "track_attendance": True,
        "generate_weekly_reports": True,
        "share_anonymized_data": False,
        "ai_personalization": True,
    }  # Default values

    if (
        school.integration_settings
        and "analytics_preferences" in school.integration_settings
    ):
        preferences = school.integration_settings["analytics_preferences"]

    return preferences


@router.get("/summary", status_code=status.HTTP_200_OK)
async def get_school_summary(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Get a summary of the school's setup and usage."""

    # Ensure user is a school admin or appropriate staff
    if current_user.user_type not in ["school_admin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view school summary",
        )

    # Get the school associated with this user
    school = None

    if current_user.user_type == "school_admin":
        school = (
            await session.execute(
                select(School).where(School.admin_user_id == current_user.id)
            )
        ).scalar_one_or_none()
    else:
        # For other staff types, find their school through SchoolStaff
        staff = (
            await session.execute(
                select(SchoolStaff).where(SchoolStaff.user_id == current_user.id)
            )
        ).scalar_one_or_none()

        if staff:
            school = (
                await session.execute(
                    select(School).where(School.id == staff.school_id)
                )
            ).scalar_one_or_none()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No school found for this user",
        )

    # Get counts for different entities
    departments_count = (
        await session.execute(
            select(func.count()).where(Department.school_id == school.id)
        )
    ).scalar_one()

    staff_count = (
        await session.execute(
            select(func.count()).where(SchoolStaff.school_id == school.id)
        )
    ).scalar_one()

    professors_count = (
        await session.execute(
            select(func.count()).where(SchoolProfessor.school_id == school.id)
        )
    ).scalar_one()

    courses_count = (
        await session.execute(
            select(func.count()).where(SchoolCourse.school_id == school.id)
        )
    ).scalar_one()

    classes_count = (
        await session.execute(
            select(func.count()).where(SchoolClass.school_id == school.id)
        )
    ).scalar_one()

    students_count = (
        await session.execute(
            select(func.count()).where(SchoolStudent.school_id == school.id)
        )
    ).scalar_one()

    # Get onboarding status
    onboarding_status = calculate_onboarding_status(school, session)

    return {
        "school_name": school.name,
        "school_code": school.code,
        "subscription_type": school.subscription_type,
        "subscription_expires": school.subscription_expires,
        "onboarding_status": onboarding_status,
        "counts": {
            "departments": departments_count,
            "staff": staff_count,
            "professors": professors_count,
            "courses": courses_count,
            "classes": classes_count,
            "students": students_count,
        },
        "is_active": school.is_active,
        "created_at": school.created_at,
        "updated_at": school.updated_at,
    }
