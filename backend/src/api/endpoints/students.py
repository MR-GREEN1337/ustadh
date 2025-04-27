from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, func, or_
from datetime import datetime

from ..models.professor import (
    StudentProfileResponse,
    StudentProfile,
    StudentCourseResponse,
    StudentCourse,
    AssignHomeworkRequest,
    NotificationRequest,
    ScheduleEntryRequest,
    StudentListResponse,
)
from ...db.models.school import (
    SchoolStudent,
    CourseEnrollment,
    SchoolCourse,
    Assignment,
)
from ...db.models.professor import SchoolProfessor, ProfessorCourse
from ...db.models.user import User
from ...db.models.communication import Notification
from ...db.models.progress import ScheduleEntry
from ...db.postgresql import get_session
from .auth import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/professors/students", tags=["professor_students"])


@router.get("", response_model=StudentListResponse)
async def get_professor_students(
    course_id: Optional[int] = Query(None, description="Filter by course ID"),
    education_level: Optional[str] = Query(
        None, description="Filter by education level"
    ),
    academic_track: Optional[str] = Query(None, description="Filter by academic track"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by name or ID"),
    page: int = Query(1, gt=0, description="Page number"),
    limit: int = Query(20, gt=0, le=100, description="Items per page"),
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get students for a professor based on filters"""
    # First, verify the user is a professor
    professor = await session.execute(
        select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
    )
    professor = professor.scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=403, detail="User is not a professor")

    # Start building the query
    query = select(SchoolStudent, User).join(User, User.id == SchoolStudent.user_id)

    # Apply course filter if specified
    if course_id:
        # Ensure professor teaches this course
        course_access = await session.execute(
            select(ProfessorCourse).where(
                ProfessorCourse.professor_id == professor.id,
                ProfessorCourse.course_id == course_id,
            )
        )
        if not course_access.scalar_one_or_none():
            raise HTTPException(
                status_code=403, detail="Professor does not teach this course"
            )

        # Join with enrollment to filter students in this course
        query = query.join(
            CourseEnrollment, CourseEnrollment.student_id == SchoolStudent.id
        ).where(CourseEnrollment.course_id == course_id)
    else:
        # If no course specified, get students from all courses the professor teaches
        professor_courses = await session.execute(
            select(ProfessorCourse.course_id).where(
                ProfessorCourse.professor_id == professor.id
            )
        )
        course_ids = [row[0] for row in professor_courses.all()]

        if not course_ids:
            # Professor doesn't teach any courses, return empty list
            return StudentListResponse(students=[], total=0)

        # Join with enrollment to filter students in any of these courses
        query = query.join(
            CourseEnrollment, CourseEnrollment.student_id == SchoolStudent.id
        ).where(CourseEnrollment.course_id.in_(course_ids))

    # Apply other filters
    if education_level:
        query = query.where(SchoolStudent.education_level == education_level)

    if academic_track:
        query = query.where(SchoolStudent.academic_track == academic_track)

    if is_active is not None:
        query = query.where(SchoolStudent.is_active == is_active)

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                User.full_name.ilike(search_term),
                User.username.ilike(search_term),
                SchoolStudent.student_id.ilike(search_term),
            )
        )

    # Make the query unique to avoid duplicates
    query = query.distinct()

    # Get total count for pagination
    count_query = select(func.count()).select_from(query.subquery())
    total = await session.execute(count_query)
    total = total.scalar() or 0

    # Apply pagination
    query = query.offset((page - 1) * limit).limit(limit)

    # Execute the query
    result = await session.execute(query)
    student_rows = result.all()

    # Format the response
    students = []
    for student, user in student_rows:
        # Get enrollment data for the student
        enrollments = await session.execute(
            select(CourseEnrollment, SchoolCourse)
            .join(SchoolCourse, SchoolCourse.id == CourseEnrollment.course_id)
            .where(CourseEnrollment.student_id == student.id)
        )

        # Calculate average performance and attendance
        courses = []
        total_attendance = 0
        total_grade = 0
        course_count = 0

        for enrollment, course in enrollments:
            courses.append(
                StudentCourse(
                    id=enrollment.id,
                    courseId=course.id,
                    title=course.title,
                    grade=enrollment.grade,
                    grade_letter=enrollment.grade_letter,
                    status=enrollment.status,
                    attendance_percentage=enrollment.attendance_percentage,
                    progress=int(enrollment.progress_percentage or 0),
                )
            )

            if enrollment.attendance_percentage is not None:
                total_attendance += enrollment.attendance_percentage

            if enrollment.grade is not None:
                total_grade += enrollment.grade
                course_count += 1

        # Calculate averages
        avg_attendance = round(total_attendance / max(len(courses), 1), 1)
        avg_performance = (
            round(total_grade / max(course_count, 1), 1) if course_count > 0 else None
        )

        students.append(
            StudentProfile(
                id=student.id,
                user_id=user.id,
                student_id=student.student_id,
                name=user.full_name,
                email=user.email,
                education_level=student.education_level,
                academic_track=student.academic_track,
                enrollment_date=student.enrollment_date.isoformat(),
                is_active=student.is_active,
                graduation_year=student.graduation_year,
                courses=courses,
                attendance=avg_attendance,
                performance=avg_performance,
                avatar=user.avatar,
            )
        )

    return StudentListResponse(students=students, total=total)


@router.get("/{student_id}", response_model=StudentProfileResponse)
async def get_student_details(
    student_id: int,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get detailed information about a specific student"""
    # Verify the user is a professor
    professor = await session.execute(
        select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
    )
    professor = professor.scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=403, detail="User is not a professor")

    # Get student and user data
    result = await session.execute(
        select(SchoolStudent, User)
        .join(User, User.id == SchoolStudent.user_id)
        .where(SchoolStudent.id == student_id)
    )
    student_data = result.one_or_none()

    if not student_data:
        raise HTTPException(status_code=404, detail="Student not found")

    student, user = student_data

    # Verify that the professor teaches this student by checking course enrollments
    professor_courses = await session.execute(
        select(ProfessorCourse.course_id).where(
            ProfessorCourse.professor_id == professor.id
        )
    )
    course_ids = [row[0] for row in professor_courses.all()]

    if not course_ids:
        raise HTTPException(
            status_code=403, detail="Professor doesn't teach any courses"
        )

    student_enrollment = await session.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.student_id == student_id,
            CourseEnrollment.course_id.in_(course_ids),
        )
    )

    if not student_enrollment.first():
        raise HTTPException(
            status_code=403, detail="Professor doesn't teach this student"
        )

    # Get detailed enrollment data
    enrollments = await session.execute(
        select(CourseEnrollment, SchoolCourse)
        .join(SchoolCourse, SchoolCourse.id == CourseEnrollment.course_id)
        .where(CourseEnrollment.student_id == student_id)
    )

    courses = []
    total_attendance = 0
    total_grade = 0
    course_count = 0

    for enrollment, course in enrollments:
        courses.append(
            StudentCourse(
                id=enrollment.id,
                courseId=course.id,
                title=course.title,
                grade=enrollment.grade,
                grade_letter=enrollment.grade_letter,
                status=enrollment.status,
                attendance_percentage=enrollment.attendance_percentage,
                progress=int(enrollment.progress_percentage or 0),
            )
        )

        if enrollment.attendance_percentage is not None:
            total_attendance += enrollment.attendance_percentage

        if enrollment.grade is not None:
            total_grade += enrollment.grade
            course_count += 1

    # Calculate averages
    avg_attendance = round(total_attendance / max(len(courses), 1), 1)
    avg_performance = (
        round(total_grade / max(course_count, 1), 1) if course_count > 0 else None
    )

    return StudentProfileResponse(
        student=StudentProfile(
            id=student.id,
            user_id=user.id,
            student_id=student.student_id,
            name=user.full_name,
            email=user.email,
            education_level=student.education_level,
            academic_track=student.academic_track,
            enrollment_date=student.enrollment_date.isoformat(),
            is_active=student.is_active,
            graduation_year=student.graduation_year,
            courses=courses,
            attendance=avg_attendance,
            performance=avg_performance,
            avatar=user.avatar,
        )
    )


