from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from loguru import logger
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Query,
    Path,
    BackgroundTasks,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from src.db import get_session
from src.db.models.school import (
    School,
    Department,
    SchoolClass,
    SchoolStaff,
    SchoolCourse,
    SchoolStudent,
    CourseEnrollment,
    Assignment,
    AssignmentSubmission,
    DepartmentStaffAssignment,
)
from src.db.models.professor import SchoolProfessor, ProfessorCourse, CourseMaterial
from src.db.models.user import User
from src.api.models.school import (
    SchoolResponse,
    StaffResponse,
    SchoolStatsResponse,
    DepartmentResponse,
    ClassResponse,
    StudentResponse,
    ProfessorResponse,
    CourseResponse,
    AssignmentResponse,
)
from src.api.models.school import SchoolCreate
from src.api.endpoints.auth import get_current_user
from src.core.settings import settings
import resend

router = APIRouter(prefix="/schools", tags=["schools"])


# Initialize Resend for email
resend.api_key = settings.RESEND_API_KEY


async def send_school_welcome_email(
    background_tasks: BackgroundTasks,
    recipient_email: str,
    recipient_name: str,
    school_name: str,
    school_code: str,
    school_id: int,
    admin_id: int = None,
):
    """Send welcome email to school admin when a new school is registered."""

    # Format the admin ID properly (ADM-{school_id})
    formatted_admin_id = f"ADM-{school_id}"

    # Email content with school details and admin ID
    email_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Welcome to Our Platform!</h2>
        <p>Hello {recipient_name},</p>
        <p>Congratulations! Your school <strong>{school_name}</strong> has been successfully registered on our platform.</p>
        <p>Your school information:</p>
        <ul>
            <li><strong>School Code:</strong> {school_code}</li>
            <li><strong>Admin ID:</strong> {formatted_admin_id}</li>
        </ul>
        <p>You can use this information to access your school administration panel and begin setting up your school environment.</p>
        <div style="margin: 30px 0;">
            <a href="{settings.FRONTEND_URL}/admin/dashboard" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Access Your Dashboard
            </a>
        </div>
        <p>We recommend starting by:</p>
        <ol>
            <li>Setting up your school profile</li>
            <li>Creating departments</li>
            <li>Inviting staff and faculty members</li>
            <li>Setting up courses and classes</li>
        </ol>
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>The Team</p>
    </div>
    """

    # Send the email asynchronously
    try:
        params = {
            "from": "School Platform <onboarding@resend.dev>",
            "to": recipient_email,
            "subject": f"Welcome to the Platform - {school_name} Registration Successful",
            "html": email_html,
        }

        # Use background task to send email asynchronously
        background_tasks.add_task(resend.Emails.send, params)
        logger.info(f"Welcome email sent to admin for school: {school_name}")
        return True
    except Exception as e:
        logger.error(f"Error sending welcome email: {str(e)}")
        return False


@router.post("/", response_model=SchoolResponse)
async def register_school(
    school_data: SchoolCreate,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
):
    """
    Register a new school in the system.

    This endpoint creates a new school record and also sets up the school admin.
    """
    try:
        logger.info(f"Registering new school: {school_data.name}")

        # Check if school code already exists
        result = await session.execute(
            select(School).where(School.code == school_data.code)
        )
        existing_school = result.scalars().first()

        if existing_school:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="School code already registered",
            )

        # Create new school object
        new_school = School(
            name=school_data.name,
            code=school_data.code,
            address=school_data.address,
            city=school_data.city,
            region=school_data.region,
            school_type=school_data.school_type,
            education_levels=school_data.education_levels,
            contact_email=school_data.contact_email,
            contact_phone=school_data.contact_phone,
            website=school_data.website,
            is_active=True,  # Schools start as active by default
            subscription_type="basic",  # Default subscription
            created_at=datetime.utcnow().replace(
                tzinfo=None
            ),  # Use timezone-naive datetime
        )

        # Add to session and commit to get the ID
        session.add(new_school)
        await session.commit()
        await session.refresh(new_school)

        logger.info(
            f"School registered successfully: {new_school.name} (ID: {new_school.id})"
        )

        # Check if contact email is provided, send welcome email
        if school_data.contact_email:
            # Extract name for email (or use school name if no other name available)
            recipient_name = (
                school_data.contact_name
                if hasattr(school_data, "contact_name")
                else school_data.name
            )

            # Send welcome email with school details
            await send_school_welcome_email(
                background_tasks=background_tasks,
                recipient_email=school_data.contact_email,
                recipient_name=recipient_name,
                school_name=school_data.name,
                school_code=school_data.code,
                school_id=new_school.id,
            )
            logger.info(f"Welcome email triggered for school: {new_school.name}")

        return new_school

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error during school registration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during school registration",
        )


@router.post("/{school_id}/admin", response_model=dict)
async def link_admin_to_school(
    school_id: int,
    admin_data: dict,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
):
    """
    Link an admin user to a school.

    This endpoint associates an existing user with admin privileges to a school
    and creates a SchoolStaff record for them.
    """
    try:
        # Check if the school exists
        result = await session.execute(select(School).where(School.id == school_id))
        school = result.scalars().first()

        if not school:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="School not found"
            )

        # Check if the admin exists
        admin_id = admin_data.get("admin_id")
        if not admin_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Admin ID is required"
            )

        result = await session.execute(select(User).where(User.id == admin_id))
        admin_user = result.scalars().first()

        if not admin_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Admin user not found"
            )

        # Update the school with the admin user ID
        school.admin_user_id = admin_id
        # Use timezone-naive datetime
        school.updated_at = datetime.utcnow().replace(tzinfo=None)

        # Check if SchoolStaff record already exists for this user and school
        result = await session.execute(
            select(SchoolStaff).where(
                SchoolStaff.user_id == admin_id, SchoolStaff.school_id == school_id
            )
        )
        existing_staff = result.scalars().first()

        # If staff record doesn't exist, create a new one
        if not existing_staff:
            # Generate employee ID for the admin - VERY IMPORTANT:
            # From logs, we can see the auth system looks for staff with ID format "ADM-{user_id}"
            employee_id = f"ADM-{admin_id}"

            # Create a new SchoolStaff record for the admin
            admin_staff = SchoolStaff(
                user_id=admin_id,
                school_id=school_id,
                staff_type="admin",  # Set as admin type
                is_teacher=False,  # By default, admins are not teachers
                employee_id=employee_id,  # Use the format expected by auth system
                is_active=True,
                work_email=admin_user.email,
                created_at=datetime.utcnow().replace(
                    tzinfo=None
                ),  # Use timezone-naive datetime
            )

            session.add(admin_staff)
            logger.info(
                f"Created SchoolStaff record with employee_id: {employee_id} for admin (ID: {admin_id}) in school (ID: {school_id})"
            )
        else:
            # If staff record exists but not as admin, update it
            if existing_staff.staff_type != "admin":
                existing_staff.staff_type = "admin"
                existing_staff.updated_at = datetime.utcnow().replace(
                    tzinfo=None
                )  # Use timezone-naive datetime
                logger.info(
                    f"Updated existing staff record to admin type for user (ID: {admin_id})"
                )
            # Make sure the employee_id is correctly formatted for auth system
            if existing_staff.employee_id != f"ADM-{admin_id}":
                existing_staff.employee_id = f"ADM-{admin_id}"
                logger.info(f"Updated employee_id to ADM-{admin_id} for admin")

        await session.commit()

        # Send welcome email to the admin when linked to a school
        await send_school_welcome_email(
            background_tasks=background_tasks,
            recipient_email=admin_user.email,
            recipient_name=admin_user.full_name,
            school_name=school.name,
            school_code=school.code,
            school_id=school.id,
        )
        logger.info(
            f"Welcome email sent to admin (ID: {admin_id}) for school: {school.name}"
        )

        logger.info(
            f"Admin (ID: {admin_id}) linked to school: {school.name} (ID: {school.id})"
        )

        return {
            "status": "success",
            "message": "Admin successfully linked to school and added to staff",
            "school_id": school.id,
            "admin_id": admin_id,
        }

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error linking admin to school: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while linking admin to school",
        )


# School management endpoints
@router.get("/{school_id}", response_model=SchoolResponse)
async def get_school_details(
    school_id: int = Path(..., description="The ID of the school to retrieve"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get detailed information about a specific school.
    """
    # Fetch the school with relationships
    result = await session.execute(
        select(School)
        .options(selectinload(School.departments))
        .where(School.id == school_id)
    )
    school = result.scalars().first()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="School not found"
        )

    # Authorize access - must be admin of this school or system admin
    is_admin = False
    if school.admin_user_id == current_user.id:
        is_admin = True
    else:
        # Check if user is a staff member with admin role for this school
        staff_result = await session.execute(
            select(SchoolStaff).where(
                SchoolStaff.user_id == current_user.id,
                SchoolStaff.school_id == school_id,
                SchoolStaff.staff_type == "admin",
            )
        )
        staff = staff_result.scalars().first()
        is_admin = bool(staff)

    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this school's information",
        )

    return school


