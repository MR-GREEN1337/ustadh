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
    ClassEnrollment,
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
from src.db.models.content import Subject, Course
from src.db.models.progress import Activity, Enrollment, Achievement
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


@router.get("/students/{user_id}", response_model=Dict[str, Any])
async def get_student_details(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get detailed information about a student, including enrollment and academic details.
    This endpoint handles both students linked to schools and individual learners.
    """
    try:
        # Check authorization - user can only access their own info or proper roles
        is_authorized = False
        if current_user.id == user_id:
            is_authorized = True
        elif current_user.user_type in ["admin", "teacher", "school_admin"]:
            # Check if admin/teacher has access to this student's school
            # For now, simplified check - in production you might want more complex logic
            is_authorized = True

        # For school staff/admin, check if they belong to the same school
        if not is_authorized and current_user.user_type in ["school_admin"]:
            # Get the student's school if they're in a school
            student_query = select(SchoolStudent).where(
                SchoolStudent.user_id == user_id
            )
            student_result = await session.execute(student_query)
            student_data = student_result.scalars().first()

            if student_data:
                # Check if current user is staff at this school
                staff_query = select(SchoolStaff).where(
                    SchoolStaff.user_id == current_user.id,
                    SchoolStaff.school_id == student_data.school_id,
                )
                staff_result = await session.execute(staff_query)
                is_authorized = bool(staff_result.scalars().first())

        # For teachers/professors, check if they teach this student
        if not is_authorized and current_user.user_type == "teacher":
            # Check if teacher has any courses with this student
            teacher_query = select(SchoolStaff).where(
                SchoolStaff.user_id == current_user.id, SchoolStaff.is_teacher
            )
            teacher_result = await session.execute(teacher_query)
            teacher = teacher_result.scalars().first()

            if teacher:
                # Check if teacher teaches any course this student is enrolled in
                student_courses_query = (
                    select(CourseEnrollment)
                    .join(
                        SchoolStudent, CourseEnrollment.student_id == SchoolStudent.id
                    )
                    .join(SchoolCourse, CourseEnrollment.course_id == SchoolCourse.id)
                    .where(
                        SchoolStudent.user_id == user_id,
                        SchoolCourse.teacher_id == teacher.id,
                    )
                )
                student_courses_result = await session.execute(student_courses_query)
                is_authorized = bool(student_courses_result.scalars().first())

        # If not authorized, deny access
        if not is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this student's information",
            )

        # Get user details first (all students have a user record)
        user_query = select(User).where(User.id == user_id)
        user_result = await session.execute(user_query)
        user = user_result.scalars().first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Check if user is a student type
        if user.user_type != "student":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="User is not a student"
            )

        # Initialize response structure
        response = {
            "user_info": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "username": user.username,
                "avatar": user.avatar,
                "locale": user.locale,
                "learning_style": getattr(user, "learning_style", None),
                "study_habits": getattr(user, "study_habits", []),
                "academic_goals": getattr(user, "academic_goals", []),
                "education_level": getattr(user, "education_level", None),
                "academic_track": getattr(user, "academic_track", None),
                "school_type": getattr(user, "school_type", None),
                "region": getattr(user, "region", None),
            },
            "academic_info": {
                "total_courses": 0,
                "completed_courses": 0,
                "in_progress_courses": 0,
                "average_grade": None,
                "classes": [],
                "courses": [],
            },
        }

        # Check if student is linked to a school
        student_query = (
            select(SchoolStudent)
            .options(selectinload(SchoolStudent.school))
            .where(SchoolStudent.user_id == user_id)
        )
        student_result = await session.execute(student_query)
        school_student = student_result.scalars().first()

        if school_student:
            # Student is linked to a school
            response["student_info"] = {
                "id": school_student.id,
                "user_id": school_student.user_id,
                "student_id": school_student.student_id,
                "school_id": school_student.school_id,
                "school_name": school_student.school.name
                if school_student.school
                else None,
                "education_level": school_student.education_level,
                "academic_track": school_student.academic_track,
                "enrollment_date": school_student.enrollment_date.isoformat()
                if school_student.enrollment_date
                else None,
                "is_active": school_student.is_active,
                "graduation_year": school_student.graduation_year,
                "is_school_student": True,
            }

            # Get class enrollments
            class_enrollments_query = (
                select(ClassEnrollment, SchoolClass)
                .join(SchoolClass, ClassEnrollment.class_id == SchoolClass.id)
                .where(ClassEnrollment.student_id == school_student.id)
            )
            class_enrollments_result = await session.execute(class_enrollments_query)
            class_enrollments = class_enrollments_result.all()

            # Get course enrollments with additional data
            course_enrollments_query = (
                select(CourseEnrollment, SchoolCourse)
                .join(SchoolCourse, CourseEnrollment.course_id == SchoolCourse.id)
                .where(CourseEnrollment.student_id == school_student.id)
            )
            course_enrollments_result = await session.execute(course_enrollments_query)
            course_enrollments = course_enrollments_result.all()

            # Calculate statistics
            total_courses = len(course_enrollments)
            completed_courses = sum(
                1
                for enrollment, _ in course_enrollments
                if enrollment.status == "completed"
            )

            # Calculate average grade if available
            grades = [
                enrollment.grade
                for enrollment, _ in course_enrollments
                if enrollment.grade is not None
            ]
            average_grade = sum(grades) / len(grades) if grades else None

            # Update academic info
            response["academic_info"] = {
                "total_courses": total_courses,
                "completed_courses": completed_courses,
                "in_progress_courses": total_courses - completed_courses,
                "average_grade": average_grade,
                "classes": [
                    {
                        "id": school_class.id,
                        "name": school_class.name,
                        "academic_year": school_class.academic_year,
                        "education_level": school_class.education_level,
                        "academic_track": school_class.academic_track,
                        "enrollment_status": enrollment.status,
                    }
                    for enrollment, school_class in class_enrollments
                ],
                "courses": [
                    {
                        "id": course.id,
                        "title": course.title,
                        "code": course.code,
                        "academic_year": course.academic_year,
                        "education_level": course.education_level,
                        "academic_track": course.academic_track,
                        "enrollment_status": enrollment.status,
                        "grade": enrollment.grade,
                        "grade_letter": enrollment.grade_letter,
                        "progress_percentage": enrollment.progress_percentage
                        if hasattr(enrollment, "progress_percentage")
                        else None,
                    }
                    for enrollment, course in course_enrollments
                ],
            }
        else:
            # Individual learner - not linked to a school
            # Get platform enrollments and activities

            # Add indicator this is not a school student
            response["student_info"] = {
                "user_id": user.id,
                "is_school_student": False,
                "education_level": user.education_level,
                "academic_track": user.academic_track,
            }

            # Check for platform enrollments (self-guided courses)
            enrollments_query = select(Enrollment).where(Enrollment.user_id == user_id)
            enrollments_result = await session.execute(enrollments_query)
            enrollments = enrollments_result.scalars().all()

            # Get course data for each enrollment
            platform_courses = []
            for enrollment in enrollments:
                course_query = select(Course).where(Course.id == enrollment.subject_id)
                course_result = await session.execute(course_query)
                course = course_result.scalars().first()

                if course:
                    platform_courses.append(
                        {
                            "id": course.id,
                            "title": course.title,
                            "difficulty_level": course.difficulty_level,
                            "education_level": course.education_level,
                            "academic_track": course.academic_track,
                            "enrollment_status": "completed"
                            if enrollment.completed
                            else "in_progress",
                            "progress_percentage": enrollment.progress_percentage,
                            "is_platform_course": True,
                        }
                    )

            # Get learning activities
            activities_query = select(Activity).where(Activity.user_id == user_id)
            activities_result = await session.execute(activities_query)
            activities = activities_result.scalars().all()

            # Calculate activity statistics
            completed_activities = sum(
                1 for activity in activities if activity.status == "completed"
            )
            scores = [
                activity.score for activity in activities if activity.score is not None
            ]
            average_score = sum(scores) / len(scores) if scores else None

            # Update academic info for platform learner
            response["academic_info"] = {
                "total_courses": len(platform_courses),
                "completed_courses": sum(
                    1
                    for course in platform_courses
                    if course.get("enrollment_status") == "completed"
                ),
                "in_progress_courses": sum(
                    1
                    for course in platform_courses
                    if course.get("enrollment_status") == "in_progress"
                ),
                "average_score": average_score,
                "total_activities": len(activities),
                "completed_activities": completed_activities,
                "platform_courses": platform_courses,
                "recent_activities": [
                    {
                        "id": activity.id,
                        "type": activity.type,
                        "status": activity.status,
                        "start_time": activity.start_time.isoformat()
                        if activity.start_time
                        else None,
                        "end_time": activity.end_time.isoformat()
                        if activity.end_time
                        else None,
                        "score": activity.score,
                        "max_score": activity.max_score,
                        "mastery_level": activity.mastery_level,
                    }
                    for activity in sorted(
                        activities,
                        key=lambda x: x.start_time or datetime.min,
                        reverse=True,
                    )[:10]
                ],
            }

        return response

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error retrieving student details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving student details",
        )


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

    # Convert ORM models to dictionaries
    user_dict = {
        "id": professor.user.id,
        "username": professor.user.username,
        "full_name": professor.user.full_name,
        "email": professor.user.email,
        "user_type": professor.user.user_type,
        "avatar": professor.user.avatar,
        "locale": professor.user.locale,
        "settings": professor.user.settings,
        # Add other user fields you need for your response model
    }

    department_dict = None
    if professor.department:
        department_dict = {
            "id": professor.department.id,
            "name": professor.department.name,
            # Add other department fields needed
        }

    # Create a response dictionary that matches your ProfessorResponse model
    response = {
        "id": professor.id,
        "user": user_dict,
        "school_id": professor.school_id,
        "department": department_dict,
        "title": professor.title,
        "academic_rank": professor.academic_rank,
        "tenure_status": professor.tenure_status,
        "specializations": professor.specializations,
        "teaching_languages": professor.teaching_languages,
        "preferred_subjects": professor.preferred_subjects,
        "education_levels": professor.education_levels,
        "office_hours": professor.office_hours,
        "office_location": professor.office_location,
        "contact_preferences": professor.contact_preferences,
        "tutoring_availability": professor.tutoring_availability,
        "max_students": professor.max_students,
        # Add any other fields from your SchoolProfessor model
    }

    return response


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


# Add these endpoints to your schools router


@router.get("/students/{user_id}/enrollments", response_model=List[Dict[str, Any]])
async def get_student_enrollments(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get all course enrollments for a student, including details about each course.
    """
    try:
        # Authorization check (similar to the get_student_details endpoint)
        is_authorized = False
        if current_user.id == user_id:
            is_authorized = True
        elif current_user.user_type in ["admin", "teacher", "school_admin"]:
            is_authorized = True  # Simplified for now

        # Additional authorization checks could go here as needed

        if not is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this student's enrollment information",
            )

        # Find the SchoolStudent record
        student_query = select(SchoolStudent).where(SchoolStudent.user_id == user_id)
        student_result = await session.execute(student_query)
        student = student_result.scalars().first()

        if not student:
            # Check if this is a platform user without school affiliation
            user_check = select(User).where(User.id == user_id)
            user_result = await session.execute(user_check)
            user = user_result.scalars().first()

            if not user or user.user_type != "student":
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
                )

            # Return platform enrollments for non-school students
            platform_enrollments_query = (
                select(Enrollment, Subject)
                .join(Subject, Enrollment.subject_id == Subject.id)
                .where(Enrollment.user_id == user_id)
            )
            platform_enrollments_result = await session.execute(
                platform_enrollments_query
            )
            platform_enrollments = platform_enrollments_result.all()

            return [
                {
                    "id": enrollment.id,
                    "user_id": enrollment.user_id,
                    "course": {
                        "id": subject.id,
                        "title": subject.name,
                        "description": subject.description,
                        "subject_code": subject.subject_code,
                        "education_level": subject.grade_level,
                        "academic_track": subject.academic_track,
                    },
                    "enrolled_at": enrollment.enrolled_at.isoformat()
                    if enrollment.enrolled_at
                    else None,
                    "active": enrollment.active,
                    "completed": enrollment.completed,
                    "completed_at": enrollment.completed_at.isoformat()
                    if enrollment.completed_at
                    else None,
                    "progress_percentage": enrollment.progress_percentage,
                    "status": "completed" if enrollment.completed else "in_progress",
                    "is_platform_enrollment": True,
                }
                for enrollment, subject in platform_enrollments
            ]

        # For school students, get detailed course enrollments
        enrollments_query = (
            select(CourseEnrollment, SchoolCourse)
            .join(SchoolCourse, CourseEnrollment.course_id == SchoolCourse.id)
            .where(CourseEnrollment.student_id == student.id)
        )

        enrollments_result = await session.execute(enrollments_query)
        enrollments = enrollments_result.all()

        # Format response with detailed course info
        return [
            {
                "id": enrollment.id,
                "student_id": enrollment.student_id,
                "course": {
                    "id": course.id,
                    "title": course.title,
                    "code": course.code,
                    "description": course.description,
                    "academic_year": course.academic_year,
                    "education_level": course.education_level,
                    "academic_track": course.academic_track,
                    "ai_tutoring_enabled": course.ai_tutoring_enabled,
                    "start_date": course.start_date.isoformat()
                    if course.start_date
                    else None,
                    "end_date": course.end_date.isoformat()
                    if course.end_date
                    else None,
                },
                "academic_year": enrollment.academic_year,
                "enrollment_date": enrollment.enrollment_date.isoformat()
                if enrollment.enrollment_date
                else None,
                "grade": enrollment.grade,
                "grade_letter": enrollment.grade_letter,
                "attendance_percentage": enrollment.attendance_percentage,
                "status": enrollment.status,
                "completion_date": enrollment.completion_date.isoformat()
                if enrollment.completion_date
                else None,
                "progress_percentage": getattr(enrollment, "progress_percentage", None),
                "is_platform_enrollment": False,
            }
            for enrollment, course in enrollments
        ]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student enrollments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving student enrollments",
        )