@router.get("/{student_id}/courses", response_model=StudentCourseResponse)
async def get_student_courses(
    student_id: int,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get courses enrolled by a specific student"""
    # Verify the user is a professor
    professor = await session.execute(
        select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
    )
    professor = professor.scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=403, detail="User is not a professor")

    # Verify that the professor teaches this student
    professor_courses = await session.execute(
        select(ProfessorCourse.course_id).where(
            ProfessorCourse.professor_id == professor.id
        )
    )
    course_ids = [row[0] for row in professor_courses.all()]

    student_enrollment = await session.execute(
        select(CourseEnrollment).where(
            CourseEnrollment.student_id == student_id,
            CourseEnrollment.course_id.in_(course_ids),
        )
    )

    if not student_enrollment.first():
        raise HTTPException(
            status_code=403, detail="Professor doesn't teach this student"
        )

    # Get all courses for the student
    enrollments = await session.execute(
        select(CourseEnrollment, SchoolCourse)
        .join(SchoolCourse, SchoolCourse.id == CourseEnrollment.course_id)
        .where(CourseEnrollment.student_id == student_id)
    )

    courses = []
    for enrollment, course in enrollments:
        courses.append(
            StudentCourse(
                id=enrollment.id,
                courseId=course.id,
                title=course.title,
                grade=enrollment.grade,
                grade_letter=enrollment.grade_letter,
                status=enrollment.status,
                attendance_percentage=enrollment.attendance_percentage,
                progress=int(enrollment.progress_percentage or 0),
            )
        )

    return StudentCourseResponse(courses=courses)


@router.post("/notify", status_code=201)
async def send_notifications(
    notification: NotificationRequest,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Send notifications to selected students"""
    # Verify the user is a professor
    professor = await session.execute(
        select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
    )
    professor = professor.scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=403, detail="User is not a professor")

    # Verify that the professor teaches these students
    professor_courses = await session.execute(
        select(ProfessorCourse.course_id).where(
            ProfessorCourse.professor_id == professor.id
        )
    )
    course_ids = [row[0] for row in professor_courses.all()]

    if not course_ids:
        raise HTTPException(
            status_code=403, detail="Professor doesn't teach any courses"
        )

    # Get student user IDs
    students = await session.execute(
        select(SchoolStudent.user_id)
        .join(CourseEnrollment, CourseEnrollment.student_id == SchoolStudent.id)
        .where(
            SchoolStudent.id.in_(notification.student_ids),
            CourseEnrollment.course_id.in_(course_ids),
        )
        .distinct()
    )
    student_user_ids = [row[0] for row in students.all()]

    if not student_user_ids:
        raise HTTPException(status_code=404, detail="No valid students found")

    # Create notifications
    now = datetime.utcnow()
    notifications = []

    for user_id in student_user_ids:
        notifications.append(
            Notification(
                user_id=user_id,
                title=notification.title,
                content=notification.content,
                type="professor",
                is_read=False,
                created_at=now,
                priority=notification.priority or "normal",
                action_type=notification.action_type,
                action_data=notification.action_data or {},
            )
        )

    # Add notifications to database
    session.add_all(notifications)
    await session.commit()

    return {"success": True, "count": len(notifications)}