@router.get("/{school_id}/stats", response_model=SchoolStatsResponse)
async def get_school_statistics(
    school_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get statistics and metrics for a school.
    """
    # First, verify the school exists
    school_result = await session.execute(select(School).where(School.id == school_id))
    school = school_result.scalars().first()

    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="School not found"
        )

    # Authorize access - must be admin of this school or system admin
    is_admin = False
    if school.admin_user_id == current_user.id:
        is_admin = True
    else:
        # Check if user is a staff member with admin role for this school
        staff_result = await session.execute(
            select(SchoolStaff).where(
                SchoolStaff.user_id == current_user.id,
                SchoolStaff.school_id == school_id,
                SchoolStaff.staff_type == "admin",
            )
        )
        staff = staff_result.scalars().first()
        is_admin = bool(staff)

    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this school's statistics",
        )

    # Get staff count
    staff_count_result = await session.execute(
        select(func.count(SchoolStaff.id)).where(SchoolStaff.school_id == school_id)
    )
    staff_count = staff_count_result.scalar()

    # Get student count
    student_count_result = await session.execute(
        select(func.count(SchoolStudent.id)).where(SchoolStudent.school_id == school_id)
    )
    student_count = student_count_result.scalar()

    # Get class count
    class_count_result = await session.execute(
        select(func.count(SchoolClass.id)).where(SchoolClass.school_id == school_id)
    )
    class_count = class_count_result.scalar()

    # Get department count
    department_count_result = await session.execute(
        select(func.count(Department.id)).where(Department.school_id == school_id)
    )
    department_count = department_count_result.scalar()

    # Get course count
    course_count_result = await session.execute(
        select(func.count(SchoolCourse.id)).where(SchoolCourse.school_id == school_id)
    )
    course_count = course_count_result.scalar()

    # Get recent activity count (assignments in the last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_assignments_result = await session.execute(
        select(func.count(Assignment.id))
        .join(SchoolCourse, Assignment.course_id == SchoolCourse.id)
        .where(
            SchoolCourse.school_id == school_id,
            Assignment.created_at >= thirty_days_ago,
        )
    )
    recent_activity = recent_assignments_result.scalar()

    # Compile and return statistics
    return {
        "staffCount": staff_count,
        "studentCount": student_count,
        "classCount": class_count,
        "departmentCount": department_count,
        "courseCount": course_count,
        "recentActivity": recent_activity,
    }


@router.get("/{school_id}/departments", response_model=List[DepartmentResponse])
async def get_school_departments(
    school_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get all departments for a specific school.
    """
    # Fetch the departments with head staff info
    result = await session.execute(
        select(Department)
        .options(selectinload(Department.school))
        .where(Department.school_id == school_id)
    )
    departments = result.scalars().all()

    return departments


@router.get("/{school_id}/classes", response_model=List[ClassResponse])
async def get_school_classes(
    school_id: int,
    academic_year: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get all classes for a specific school, optionally filtered by academic year.
    """
    # Build the query with filters
    query = select(SchoolClass).where(SchoolClass.school_id == school_id)

    if academic_year:
        query = query.where(SchoolClass.academic_year == academic_year)

    # Execute the query
    result = await session.execute(query)
    classes = result.scalars().all()

    return classes


@router.get("/{school_id}/staff", response_model=List[StaffResponse])
async def get_school_staff(
    school_id: int,
    staff_type: Optional[str] = None,
    is_teacher: Optional[bool] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get staff members for a specific school with pagination,
    optionally filtered by staff type and teacher status.
    """
    # Build base query with pagination
    query = (
        select(SchoolStaff)
        .join(User, SchoolStaff.user_id == User.id)
        .where(SchoolStaff.school_id == school_id)
    )

    # Add filters if provided
    if staff_type:
        query = query.where(SchoolStaff.staff_type == staff_type)

    if is_teacher is not None:
        query = query.where(SchoolStaff.is_teacher == is_teacher)

    # Add pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    # Execute the query
    result = await session.execute(query)
    staff_members = result.scalars().all()

    return staff_members


@router.get("/{school_id}/students", response_model=List[StudentResponse])
async def get_school_students(
    school_id: int,
    education_level: Optional[str] = None,
    academic_track: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get students for a specific school with pagination and filtering options.
    """
    # Build base query with pagination
    query = (
        select(SchoolStudent)
        .join(User, SchoolStudent.user_id == User.id)
        .where(SchoolStudent.school_id == school_id)
    )

    # Add filters if provided
    if education_level:
        query = query.where(SchoolStudent.education_level == education_level)

    if academic_track:
        query = query.where(SchoolStudent.academic_track == academic_track)

    if is_active is not None:
        query = query.where(SchoolStudent.is_active == is_active)

    # Add pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    # Execute the query
    result = await session.execute(query)
    students = result.scalars().all()

    return students


# Professor-specific endpoints
@router.get("/professors/{user_id}", response_model=ProfessorResponse)
async def get_professor_details(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get detailed information about a professor.
    """
    # Check if the requested user is the current user or if current user is admin
    if current_user.id != user_id and current_user.user_type != "admin":
        # Check if current user is a school admin where the professor works
        is_school_admin = False
        professor_result = await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == user_id)
        )
        professor = professor_result.scalars().first()

        if professor:
            admin_check = await session.execute(
                select(SchoolStaff).where(
                    SchoolStaff.user_id == current_user.id,
                    SchoolStaff.school_id == professor.school_id,
                    SchoolStaff.staff_type == "admin",
                )
            )
            is_school_admin = bool(admin_check.scalars().first())

        if not is_school_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this professor's information",
            )

    # Get the professor details with department info
    result = await session.execute(
        select(SchoolProfessor)
        .options(
            selectinload(SchoolProfessor.department), selectinload(SchoolProfessor.user)
        )
        .where(SchoolProfessor.user_id == user_id)
    )
    professor = result.scalars().first()

    if not professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Professor not found"
        )

    return professor


