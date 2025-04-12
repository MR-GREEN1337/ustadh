from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import select, func
from sqlalchemy import desc, or_
from sqlalchemy.ext.asyncio import AsyncSession

from src.db import get_session
from src.db.models.user import User
from src.db.models.school import (
    School,
    Department,
    SchoolClass,
    SchoolStaff,
    SchoolCourse,
    SchoolStudent,
    ClassEnrollment,
    CourseEnrollment,
    SchoolAnnouncement,
)
from src.api.models.school import (
    SchoolStatsResponse,
    UserListResponse,
    CourseListResponse,
    DepartmentResponse,
    ClassListResponse,
    ActivityLogResponse,
    SchoolSettingsUpdate,
    SystemSettingsUpdate,
)
from src.db.models.school import DepartmentStaffAssignment
from src.api.endpoints.auth import get_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])


# Helper function to format time ago
def format_time_ago(dt: datetime) -> str:
    """Format a datetime as a human-readable 'time ago' string."""
    now = datetime.utcnow()
    diff = now - dt

    if diff.days > 365:
        years = diff.days // 365
        return f"{years} year{'s' if years > 1 else ''} ago"
    elif diff.days > 30:
        months = diff.days // 30
        return f"{months} month{'s' if months > 1 else ''} ago"
    elif diff.days > 0:
        return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    else:
        return "Just now"


# Base stats for admin dashboard
@router.get("/stats", response_model=SchoolStatsResponse)
async def get_school_stats(
    current_user: Tuple[User, Optional[int]] = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get school statistics including student, teacher, and course counts.
    Only accessible to administrators.
    """
    # Get school ID from the admin user
    _, school_id = current_user

    if not school_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with a school",
        )

    # Get counts from database
    result = await session.execute(
        select(func.count())
        .where(SchoolStudent.school_id == school_id)
        .where(SchoolStudent.is_active)
    )
    students_count = result.scalar_one()

    result = await session.execute(
        select(func.count())
        .where(SchoolStaff.school_id == school_id)
        .where(SchoolStaff.is_teacher)
        .where(SchoolStaff.is_active)
    )
    teachers_count = result.scalar_one()

    result = await session.execute(
        select(func.count())
        .where(SchoolCourse.school_id == school_id)
        .where(SchoolCourse.status == "active")
    )
    courses_count = result.scalar_one()

    # Get recent activity (last 7 days)
    one_week_ago = datetime.utcnow() - timedelta(days=7)

    # New students
    result = await session.execute(
        select(func.count())
        .where(SchoolStudent.school_id == school_id)
        .where(SchoolStudent.created_at >= one_week_ago)
    )
    new_students = result.scalar_one()

    # New courses
    result = await session.execute(
        select(func.count())
        .where(SchoolCourse.school_id == school_id)
        .where(SchoolCourse.created_at >= one_week_ago)
    )
    new_courses = result.scalar_one()

    # Get recent system announcements
    result = await session.execute(
        select(SchoolAnnouncement)
        .where(SchoolAnnouncement.school_id == school_id)
        .where(SchoolAnnouncement.created_at >= one_week_ago)
        .order_by(desc(SchoolAnnouncement.created_at))
        .limit(5)
    )
    announcements = result.scalars().all()

    # Calculate system usage (mock data for now)
    # In a real system, this might come from monitoring or analytics services
    system_usage = "92%"

    # Format the recent activity
    recent_activity = []

    # Add new students as activity
    if new_students > 0:
        recent_activity.append(
            {
                "id": 1,
                "type": "user",
                "description": f"{new_students} new student(s) enrolled",
                "time": "This week",
            }
        )

    # Add new courses as activity
    if new_courses > 0:
        recent_activity.append(
            {
                "id": 2,
                "type": "course",
                "description": f"{new_courses} new course(s) added",
                "time": "This week",
            }
        )

    # Add announcements as activity
    for i, announcement in enumerate(announcements):
        recent_activity.append(
            {
                "id": 3 + i,
                "type": "system",
                "description": announcement.title,
                "time": format_time_ago(announcement.created_at),
            }
        )

    # Get system status (mock data for demonstration)
    system_status = {
        "serverStatus": "Operational",
        "databaseStatus": "Operational",
        "aiServicesStatus": "Operational",
        "storageUsage": "72% Used",
        "latestUpdates": [
            "Platform v2.4.0 deployed (3 days ago)",
            "Security patches applied (1 week ago)",
            "Database optimization completed (1 week ago)",
        ],
    }

    return {
        "totalStudents": students_count,
        "totalTeachers": teachers_count,
        "activeCourses": courses_count,
        "systemUsage": system_usage,
        "recentActivity": recent_activity,
        "systemStatus": system_status,
    }


# Students endpoints
@router.get("/students", response_model=UserListResponse)
async def get_students(
    query: Optional[str] = None,
    class_id: Optional[int] = None,
    education_level: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get a paginated list of students with optional filtering.
    Only accessible to administrators.
    """
    school_id = current_user.school_id

    if not school_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with a school",
        )

    # Start building the query
    student_query = select(SchoolStudent).where(SchoolStudent.school_id == school_id)

    # Apply filters
    if query:
        # Get user IDs that match the query
        result = await session.execute(
            select(User.id).where(
                or_(
                    User.full_name.ilike(f"%{query}%"),
                    User.email.ilike(f"%{query}%"),
                    User.username.ilike(f"%{query}%"),
                )
            )
        )
        user_ids = result.scalars().all()

        student_query = student_query.where(SchoolStudent.user_id.in_(user_ids))

    if class_id is not None:
        # Get student IDs enrolled in the specified class
        result = await session.execute(
            select(ClassEnrollment.student_id).where(
                ClassEnrollment.class_id == class_id
            )
        )
        enrollments = result.scalars().all()

        student_query = student_query.where(SchoolStudent.id.in_(enrollments))

    if education_level:
        student_query = student_query.where(
            SchoolStudent.education_level == education_level
        )

    if is_active is not None:
        student_query = student_query.where(SchoolStudent.is_active == is_active)

    # Count total students matching the filters
    count_query = select(func.count()).select_from(student_query.subquery())
    result = await session.execute(count_query)
    total = result.scalar_one()

    # Calculate pagination
    total_pages = (total + limit - 1) // limit
    offset = (page - 1) * limit

    # Get paginated students
    student_query = student_query.offset(offset).limit(limit)
    result = await session.execute(student_query)
    students = result.scalars().all()

    # Get user details for each student
    student_list = []
    for student in students:
        user = await session.get(User, student.user_id)
        if user:
            student_list.append(
                {
                    "id": student.id,
                    "user_id": user.id,
                    "full_name": user.full_name,
                    "email": user.email,
                    "username": user.username,
                    "user_type": "student",
                    "student_id": student.student_id,
                    "education_level": student.education_level,
                    "academic_track": student.academic_track,
                    "enrollment_date": student.enrollment_date,
                    "is_active": student.is_active,
                    "created_at": student.created_at.isoformat()
                    if student.created_at
                    else None,
                }
            )

    return {
        "users": student_list,
        "total": total,
        "page": page,
        "totalPages": total_pages,
    }