# Add these endpoints to your progress router


@router.get("/achievements", response_model=List[Dict[str, Any]])
async def get_achievements(
    user_id: Optional[int] = Query(None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get achievements for a user. If user_id is not provided, returns achievements for the current user.
    """
    try:
        # Determine which user to fetch achievements for
        target_user_id = user_id if user_id is not None else current_user.id

        # Authorization check
        if target_user_id != current_user.id and current_user.user_type not in [
            "admin",
            "teacher",
            "school_admin",
        ]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this user's achievements",
            )

        # Fetch achievements
        achievements_query = select(Achievement).where(
            Achievement.user_id == target_user_id
        )
        achievements_result = await session.execute(achievements_query)
        achievements = achievements_result.scalars().all()

        # Format the response
        return [
            {
                "id": achievement.id,
                "title": achievement.title,
                "description": achievement.description,
                "type": achievement.type,
                "icon": achievement.icon,
                "awarded_at": achievement.awarded_at.isoformat()
                if achievement.awarded_at
                else None,
                "points": achievement.points,
                "meta_data": achievement.meta_data or {},
            }
            for achievement in achievements
        ]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching achievements: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving achievements",
        )


@router.get("/stats", response_model=Dict[str, Any])
async def get_learning_stats(
    user_id: Optional[int] = Query(None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get learning statistics for a user. If user_id is not provided, returns stats for the current user.
    """
    try:
        # Determine which user to fetch stats for
        target_user_id = user_id if user_id is not None else current_user.id

        # Authorization check
        if target_user_id != current_user.id and current_user.user_type not in [
            "admin",
            "teacher",
            "school_admin",
        ]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this user's learning statistics",
            )

        # Fetch user to check if they exist
        user_query = select(User).where(User.id == target_user_id)
        user_result = await session.execute(user_query)
        user = user_result.scalars().first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        # Get activities
        activities_query = select(Activity).where(Activity.user_id == target_user_id)
        activities_result = await session.execute(activities_query)
        activities = activities_result.scalars().all()

        # Calculate total learning time in hours
        total_learning_seconds = sum(
            (activity.duration_seconds or 0) for activity in activities
        )
        total_learning_hours = round(
            total_learning_seconds / 3600, 1
        )  # Convert to hours with 1 decimal

        # Calculate average scores
        scores = [
            activity.score for activity in activities if activity.score is not None
        ]
        average_score = round(sum(scores) / len(scores), 1) if scores else None

        # Get latest activity date
        latest_activity = None
        if activities:
            sorted_activities = sorted(
                activities,
                key=lambda a: a.end_time or a.start_time or datetime.min,
                reverse=True,
            )
            latest_activity = (
                sorted_activities[0].end_time or sorted_activities[0].start_time
            )

        # Get activity counts by type
        activity_types = {}
        for activity in activities:
            activity_type = activity.type
            if activity_type in activity_types:
                activity_types[activity_type] += 1
            else:
                activity_types[activity_type] = 1

        # Calculate completion rates
        completed_activities = sum(1 for a in activities if a.status == "completed")
        completion_rate = (
            round(completed_activities / len(activities) * 100, 1) if activities else 0
        )

        # Check if the user is a school student
        school_student_query = select(SchoolStudent).where(
            SchoolStudent.user_id == target_user_id
        )
        school_student_result = await session.execute(school_student_query)
        school_student = school_student_result.scalars().first()

        response = {
            "totalLearningHours": total_learning_hours,
            "averageScore": average_score,
            "totalActivities": len(activities),
            "completedActivities": completed_activities,
            "latestActivity": latest_activity.isoformat() if latest_activity else None,
            "activityTypes": activity_types,
            "completionRate": completion_rate,
        }

        # Add school-specific stats if applicable
        if school_student:
            # Get course enrollments and calculate grade average
            enrollments_query = select(CourseEnrollment).where(
                CourseEnrollment.student_id == school_student.id
            )
            enrollments_result = await session.execute(enrollments_query)
            enrollments = enrollments_result.scalars().all()

            # Calculate grade average
            grades = [e.grade for e in enrollments if e.grade is not None]
            average_grade = round(sum(grades) / len(grades), 1) if grades else None

            # Add to response
            response.update(
                {
                    "averageGrade": average_grade,
                    "enrolledCourses": len(enrollments),
                    "completedCourses": sum(
                        1 for e in enrollments if e.status == "completed"
                    ),
                }
            )
        else:
            # For platform students, get enrollments
            platform_enrollments_query = select(Enrollment).where(
                Enrollment.user_id == target_user_id
            )
            platform_enrollments_result = await session.execute(
                platform_enrollments_query
            )
            platform_enrollments = platform_enrollments_result.scalars().all()

            # Add platform-specific stats
            response.update(
                {
                    "enrolledSubjects": len(platform_enrollments),
                    "completedSubjects": sum(
                        1 for e in platform_enrollments if e.completed
                    ),
                    "averageProgress": round(
                        sum(e.progress_percentage for e in platform_enrollments)
                        / len(platform_enrollments),
                        1,
                    )
                    if platform_enrollments
                    else 0,
                }
            )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching learning statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving learning statistics",
        )


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