@router.get("/professors/{user_id}/courses", response_model=List[CourseResponse])
async def get_professor_courses(
    user_id: int,
    academic_year: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get courses taught by a specific professor.
    """
    # Build query to get professor courses
    query = (
        select(SchoolCourse)
        .join(ProfessorCourse, ProfessorCourse.course_id == SchoolCourse.id)
        .join(SchoolProfessor, SchoolProfessor.id == ProfessorCourse.professor_id)
        .where(SchoolProfessor.user_id == user_id)
    )

    # Add academic year filter if provided
    if academic_year:
        query = query.where(SchoolCourse.academic_year == academic_year)

    # Execute the query
    result = await session.execute(query)
    courses = result.scalars().all()

    # For each course, get the student count
    course_results = []
    for course in courses:
        # Get student count for this course
        enrollment_count_result = await session.execute(
            select(func.count(CourseEnrollment.id)).where(
                CourseEnrollment.course_id == course.id
            )
        )
        student_count = enrollment_count_result.scalar()

        # Convert to dict to add student count
        course_dict = {
            **course.__dict__,
            "studentCount": student_count or 0,
            "weekly_hours": 3,  # Default value, replace with actual calculation if available
        }
        course_results.append(course_dict)

    return course_results


@router.get("/professors/{user_id}/students", response_model=List[Dict[str, Any]])
async def get_professor_students(
    user_id: int,
    course_id: Optional[int] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get students enrolled in courses taught by a specific professor.
    """
    # Build query to get students in professor's courses
    professor_query = select(SchoolProfessor).where(SchoolProfessor.user_id == user_id)
    professor_result = await session.execute(professor_query)
    professor = professor_result.scalars().first()

    if not professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Professor not found"
        )

    # Get courses taught by this professor
    professor_courses_query = (
        select(SchoolCourse.id)
        .join(ProfessorCourse, ProfessorCourse.course_id == SchoolCourse.id)
        .where(ProfessorCourse.professor_id == professor.id)
    )

    if course_id:
        professor_courses_query = professor_courses_query.where(
            SchoolCourse.id == course_id
        )

    professor_courses_result = await session.execute(professor_courses_query)
    course_ids = professor_courses_result.scalars().all()

    if not course_ids:
        return []

    # Get students enrolled in these courses
    enrollments_query = (
        select(CourseEnrollment, SchoolStudent, User, SchoolCourse)
        .join(SchoolStudent, CourseEnrollment.student_id == SchoolStudent.id)
        .join(User, SchoolStudent.user_id == User.id)
        .join(SchoolCourse, CourseEnrollment.course_id == SchoolCourse.id)
        .where(CourseEnrollment.course_id.in_(course_ids))
    )

    enrollments_result = await session.execute(enrollments_query)
    enrollments = enrollments_result.all()

    # Format the student data
    students = []
    for enrollment, student, user, course in enrollments:
        students.append(
            {
                "id": student.student_id,
                "name": user.full_name,
                "email": user.email,
                "course": course.title,
                "course_id": course.id,
                "enrollment_date": enrollment.enrollment_date.isoformat(),
                "status": enrollment.status,
                "grade": enrollment.grade,
                "grade_letter": enrollment.grade_letter,
            }
        )

    return students