# Teachers endpoints
@router.get("/teachers", response_model=UserListResponse)
async def get_teachers(
    query: Optional[str] = None,
    department_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get a paginated list of teachers with optional filtering.
    Only accessible to administrators.
    """
    school_id = current_user.school_id

    if not school_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with a school",
        )

    # Start building the query
    teacher_query = select(SchoolStaff).where(
        SchoolStaff.school_id == school_id, SchoolStaff.is_teacher
    )

    # Apply filters
    if query:
        # Get user IDs that match the query
        result = await session.execute(
            select(User.id).where(
                or_(
                    User.full_name.ilike(f"%{query}%"),
                    User.email.ilike(f"%{query}%"),
                    User.username.ilike(f"%{query}%"),
                )
            )
        )
        user_ids = result.scalars().all()

        teacher_query = teacher_query.where(SchoolStaff.user_id.in_(user_ids))

    if department_id is not None:
        # Get staff IDs in the specified department
        result = await session.execute(
            select(DepartmentStaffAssignment.staff_id).where(
                DepartmentStaffAssignment.department_id == department_id
            )
        )
        staff_ids = result.scalars().all()

        teacher_query = teacher_query.where(SchoolStaff.id.in_(staff_ids))

    if is_active is not None:
        teacher_query = teacher_query.where(SchoolStaff.is_active == is_active)

    # Count total teachers matching the filters
    count_query = select(func.count()).select_from(teacher_query.subquery())
    result = await session.execute(count_query)
    total = result.scalar_one()

    # Calculate pagination
    total_pages = (total + limit - 1) // limit
    offset = (page - 1) * limit

    # Get paginated teachers
    teacher_query = teacher_query.offset(offset).limit(limit)
    result = await session.execute(teacher_query)
    teachers = result.scalars().all()

    # Get user details for each teacher
    teacher_list = []
    for teacher in teachers:
        user = await session.get(User, teacher.user_id)
        if user:
            teacher_list.append(
                {
                    "id": teacher.id,
                    "user_id": user.id,
                    "full_name": user.full_name,
                    "email": user.email,
                    "username": user.username,
                    "user_type": "teacher",
                    "staff_type": teacher.staff_type,
                    "expertise_subjects": teacher.expertise_subjects,
                    "qualifications": teacher.qualifications,
                    "is_active": teacher.is_active,
                    "hire_date": teacher.hire_date,
                    "created_at": teacher.created_at.isoformat()
                    if teacher.created_at
                    else None,
                }
            )

    return {
        "users": teacher_list,
        "total": total,
        "page": page,
        "totalPages": total_pages,
    }


# Courses endpoints
@router.get("/courses", response_model=CourseListResponse)
async def get_courses(
    query: Optional[str] = None,
    department_id: Optional[int] = None,
    education_level: Optional[str] = None,
    academic_year: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get a paginated list of courses with optional filtering.
    Only accessible to administrators.
    """
    school_id = current_user.school_id

    if not school_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with a school",
        )

    # Start building the query
    course_query = select(SchoolCourse).where(SchoolCourse.school_id == school_id)

    # Apply filters
    if query:
        course_query = course_query.where(
            or_(
                SchoolCourse.title.ilike(f"%{query}%"),
                SchoolCourse.code.ilike(f"%{query}%"),
                SchoolCourse.description.ilike(f"%{query}%"),
            )
        )

    if department_id is not None:
        course_query = course_query.where(SchoolCourse.department_id == department_id)

    if education_level:
        course_query = course_query.where(
            SchoolCourse.education_level == education_level
        )

    if academic_year:
        course_query = course_query.where(SchoolCourse.academic_year == academic_year)

    if status:
        course_query = course_query.where(SchoolCourse.status == status)

    # Count total courses matching the filters
    count_query = select(func.count()).select_from(course_query.subquery())
    result = await session.execute(count_query)
    total = result.scalar_one()

    # Calculate pagination
    total_pages = (total + limit - 1) // limit
    offset = (page - 1) * limit

    # Get paginated courses
    course_query = course_query.offset(offset).limit(limit)
    result = await session.execute(course_query)
    courses = result.scalars().all()

    # Get additional details for each course
    course_list = []
    for course in courses:
        # Get department name if available
        department_name = None
        if course.department_id:
            department = await session.get(Department, course.department_id)
            if department:
                department_name = department.name

        # Get teacher name if available
        teacher_name = None
        if course.teacher_id:
            teacher = await session.get(SchoolStaff, course.teacher_id)
            if teacher:
                user = await session.get(User, teacher.user_id)
                if user:
                    teacher_name = user.full_name

        # Count enrolled students
        result = await session.execute(
            select(func.count())
            .where(CourseEnrollment.course_id == course.id)
            .where(CourseEnrollment.status == "enrolled")
        )
        students_count = result.scalar_one()

        course_list.append(
            {
                "id": course.id,
                "title": course.title,
                "code": course.code,
                "description": course.description,
                "academic_year": course.academic_year,
                "education_level": course.education_level,
                "academic_track": course.academic_track,
                "department_id": course.department_id,
                "department_name": department_name,
                "teacher_id": course.teacher_id,
                "teacher_name": teacher_name,
                "status": course.status,
                "students_count": students_count,
                "ai_tutoring_enabled": course.ai_tutoring_enabled,
            }
        )

    return {
        "courses": course_list,
        "total": total,
        "page": page,
        "totalPages": total_pages,
    }