@router.post("/schedule", status_code=201)
async def add_schedule_entry(
    schedule: ScheduleEntryRequest,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Add a schedule entry for selected students"""
    # Verify the user is a professor
    professor = await session.execute(
        select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
    )
    professor = professor.scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=403, detail="User is not a professor")

    # Verify that the professor teaches these students
    professor_courses = await session.execute(
        select(ProfessorCourse.course_id).where(
            ProfessorCourse.professor_id == professor.id
        )
    )
    course_ids = [row[0] for row in professor_courses.all()]

    if not course_ids:
        raise HTTPException(
            status_code=403, detail="Professor doesn't teach any courses"
        )

    # Get student user IDs
    students = await session.execute(
        select(SchoolStudent.user_id)
        .join(CourseEnrollment, CourseEnrollment.student_id == SchoolStudent.id)
        .where(
            SchoolStudent.id.in_(schedule.student_ids),
            CourseEnrollment.course_id.in_(course_ids),
        )
        .distinct()
    )
    student_user_ids = [row[0] for row in students.all()]

    if not student_user_ids:
        raise HTTPException(status_code=404, detail="No valid students found")

    # If course_id is provided, verify the professor teaches it
    if schedule.course_id:
        teaches_course = await session.execute(
            select(ProfessorCourse).where(
                ProfessorCourse.professor_id == professor.id,
                ProfessorCourse.course_id == schedule.course_id,
            )
        )
        if not teaches_course.scalar_one_or_none():
            raise HTTPException(
                status_code=403, detail="Professor doesn't teach this course"
            )

    # Create schedule entries
    now = datetime.utcnow()
    start_time = datetime.fromisoformat(schedule.start_time.replace("Z", "+00:00"))
    end_time = datetime.fromisoformat(schedule.end_time.replace("Z", "+00:00"))

    schedule_entries = []

    for user_id in student_user_ids:
        schedule_entries.append(
            ScheduleEntry(
                user_id=user_id,
                title=schedule.title,
                description=schedule.description,
                entry_type=schedule.entry_type,
                start_time=start_time,
                end_time=end_time,
                is_recurring=schedule.is_recurring or False,
                recurrence_pattern=schedule.recurrence_pattern,
                days_of_week=schedule.days_of_week,
                course_id=schedule.course_id,
                subject_id=schedule.subject_id,
                location=schedule.location,
                color=schedule.color,
                created_at=now,
            )
        )

    # Add schedule entries to database
    session.add_all(schedule_entries)
    await session.commit()

    # Get the ID of the first entry (for reference)
    entry_id = schedule_entries[0].id if schedule_entries else None

    return {"success": True, "entryId": entry_id, "count": len(schedule_entries)}


@router.post("/assignments", status_code=201)
async def assign_homework(
    homework: AssignHomeworkRequest,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Assign homework to selected students"""
    # Verify the user is a professor
    professor = await session.execute(
        select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
    )
    professor = professor.scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=403, detail="User is not a professor")

    # Verify that the professor teaches the course
    teaches_course = await session.execute(
        select(ProfessorCourse).where(
            ProfessorCourse.professor_id == professor.id,
            ProfessorCourse.course_id == homework.course_id,
        )
    )
    if not teaches_course.scalar_one_or_none():
        raise HTTPException(
            status_code=403, detail="Professor doesn't teach this course"
        )

    # Verify students are enrolled in the course
    students = await session.execute(
        select(SchoolStudent.id)
        .join(CourseEnrollment, CourseEnrollment.student_id == SchoolStudent.id)
        .where(
            SchoolStudent.id.in_(homework.student_ids),
            CourseEnrollment.course_id == homework.course_id,
        )
    )
    enrolled_student_ids = [row[0] for row in students.all()]

    if not enrolled_student_ids:
        raise HTTPException(
            status_code=404, detail="No valid students enrolled in this course"
        )

    # Create the assignment
    due_date = datetime.fromisoformat(homework.due_date.replace("Z", "+00:00"))
    now = datetime.utcnow()

    assignment = Assignment(
        course_id=homework.course_id,
        professor_id=professor.id,
        title=homework.title,
        description=homework.description,
        assignment_type="homework",
        assigned_date=now,
        due_date=due_date,
        points_possible=homework.points_possible,
        instructions=homework.description,
        materials=homework.materials or {},
        resources=homework.resources or {},
        is_published=True,
        created_at=now,
    )

    session.add(assignment)
    await session.commit()
    await session.refresh(assignment)

    # Create notifications for the students
    notifications = []
    for student_id in enrolled_student_ids:
        # Get student user_id
        student_result = await session.execute(
            select(SchoolStudent.user_id).where(SchoolStudent.id == student_id)
        )
        user_id = student_result.scalar_one()

        notifications.append(
            Notification(
                user_id=user_id,
                title=f"New Homework Assigned: {homework.title}",
                content=f"Due date: {due_date.strftime('%Y-%m-%d')}",
                type="assignment",
                is_read=False,
                created_at=now,
                priority="normal",
                action_type="view_assignment",
                action_data={"assignment_id": assignment.id},
            )
        )

    session.add_all(notifications)
    await session.commit()

    return {"success": True, "assignmentId": assignment.id}