@router.get(
    "/professors/{user_id}/assignments", response_model=List[AssignmentResponse]
)
async def get_professor_assignments(
    user_id: int,
    course_id: Optional[int] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get assignments created by a specific professor, optionally filtered by course.
    """
    # Get professor ID from user ID
    professor_query = select(SchoolProfessor).where(SchoolProfessor.user_id == user_id)
    professor_result = await session.execute(professor_query)
    professor = professor_result.scalars().first()

    if not professor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Professor not found"
        )

    # Get assignments created by this professor
    assignments_query = (
        select(Assignment)
        .join(SchoolCourse, Assignment.course_id == SchoolCourse.id)
        .where(Assignment.professor_id == professor.id)
    )

    if course_id:
        assignments_query = assignments_query.where(SchoolCourse.id == course_id)

    # Order by due date, most recent first
    assignments_query = assignments_query.order_by(Assignment.due_date.desc())

    assignments_result = await session.execute(assignments_query)
    assignments = assignments_result.scalars().all()

    return assignments


# Staff-related endpoints
@router.get("/staff/{user_id}", response_model=Dict[str, Any])
async def get_staff_details(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get detailed information about a staff member, including their school.
    """
    # Check authorization
    if current_user.id != user_id and current_user.user_type != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this staff member's information",
        )

    # Get staff record with school info
    staff_query = (
        select(SchoolStaff)
        .options(selectinload(SchoolStaff.school))
        .where(SchoolStaff.user_id == user_id)
    )

    staff_result = await session.execute(staff_query)
    staff = staff_result.scalars().first()

    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found"
        )

    # Get user details
    user_query = select(User).where(User.id == user_id)
    user_result = await session.execute(user_query)
    user = user_result.scalars().first()

    # Get department assignments if any
    dept_assignments_query = (
        select(Department)
        .join(
            DepartmentStaffAssignment,
            DepartmentStaffAssignment.department_id == Department.id,
        )
        .where(DepartmentStaffAssignment.staff_id == staff.id)
    )

    dept_result = await session.execute(dept_assignments_query)
    departments = dept_result.scalars().all()

    # Compile and return the combined data
    return {
        "staff_id": staff.id,
        "user_id": user_id,
        "school_id": staff.school_id,
        "school_name": staff.school.name if staff.school else None,
        "staff_type": staff.staff_type,
        "employee_id": staff.employee_id,
        "is_teacher": staff.is_teacher,
        "qualifications": staff.qualifications,
        "expertise_subjects": staff.expertise_subjects,
        "hire_date": staff.hire_date.isoformat() if staff.hire_date else None,
        "is_active": staff.is_active,
        "user_info": {
            "full_name": user.full_name,
            "email": user.email,
            "username": user.username,
            "user_type": user.user_type,
        },
        "departments": [
            {
                "id": dept.id,
                "name": dept.name,
                "code": dept.code,
                "education_level": dept.education_level,
            }
            for dept in departments
        ],
    }