# Departments endpoints
@router.get("/departments", response_model=List[DepartmentResponse])
async def get_departments(
    current_user: User = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get all departments in the school.
    Only accessible to administrators.
    """
    school_id = current_user.school_id

    if not school_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with a school",
        )

    # Get all departments
    result = await session.execute(
        select(Department).where(Department.school_id == school_id)
    )
    departments = result.scalars().all()

    # Get additional details for each department
    department_list = []
    for department in departments:
        # Count staff members
        result = await session.execute(
            select(func.count()).where(
                DepartmentStaffAssignment.department_id == department.id
            )
        )
        staff_count = result.scalar_one()

        # Count courses
        result = await session.execute(
            select(func.count()).where(SchoolCourse.department_id == department.id)
        )
        courses_count = result.scalar_one()

        department_list.append(
            {
                "id": department.id,
                "name": department.name,
                "code": department.code,
                "description": department.description,
                "education_level": department.education_level,
                "staff_count": staff_count,
                "courses_count": courses_count,
            }
        )

    return department_list


# Classes endpoints
@router.get("/classes", response_model=ClassListResponse)
async def get_classes(
    academic_year: Optional[str] = None,
    education_level: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get a paginated list of classes with optional filtering.
    Only accessible to administrators.
    """
    school_id = current_user.school_id

    if not school_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with a school",
        )

    # Start building the query
    class_query = select(SchoolClass).where(SchoolClass.school_id == school_id)

    # Apply filters
    if academic_year:
        class_query = class_query.where(SchoolClass.academic_year == academic_year)

    if education_level:
        class_query = class_query.where(SchoolClass.education_level == education_level)

    # Count total classes matching the filters
    count_query = select(func.count()).select_from(class_query.subquery())
    result = await session.execute(count_query)
    total = result.scalar_one()

    # Calculate pagination
    total_pages = (total + limit - 1) // limit
    offset = (page - 1) * limit

    # Get paginated classes
    class_query = class_query.offset(offset).limit(limit)
    result = await session.execute(class_query)
    classes = result.scalars().all()

    # Get additional details for each class
    class_list = []
    for school_class in classes:
        # Get homeroom teacher name if available
        homeroom_teacher_name = None
        if school_class.homeroom_teacher_id:
            teacher = await session.get(SchoolStaff, school_class.homeroom_teacher_id)
            if teacher:
                user = await session.get(User, teacher.user_id)
                if user:
                    homeroom_teacher_name = user.full_name

        # Count enrolled students
        result = await session.execute(
            select(func.count())
            .where(ClassEnrollment.class_id == school_class.id)
            .where(ClassEnrollment.status == "active")
        )
        students_count = result.scalar_one()

        class_list.append(
            {
                "id": school_class.id,
                "name": school_class.name,
                "academic_year": school_class.academic_year,
                "education_level": school_class.education_level,
                "academic_track": school_class.academic_track,
                "homeroom_teacher_name": homeroom_teacher_name,
                "students_count": students_count,
            }
        )

    return {
        "classes": class_list,
        "total": total,
        "page": page,
        "totalPages": total_pages,
    }


# Activity log endpoints
@router.get("/activity-log", response_model=ActivityLogResponse)
async def get_activity_log(
    startDate: Optional[datetime] = None,
    endDate: Optional[datetime] = None,
    type: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get a paginated list of system activities.
    Only accessible to administrators.
    """
    school_id = current_user.school_id

    if not school_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with a school",
        )

    # In a real implementation, this would query a dedicated activity log table
    # For this example, we'll use the announcements table as a simple activity log

    # Start building the query
    activity_query = select(SchoolAnnouncement).where(
        SchoolAnnouncement.school_id == school_id
    )

    # Apply filters
    if startDate:
        activity_query = activity_query.where(
            SchoolAnnouncement.created_at >= startDate
        )

    if endDate:
        activity_query = activity_query.where(SchoolAnnouncement.created_at <= endDate)

    if type:
        activity_query = activity_query.where(SchoolAnnouncement.audience_type == type)

    # Count total activities matching the filters
    count_query = select(func.count()).select_from(activity_query.subquery())
    result = await session.execute(count_query)
    total = result.scalar_one()

    # Calculate pagination
    total_pages = (total + limit - 1) // limit
    offset = (page - 1) * limit

    # Get paginated activities
    activity_query = (
        activity_query.order_by(desc(SchoolAnnouncement.created_at))
        .offset(offset)
        .limit(limit)
    )
    result = await session.execute(activity_query)
    announcements = result.scalars().all()

    # Format activities
    activities = []
    for i, announcement in enumerate(announcements):
        publisher = await session.get(SchoolStaff, announcement.published_by)
        publisher_name = "Unknown"

        if publisher:
            user = await session.get(User, publisher.user_id)
            if user:
                publisher_name = user.full_name

        activities.append(
            {
                "id": announcement.id,
                "type": announcement.audience_type,
                "description": announcement.title,
                "time": format_time_ago(announcement.created_at),
                "details": {
                    "content": announcement.content,
                    "publisher": publisher_name,
                    "priority": announcement.priority,
                },
            }
        )

    return {
        "activities": activities,
        "total": total,
        "page": page,
        "totalPages": total_pages,
    }


# Dashboard summary
@router.get("/dashboard/summary")
async def get_dashboard_summary(
    current_user: Tuple[User, Optional[int]] = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get a comprehensive summary for the admin dashboard.
    Includes stats, recent students, teachers, and courses.
    """
    _, school_id = current_user

    if not school_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with a school",
        )

    # Get base stats first
    stats = await get_school_stats(current_user, session)

    # Get 5 most recently added students
    result = await session.execute(
        select(SchoolStudent)
        .where(SchoolStudent.school_id == school_id)
        .order_by(desc(SchoolStudent.created_at))
        .limit(5)
    )
    recent_students = result.scalars().all()

    # Get student details
    recent_student_list = []
    for student in recent_students:
        user = await session.get(User, student.user_id)
        if user:
            recent_student_list.append(
                {
                    "id": student.id,
                    "user_id": user.id,
                    "full_name": user.full_name,
                    "email": user.email,
                    "education_level": student.education_level,
                    "created_at": student.created_at.isoformat()
                    if student.created_at
                    else None,
                }
            )

    # Get 5 most recently added teachers
    result = await session.execute(
        select(SchoolStaff)
        .where(SchoolStaff.school_id == school_id)
        .where(SchoolStaff.is_teacher)
        .order_by(desc(SchoolStaff.created_at))
        .limit(5)
    )
    recent_teachers = result.scalars().all()

    # Get teacher details
    recent_teacher_list = []
    for teacher in recent_teachers:
        user = await session.get(User, teacher.user_id)
        if user:
            recent_teacher_list.append(
                {
                    "id": teacher.id,
                    "user_id": user.id,
                    "full_name": user.full_name,
                    "email": user.email,
                    "staff_type": teacher.staff_type,
                    "created_at": teacher.created_at.isoformat()
                    if teacher.created_at
                    else None,
                }
            )

    # Get 5 most recently added courses
    result = await session.execute(
        select(SchoolCourse)
        .where(SchoolCourse.school_id == school_id)
        .order_by(desc(SchoolCourse.created_at))
        .limit(5)
    )
    recent_courses = result.scalars().all()

    # Get course details
    recent_course_list = []
    for course in recent_courses:
        recent_course_list.append(
            {
                "id": course.id,
                "title": course.title,
                "code": course.code,
                "education_level": course.education_level,
                "academic_year": course.academic_year,
                "status": course.status,
                "created_at": course.created_at.isoformat()
                if course.created_at
                else None,
            }
        )

    return {
        "stats": stats,
        "recentStudents": recent_student_list,
        "recentTeachers": recent_teacher_list,
        "recentCourses": recent_course_list,
    }