# Course management endpoints
@router.get("/courses/{course_id}", response_model=Dict[str, Any])
async def get_course_details(
    course_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get detailed information about a specific course.
    """
    # Get course with related data
    course_query = (
        select(SchoolCourse)
        .options(
            selectinload(SchoolCourse.school),
            selectinload(SchoolCourse.department),
            selectinload(SchoolCourse.teacher),
        )
        .where(SchoolCourse.id == course_id)
    )

    course_result = await session.execute(course_query)
    course = course_result.scalars().first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )

    # Check authorization - school staff or professor teaching this course
    is_authorized = False

    # Check if user is school admin or staff
    if course.school:
        staff_query = select(SchoolStaff).where(
            SchoolStaff.user_id == current_user.id,
            SchoolStaff.school_id == course.school_id,
        )
        staff_result = await session.execute(staff_query)
        is_authorized = bool(staff_result.scalars().first())

    # Check if user is a professor for this course
    if not is_authorized:
        professor_query = (
            select(SchoolProfessor)
            .join(ProfessorCourse, ProfessorCourse.professor_id == SchoolProfessor.id)
            .where(
                SchoolProfessor.user_id == current_user.id,
                ProfessorCourse.course_id == course_id,
            )
        )
        professor_result = await session.execute(professor_query)
        is_authorized = bool(professor_result.scalars().first())

    # Check if user is a student enrolled in this course
    if not is_authorized:
        student_query = (
            select(SchoolStudent)
            .join(CourseEnrollment, CourseEnrollment.student_id == SchoolStudent.id)
            .where(
                SchoolStudent.user_id == current_user.id,
                CourseEnrollment.course_id == course_id,
            )
        )
        student_result = await session.execute(student_query)
        is_authorized = bool(student_result.scalars().first())

    # If still not authorized, deny access
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this course information",
        )

    # Get student count for the course
    student_count_query = select(func.count(CourseEnrollment.id)).where(
        CourseEnrollment.course_id == course_id
    )
    student_count_result = await session.execute(student_count_query)
    student_count = student_count_result.scalar()

    # Get professors teaching this course
    professors_query = (
        select(SchoolProfessor, ProfessorCourse)
        .join(ProfessorCourse, ProfessorCourse.professor_id == SchoolProfessor.id)
        .join(User, SchoolProfessor.user_id == User.id)
        .where(ProfessorCourse.course_id == course_id)
    )
    professors_result = await session.execute(professors_query)
    professors_data = []

    for professor, professor_course in professors_result:
        user_query = select(User).where(User.id == professor.user_id)
        user_result = await session.execute(user_query)
        user = user_result.scalars().first()

        professors_data.append(
            {
                "id": professor.id,
                "name": user.full_name if user else "Unknown",
                "title": professor.title,
                "role": professor_course.role,
                "academic_rank": professor.academic_rank,
            }
        )

    # Compile the course details with additional data
    course_data = {
        **course.__dict__,
        "studentCount": student_count,
        "professors": professors_data,
        "school_name": course.school.name if course.school else None,
        "department_name": course.department.name if course.department else None,
    }

    return course_data


@router.get("/courses/{course_id}/materials", response_model=List[Dict[str, Any]])
async def get_course_materials(
    course_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get materials for a specific course.
    """
    # First, verify course exists
    course_query = select(SchoolCourse).where(SchoolCourse.id == course_id)
    course_result = await session.execute(course_query)
    course = course_result.scalars().first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )

    # Check authorization (similar to course details endpoint)
    # Implement authorization checks as in the previous endpoint

    # Get course materials
    materials_query = (
        select(CourseMaterial)
        .options(selectinload(CourseMaterial.professor))
        .where(CourseMaterial.course_id == course_id)
        .order_by(CourseMaterial.created_at.desc())
    )

    materials_result = await session.execute(materials_query)
    materials = materials_result.scalars().all()

    # Format materials with professor names
    materials_data = []
    for material in materials:
        # Get professor name
        if material.professor:
            user_query = select(User).where(User.id == material.professor.user_id)
            user_result = await session.execute(user_query)
            user = user_result.scalars().first()
            professor_name = user.full_name if user else "Unknown"
        else:
            professor_name = "Unknown"

        materials_data.append({**material.__dict__, "professor_name": professor_name})

    return materials_data