# School settings endpoints
@router.patch("/settings/school", response_model=Dict[str, Any])
async def update_school_settings(
    settings: SchoolSettingsUpdate,
    current_user: User = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Update school settings.
    Only accessible to administrators.
    """
    school_id = current_user.school_id

    if not school_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with a school",
        )

    # Get the school
    school = await session.get(School, school_id)
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="School not found"
        )

    # Update the school settings
    update_data = settings.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(school, key, value)

    # Set updated_at timestamp
    school.updated_at = datetime.utcnow()

    # Save changes
    session.add(school)
    await session.commit()
    await session.refresh(school)

    return {
        "success": True,
        "message": "School settings updated successfully",
        "updated_fields": list(update_data.keys()),
    }


# System settings endpoints
@router.patch("/settings/system", response_model=Dict[str, Any])
async def update_system_settings(
    settings: SystemSettingsUpdate,
    current_user: User = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Update system settings.
    Only accessible to administrators.
    """
    school_id = current_user.school_id

    if not school_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with a school",
        )

    # Get the school
    school = await session.get(School, school_id)
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="School not found"
        )

    # Update settings
    update_data = settings.dict(exclude_unset=True)

    # Handle special cases
    if "integration_settings" in update_data and school.integration_settings:
        # Merge integration settings
        school.integration_settings.update(update_data["integration_settings"])
    else:
        # Apply all other updates directly
        for key, value in update_data.items():
            setattr(school, key, value)

    # Set updated_at timestamp
    school.updated_at = datetime.utcnow()

    # Save changes
    session.add(school)
    await session.commit()
    await session.refresh(school)

    return {
        "success": True,
        "message": "System settings updated successfully",
        "updated_fields": list(update_data.keys()),
    }


# Generated reports endpoint
@router.get("/reports")
async def generate_report(
    reportType: str,
    startDate: Optional[datetime] = None,
    endDate: Optional[datetime] = None,
    format: str = "pdf",
    current_user: User = Depends(get_admin_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Generate administrative reports.
    Only accessible to administrators.
    """
    school_id = current_user.school_id

    if not school_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with a school",
        )

    # Validate report type
    valid_report_types = [
        "students",
        "teachers",
        "courses",
        "attendance",
        "performance",
        "activities",
        "system",
    ]

    if reportType not in valid_report_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid report type. Must be one of: {', '.join(valid_report_types)}",
        )

    # Validate format
    valid_formats = ["pdf", "excel", "json"]
    if format not in valid_formats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid format. Must be one of: {', '.join(valid_formats)}",
        )

    # For this example, we'll just return a simple JSON response
    # In a real implementation, this would generate a PDF or Excel file

    # Set date range defaults if not provided
    if not endDate:
        endDate = datetime.utcnow()

    if not startDate:
        # Default to 30 days before end date
        startDate = endDate - timedelta(days=30)

    # Get basic statistics for the report
    if reportType == "students":
        result = await session.execute(
            select(func.count())
            .where(SchoolStudent.school_id == school_id)
            .where(SchoolStudent.created_at.between(startDate, endDate))
        )
        new_count = result.scalar_one()

        result = await session.execute(
            select(func.count())
            .where(SchoolStudent.school_id == school_id)
            .where(SchoolStudent.is_active)
        )
        active_count = result.scalar_one()

        report_data = {
            "reportType": reportType,
            "startDate": startDate.isoformat(),
            "endDate": endDate.isoformat(),
            "format": format,
            "totalStudents": active_count,
            "newStudents": new_count,
            "educationLevelBreakdown": {
                "primary": 423,  # Mock data
                "college": 385,  # Mock data
                "lycee": 439,  # Mock data
            },
        }

    elif reportType == "teachers":
        result = await session.execute(
            select(func.count())
            .where(SchoolStaff.school_id == school_id)
            .where(SchoolStaff.is_teacher)
            .where(SchoolStaff.created_at.between(startDate, endDate))
        )
        new_count = result.scalar_one()

        result = await session.execute(
            select(func.count())
            .where(SchoolStaff.school_id == school_id)
            .where(SchoolStaff.is_teacher)
            .where(SchoolStaff.is_active)
        )
        active_count = result.scalar_one()

        report_data = {
            "reportType": reportType,
            "startDate": startDate.isoformat(),
            "endDate": endDate.isoformat(),
            "format": format,
            "totalTeachers": active_count,
            "newTeachers": new_count,
            "departmentBreakdown": {
                "mathematics": 12,  # Mock data
                "sciences": 18,  # Mock data
                "languages": 16,  # Mock data
                "other": 38,  # Mock data
            },
        }

    else:
        # Basic template for other report types
        report_data = {
            "reportType": reportType,
            "startDate": startDate.isoformat(),
            "endDate": endDate.isoformat(),
            "format": format,
            "message": f"This is a placeholder for the {reportType} report",
            "note": "In a real implementation, this would return a PDF or Excel file",
        }

    # Add metadata
    report_data["generatedAt"] = datetime.utcnow().isoformat()
    report_data["generatedBy"] = current_user.full_name

    # Return JSON response
    # In a real implementation, this would return a file with the appropriate content type
    return report_data