@router.get("/courses/{course_id}/assignments", response_model=List[Dict[str, Any]])
async def get_course_assignments(
    course_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get assignments for a specific course.
    """
    # Verify course exists
    course_query = select(SchoolCourse).where(SchoolCourse.id == course_id)
    course_result = await session.execute(course_query)
    course = course_result.scalars().first()

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Course not found"
        )

    # Implement authorization checks similar to the course details endpoint

    # Get assignments
    assignments_query = (
        select(Assignment)
        .where(Assignment.course_id == course_id)
        .order_by(Assignment.due_date.desc())
    )

    assignments_result = await session.execute(assignments_query)
    assignments = assignments_result.scalars().all()

    # For each assignment, get submission stats
    assignment_data = []
    for assignment in assignments:
        # Count total submissions
        submission_count_query = select(func.count(AssignmentSubmission.id)).where(
            AssignmentSubmission.assignment_id == assignment.id
        )
        submission_count_result = await session.execute(submission_count_query)
        submission_count = submission_count_result.scalar()

        # Count graded submissions
        graded_count_query = select(func.count(AssignmentSubmission.id)).where(
            AssignmentSubmission.assignment_id == assignment.id,
            AssignmentSubmission.status == "graded",
        )
        graded_count_result = await session.execute(graded_count_query)
        graded_count = graded_count_result.scalar()

        # Get professor info if available
        professor_name = "Unknown"
        if assignment.professor_id:
            professor_query = (
                select(SchoolProfessor)
                .join(User, SchoolProfessor.user_id == User.id)
                .where(SchoolProfessor.id == assignment.professor_id)
            )
            professor_result = await session.execute(professor_query)
            professor_data = professor_result.first()

            if professor_data:
                professor, user = professor_data
                professor_name = user.full_name

        assignment_data.append(
            {
                **assignment.__dict__,
                "submission_count": submission_count,
                "graded_count": graded_count,
                "professor_name": professor_name,
            }
        )

    return assignment_data


@router.get("/courses/{course_id}/students", response_model=List[Dict[str, Any]])
async def get_course_students(
    course_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get students enrolled in a specific course.
    """
    # Verify course exists and implement authorization checks

    # Get enrolled students with user information
    students_query = (
        select(SchoolStudent, User, CourseEnrollment)
        .join(User, SchoolStudent.user_id == User.id)
        .join(CourseEnrollment, CourseEnrollment.student_id == SchoolStudent.id)
        .where(CourseEnrollment.course_id == course_id)
        .order_by(User.full_name)
    )

    students_result = await session.execute(students_query)
    students_data = []

    for student, user, enrollment in students_result:
        students_data.append(
            {
                "id": student.id,
                "student_id": student.student_id,
                "user_id": student.user_id,
                "name": user.full_name,
                "email": user.email,
                "enrollment_date": enrollment.enrollment_date.isoformat()
                if enrollment.enrollment_date
                else None,
                "status": enrollment.status,
                "grade": enrollment.grade,
                "grade_letter": enrollment.grade_letter,
                "attendance_percentage": enrollment.attendance_percentage,
            }
        )

    return students_data


# Staff and User endpoints
@router.get("/users/staff/{user_id}", response_model=Dict[str, Any])
async def get_user_staff_roles(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get all staff roles for a user across different schools.
    """
    # Check authorization - the user can only view their own roles or admin
    if current_user.id != user_id and current_user.user_type != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this information",
        )

    # Get user's staff roles
    staff_query = (
        select(SchoolStaff, School)
        .join(School, SchoolStaff.school_id == School.id)
        .where(SchoolStaff.user_id == user_id)
    )

    staff_result = await session.execute(staff_query)
    staff_roles = []

    for staff, school in staff_result:
        staff_roles.append(
            {
                "staff_id": staff.id,
                "school_id": staff.school_id,
                "school_name": school.name,
                "staff_type": staff.staff_type,
                "is_teacher": staff.is_teacher,
                "employee_id": staff.employee_id,
                "is_active": staff.is_active,
            }
        )

    # Get user's professor roles if any
    professor_query = (
        select(SchoolProfessor, School)
        .join(School, SchoolProfessor.school_id == School.id)
        .where(SchoolProfessor.user_id == user_id)
    )

    professor_result = await session.execute(professor_query)
    professor_roles = []

    for professor, school in professor_result:
        professor_roles.append(
            {
                "professor_id": professor.id,
                "school_id": professor.school_id,
                "school_name": school.name,
                "title": professor.title,
                "academic_rank": professor.academic_rank,
                "is_active": professor.is_active,
            }
        )

    # Get user basic info
    user_query = select(User).where(User.id == user_id)
    user_result = await session.execute(user_query)
    user = user_result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return {
        "user_id": user_id,
        "full_name": user.full_name,
        "email": user.email,
        "username": user.username,
        "user_type": user.user_type,
        "staff_roles": staff_roles,
        "professor_roles": professor_roles,
    }
