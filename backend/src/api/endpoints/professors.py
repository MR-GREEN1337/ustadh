from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select, func
from datetime import datetime, timedelta

from ..models.professor import (
    ProfessorOnboardingResponse,
    ProfessorProfileCreate,
    ProfessorExpertiseUpdate,
    ProfessorAvailabilityUpdate,
    ProfessorCoursesUpdate,
    ScheduleResponse,
    ScheduleEntry,
    PendingItemsResponse,
    PendingItem,
    RecentActivitiesResponse,
    ActivityItem,
    CourseResponse,
    CourseItem,
)
from ...db.models.professor import SchoolProfessor, ProfessorCourse, CourseMaterial
from ...db.models.school import (
    SchoolCourse,
    ClassSchedule,
    Assignment,
    AssignmentSubmission,
    SchoolStudent,
    CourseEnrollment,
    DepartmentStaffAssignment,
)
from ...db.models.user import UserFile
from ...db.models.communication import Message, Notification
from ...db.postgresql import get_session
from .auth import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from sqlalchemy import or_
from pydantic import BaseModel
from typing import Dict, Any, List

from src.api.models.file import AttachFileRequest

router = APIRouter(prefix="/professors", tags=["professors"])


@router.get("/onboarding/status", response_model=ProfessorOnboardingResponse)
async def get_onboarding_status(
    current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)
):
    """Get professor onboarding status"""
    professor: Optional[SchoolProfessor] = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    return {
        "has_completed_onboarding": False,  # professor.has_completed_onboarding,
        "onboarding_step": professor.onboarding_step,
        "onboarding_progress": professor.onboarding_progress,
        "onboarding_started_at": professor.onboarding_started_at,
        "onboarding_completed_at": professor.onboarding_completed_at,
    }


@router.post("/onboarding/profile", response_model=ProfessorOnboardingResponse)
async def update_onboarding_profile(
    profile_data: ProfessorProfileCreate,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Update professor profile during onboarding"""
    professor: Optional[SchoolProfessor] = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Update profile fields
    professor.title = profile_data.title
    professor.academic_rank = profile_data.academic_rank
    professor.tenure_status = profile_data.tenure_status

    # Update onboarding status
    if not professor.onboarding_started_at:
        professor.onboarding_started_at = datetime.utcnow()
    professor.onboarding_step = "expertise"
    professor.onboarding_progress = 20

    session.add(professor)
    await session.commit()
    await session.refresh(professor)

    return {
        "has_completed_onboarding": professor.has_completed_onboarding,
        "onboarding_step": professor.onboarding_step,
        "onboarding_progress": professor.onboarding_progress,
    }


@router.post("/onboarding/expertise", response_model=ProfessorOnboardingResponse)
async def update_onboarding_expertise(
    expertise_data: ProfessorExpertiseUpdate,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Update professor expertise during onboarding"""
    professor: Optional[SchoolProfessor] = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Update expertise fields
    professor.specializations = expertise_data.specializations
    professor.preferred_subjects = expertise_data.preferred_subjects
    professor.education_levels = expertise_data.education_levels
    professor.teaching_languages = expertise_data.teaching_languages

    # Update onboarding status
    professor.onboarding_step = "availability"
    professor.onboarding_progress = 40

    session.add(professor)
    await session.commit()
    await session.refresh(professor)

    return {
        "has_completed_onboarding": professor.has_completed_onboarding,
        "onboarding_step": professor.onboarding_step,
        "onboarding_progress": professor.onboarding_progress,
    }


@router.post("/onboarding/availability", response_model=ProfessorOnboardingResponse)
async def update_onboarding_availability(
    availability_data: ProfessorAvailabilityUpdate,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Update professor availability during onboarding"""
    professor: Optional[SchoolProfessor] = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Update availability fields
    professor.office_location = availability_data.office_location
    professor.office_hours = availability_data.office_hours
    professor.contact_preferences = availability_data.contact_preferences
    professor.tutoring_availability = availability_data.tutoring_availability
    professor.max_students = availability_data.max_students

    # Update onboarding status
    professor.onboarding_step = "courses"
    professor.onboarding_progress = 60

    session.add(professor)
    await session.commit()
    await session.refresh(professor)

    return {
        "has_completed_onboarding": professor.has_completed_onboarding,
        "onboarding_step": professor.onboarding_step,
        "onboarding_progress": professor.onboarding_progress,
    }


@router.post("/onboarding/courses", response_model=ProfessorOnboardingResponse)
async def update_onboarding_courses(
    courses_data: ProfessorCoursesUpdate,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Update professor courses during onboarding"""
    professor: Optional[SchoolProfessor] = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Here you would typically create course relationships
    # For brevity, we're just updating the onboarding status

    # Update onboarding status
    professor.onboarding_step = "teaching_materials"
    professor.onboarding_progress = 80

    session.add(professor)
    await session.commit()
    await session.refresh(professor)

    return {
        "has_completed_onboarding": professor.has_completed_onboarding,
        "onboarding_step": professor.onboarding_step,
        "onboarding_progress": professor.onboarding_progress,
    }


@router.post("/onboarding/complete", response_model=ProfessorOnboardingResponse)
async def complete_onboarding(
    current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)
):
    """Mark professor onboarding as complete"""
    professor: Optional[SchoolProfessor] = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Update onboarding status
    professor.has_completed_onboarding = True
    professor.onboarding_step = "completed"
    professor.onboarding_progress = 100
    professor.onboarding_completed_at = datetime.utcnow()

    session.add(professor)
    await session.commit()
    await session.refresh(professor)

    return {
        "has_completed_onboarding": professor.has_completed_onboarding,
        "onboarding_step": professor.onboarding_step,
        "onboarding_progress": professor.onboarding_progress,
        "onboarding_completed_at": professor.onboarding_completed_at,
    }


# ------------------ New Endpoints for Dashboard ------------------


@router.get("/courses", response_model=CourseResponse)
async def get_professor_courses(
    current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)
):
    """Get the courses taught by the professor"""
    professor: Optional[SchoolProfessor] = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Get the professor's courses with related data
    stmt = (
        select(SchoolCourse)
        .join(ProfessorCourse, ProfessorCourse.course_id == SchoolCourse.id)
        .where(ProfessorCourse.professor_id == professor.id)
        .options(
            joinedload(SchoolCourse.course_enrollments),
            joinedload(SchoolCourse.class_schedules),
        )
    )

    result = await session.execute(stmt)
    db_courses = result.unique().scalars().all()

    # Transform to response model
    # courses_data = []
    for course in db_courses:
        # Get enrollment count
        enrollment_count = len(course.course_enrollments)

        # Get next scheduled class
        next_class = None
        for schedule in sorted(
            course.class_schedules,
            key=lambda x: x.start_date
            if x.start_date > datetime.utcnow()
            else datetime.max,
        ):
            if schedule.start_date > datetime.utcnow():
                next_class = schedule
                break

        # Get course topics from syllabus
        topics = []
        if course.syllabus and "topics" in course.syllabus:
            topics = course.syllabus["topics"]

        # Calculate progress based on course duration
        progress = 0
        if course.start_date and course.end_date:
            total_days = (course.end_date - course.start_date).days
            if total_days > 0:
                days_passed = (datetime.utcnow() - course.start_date).days
                progress = min(100, max(0, int((days_passed / total_days) * 100)))

        courses_dict = [
            {
                "id": course.id,
                "title": course.title,
                "code": course.code,
                "description": course.description,
                "students": enrollment_count,
                "nextClass": next_class.start_date.strftime("%A, %I:%M %p")
                if next_class
                else None,
                "progress": progress,
                "topics": topics,
                "aiGenerated": course.ai_tutoring_enabled,
                "status": course.status,
            }
            for course in db_courses
        ]

    # Create response with the correct structure
    return CourseResponse(courses=courses_dict)


@router.get("/schedule", response_model=ScheduleResponse)
async def get_professor_schedule(
    start_date: str = Query(..., description="Start date in ISO format"),
    end_date: str = Query(..., description="End date in ISO format"),
    view_mode: str = Query(
        "all", description="View mode: all, classes, office_hours, personal"
    ),
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get professor's schedule in a date range"""
    professor: Optional[SchoolProfessor] = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Convert string dates to datetime objects
    try:
        start_datetime = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        end_datetime = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    # Build the query based on view mode
    class_schedules_query = select(ClassSchedule).where(
        ClassSchedule.teacher_id == professor.id,
        ClassSchedule.start_date >= start_datetime,
        ClassSchedule.start_date <= end_datetime,
        ClassSchedule.is_active,
    )

    # Execute the query
    result = await session.execute(class_schedules_query)
    class_schedules = result.scalars().all()

    # Transform to response model
    entries = []
    for schedule in class_schedules:
        # Filter based on view_mode
        entry_type = "class"
        if "Office Hours" in schedule.title:
            entry_type = "office_hours"
        elif "Meeting" in schedule.title:
            entry_type = "meeting"
        elif "Personal" in schedule.title:
            entry_type = "personal"

        if view_mode != "all" and entry_type not in view_mode:
            continue

        # Get day of week as string (0 = Monday, 6 = Sunday)
        day_of_week = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
        ][schedule.day_of_week]

        entries.append(
            ScheduleEntry(
                id=schedule.id,
                title=schedule.title,
                description=schedule.description,
                day=day_of_week,
                start_time=schedule.start_time,
                end_time=schedule.end_time,
                location=schedule.room,
                entry_type=entry_type,
                is_recurring=schedule.recurrence_pattern == "weekly",
                course_id=schedule.course_id,
                color=schedule.color or "#3B82F6",  # Default blue if no color specified
                is_cancelled=schedule.is_cancelled,
                is_completed=False,
            )
        )

    # Sort by day of week and then by start time
    day_order = {
        "Monday": 0,
        "Tuesday": 1,
        "Wednesday": 2,
        "Thursday": 3,
        "Friday": 4,
        "Saturday": 5,
        "Sunday": 6,
    }
    entries.sort(key=lambda x: (day_order.get(x.day, 7), x.start_time))

    return ScheduleResponse(entries=entries)


@router.get("/pending-items", response_model=PendingItemsResponse)
async def get_pending_items(
    current_user=Depends(get_current_user), session: AsyncSession = Depends(get_session)
):
    """Get pending items for professor dashboard"""
    professor: Optional[SchoolProfessor] = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Get assignments that need grading
    assignments_query = (
        select(func.count(AssignmentSubmission.id))
        .join(Assignment, Assignment.id == AssignmentSubmission.assignment_id)
        .join(SchoolCourse, SchoolCourse.id == Assignment.course_id)
        .join(ProfessorCourse, ProfessorCourse.course_id == SchoolCourse.id)
        .where(
            ProfessorCourse.professor_id == professor.id,
            AssignmentSubmission.status == "submitted",
            AssignmentSubmission.graded_at.is_(None),
        )
    )
    assignment_count = await session.execute(assignments_query)
    assignment_count = assignment_count.scalar() or 0

    # Get unread messages for the professor
    messages_query = select(func.count(Message.id)).where(
        Message.recipient_id == current_user.id, not Message.is_read
    )
    message_count = await session.execute(messages_query)
    message_count = message_count.scalar() or 0

    # Get pending enrollment requests if professor has admin access
    enrollment_query = (
        select(func.count(CourseEnrollment.id))
        .join(SchoolCourse, SchoolCourse.id == CourseEnrollment.course_id)
        .join(ProfessorCourse, ProfessorCourse.course_id == SchoolCourse.id)
        .where(
            ProfessorCourse.professor_id == professor.id,
            ProfessorCourse.role == "primary",
            CourseEnrollment.status == "pending",
        )
    )
    enrollment_count = await session.execute(enrollment_query)
    enrollment_count = enrollment_count.scalar() or 0

    # Build the response
    items = []

    if assignment_count > 0:
        items.append(
            PendingItem(
                id=1, type="assignments", count=assignment_count, label="to grade"
            )
        )

    if message_count > 0:
        items.append(
            PendingItem(id=2, type="messages", count=message_count, label="unread")
        )

    if enrollment_count > 0:
        items.append(
            PendingItem(
                id=3,
                type="enrollments",
                count=enrollment_count,
                label="pending approval",
            )
        )

    return PendingItemsResponse(items=items)


@router.get("/activities", response_model=RecentActivitiesResponse)
async def get_recent_activities(
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    limit: int = Query(10, description="Number of activities to return"),
):
    """Get recent activities for professor dashboard"""
    professor: Optional[SchoolProfessor] = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Get the professor's courses
    course_query = (
        select(SchoolCourse.id)
        .join(ProfessorCourse, ProfessorCourse.course_id == SchoolCourse.id)
        .where(ProfessorCourse.professor_id == professor.id)
    )
    course_result = await session.execute(course_query)
    course_ids = course_result.scalars().all()

    # Start building activities list
    activities = []

    # Get recent submissions
    if course_ids:
        submissions_query = (
            select(
                AssignmentSubmission,
                Assignment.title.label("assignment_title"),
                SchoolStudent,
            )
            .join(Assignment, Assignment.id == AssignmentSubmission.assignment_id)
            .join(SchoolStudent, SchoolStudent.id == AssignmentSubmission.student_id)
            .join(SchoolCourse, SchoolCourse.id == Assignment.course_id)
            .where(
                SchoolCourse.id.in_(course_ids),
                AssignmentSubmission.submission_date
                >= (datetime.utcnow() - timedelta(days=7)),
            )
            .order_by(AssignmentSubmission.submission_date.desc())
            .limit(limit)
        )
        submissions_result = await session.execute(submissions_query)
        submissions = submissions_result.all()

        for submission, assignment_title, student in submissions:
            activities.append(
                ActivityItem(
                    id=f"submission_{submission.id}",
                    type="submission",
                    description=f"New submission for {assignment_title} from {student.user_id}",
                    time=submission.submission_date.strftime("%Y-%m-%d %H:%M"),
                )
            )

    # Get recent notifications related to courses
    notifications_query = (
        select(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.created_at >= (datetime.utcnow() - timedelta(days=7)),
        )
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    notifications_result = await session.execute(notifications_query)
    notifications = notifications_result.scalars().all()

    for notification in notifications:
        activities.append(
            ActivityItem(
                id=f"notification_{notification.id}",
                type="notification",
                description=notification.title,
                time=notification.created_at.strftime("%Y-%m-%d %H:%M"),
            )
        )

    # Sort activities by time (most recent first)
    activities.sort(key=lambda x: x.time, reverse=True)

    # Limit to requested number
    activities = activities[:limit]

    return RecentActivitiesResponse(activities=activities)


@router.get("/course/{course_id}")
async def get_course(
    course_id: int,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get a course by ID - simplified version"""
    # Check if professor exists
    professor = await session.execute(
        select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
    )
    professor = professor.scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor not found")

    # Check if professor has access to this course
    access_check = await session.execute(
        select(ProfessorCourse).where(
            ProfessorCourse.professor_id == professor.id,
            ProfessorCourse.course_id == course_id,
        )
    )

    if not access_check.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied to this course")

    # Get the course - simple approach
    course_query = select(SchoolCourse).where(SchoolCourse.id == course_id)
    course_result = await session.execute(course_query)
    course = course_result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Convert SQLModel to dict for response
    course_dict = {
        "id": course.id,
        "title": course.title,
        "code": course.code,
        "description": course.description,
        "status": course.status,
        "academic_year": course.academic_year,
        "education_level": course.education_level,
        "academic_track": course.academic_track,
        "department_id": course.department_id,
        "start_date": course.start_date,
        "end_date": course.end_date,
        "syllabus": course.syllabus,
        "learning_objectives": course.learning_objectives,
        "prerequisites": course.prerequisites,
        "ai_tutoring_enabled": course.ai_tutoring_enabled,
        "ai_tutoring_config": course.ai_tutoring_config,
        "suggested_topics": course.suggested_topics,
        "grading_schema": course.grading_schema,
        "assessment_types": course.assessment_types,
        "created_at": course.created_at,
        "updated_at": course.updated_at,
    }

    return course_dict


@router.get("/courses/{course_id}/students")
async def get_course_students(
    course_id: int,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get students enrolled in a specific course"""
    professor: Optional[SchoolProfessor] = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Check if professor teaches this course
    course_access_query = select(ProfessorCourse).where(
        ProfessorCourse.professor_id == professor.id,
        ProfessorCourse.course_id == course_id,
    )
    course_access = await session.execute(course_access_query)
    if not course_access.scalar_one_or_none():
        raise HTTPException(
            status_code=403, detail="You don't have access to this course"
        )

    # Get enrolled students
    students_query = (
        select(SchoolStudent, CourseEnrollment)
        .join(CourseEnrollment, CourseEnrollment.student_id == SchoolStudent.id)
        .where(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.status.in_(["enrolled", "completed"]),
        )
    )
    students_result = await session.execute(students_query)
    students_data = students_result.all()

    students = []
    for student, enrollment in students_data:
        students.append(
            {
                "id": student.id,
                "name": f"Student {student.student_id}",  # In a real app, you'd get this from User
                "enrollment_date": enrollment.enrollment_date.strftime("%Y-%m-%d"),
                "status": enrollment.status,
                "grade": enrollment.grade,
                "attendance": enrollment.attendance_percentage,
            }
        )

    return {"students": students}


@router.get("/courses/{course_id}/assignments")
async def get_course_assignments(
    course_id: int,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get assignments for a specific course"""
    professor: Optional[SchoolProfessor] = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Check if professor teaches this course
    course_access_query = select(ProfessorCourse).where(
        ProfessorCourse.professor_id == professor.id,
        ProfessorCourse.course_id == course_id,
    )
    course_access = await session.execute(course_access_query)
    if not course_access.scalar_one_or_none():
        raise HTTPException(
            status_code=403, detail="You don't have access to this course"
        )

    # Get assignments
    assignments_query = (
        select(Assignment)
        .where(Assignment.course_id == course_id)
        .order_by(Assignment.due_date)
    )
    assignments_result = await session.execute(assignments_query)
    assignments_data = assignments_result.scalars().all()

    assignments = []
    for assignment in assignments_data:
        # Get count of submissions and graded submissions
        submissions_query = select(
            func.count(AssignmentSubmission.id).label("total"),
            func.count(AssignmentSubmission.graded_at).label("graded"),
        ).where(AssignmentSubmission.assignment_id == assignment.id)
        submissions_result = await session.execute(submissions_query)
        submission_counts = submissions_result.one()

        assignments.append(
            {
                "id": assignment.id,
                "title": assignment.title,
                "type": assignment.assignment_type,
                "due_date": assignment.due_date.strftime("%Y-%m-%d"),
                "points": assignment.points_possible,
                "submissions": submission_counts.total,
                "graded": submission_counts.graded,
                "is_published": assignment.is_published,
            }
        )

    return {"assignments": assignments}


@router.get("/courses/{course_id}/schedule")
async def get_course_schedule(
    course_id: int,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get schedule for a specific course"""
    professor: Optional[SchoolProfessor] = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Check if professor teaches this course
    course_access_query = select(ProfessorCourse).where(
        ProfessorCourse.professor_id == professor.id,
        ProfessorCourse.course_id == course_id,
    )
    course_access = await session.execute(course_access_query)
    if not course_access.scalar_one_or_none():
        raise HTTPException(
            status_code=403, detail="You don't have access to this course"
        )

    # Get course schedule
    schedule_query = (
        select(ClassSchedule)
        .where(ClassSchedule.course_id == course_id, ClassSchedule.is_active)
        .order_by(ClassSchedule.day_of_week, ClassSchedule.start_time)
    )
    schedule_result = await session.execute(schedule_query)
    schedule_data = schedule_result.scalars().all()

    days_of_week = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ]
    schedule = []

    for class_time in schedule_data:
        schedule.append(
            {
                "id": class_time.id,
                "day": days_of_week[class_time.day_of_week],
                "start_time": class_time.start_time,
                "end_time": class_time.end_time,
                "room": class_time.room,
                "recurring": class_time.recurrence_pattern == "weekly",
                "is_cancelled": class_time.is_cancelled,
            }
        )

    return {"schedule": schedule}


class CourseMaterialBase(BaseModel):
    title: str
    description: str
    material_type: str
    content: Dict[str, Any] = {}
    unit: Optional[str] = None
    sequence: Optional[int] = None
    tags: List[str] = []
    visibility: str = "students"
    requires_completion: bool = False


class CourseCreate(BaseModel):
    """Request model for creating a new course"""

    title: str
    code: str
    description: str
    academic_year: str
    education_level: str
    academic_track: Optional[str] = None
    credits: Optional[float] = None
    department_id: Optional[int] = None

    # Course structure
    syllabus: Optional[Dict[str, Any]] = None
    learning_objectives: Optional[List[str]] = []
    prerequisites: Optional[List[str]] = []

    # AI integration
    ai_tutoring_enabled: bool = True
    ai_tutoring_config: Optional[Dict[str, Any]] = None
    suggested_topics: Optional[List[str]] = []

    # Course materials
    required_materials: Optional[Dict[str, Any]] = None
    supplementary_resources: Optional[Dict[str, Any]] = None

    # Assessment configuration
    grading_schema: Optional[Dict[str, Any]] = None
    assessment_types: Optional[List[str]] = []

    # Collaboration settings
    allow_group_work: bool = True
    peer_review_enabled: bool = False
    discussion_enabled: bool = True

    # Status and schedule
    status: str = "draft"  # draft, active, archived
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class CourseMaterialCreate(CourseMaterialBase):
    pass


class CourseMaterialUpdate(CourseMaterialBase):
    pass


class CourseMaterialDetail(BaseModel):
    """Response model for course material details"""

    id: int
    title: str
    description: str
    material_type: str
    content: Dict[str, Any]
    course_id: int
    professor_id: int
    unit: Optional[str] = None
    sequence: Optional[int] = None
    tags: List[str]
    visibility: str
    requires_completion: bool
    ai_enhanced: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    # File properties if a file is attached
    file_id: Optional[int] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    content_type: Optional[str] = None
    thumbnail_url: Optional[str] = None


class CourseMaterialListResponse(BaseModel):
    """Response model for listing course materials"""

    materials: List[CourseMaterialDetail]
    total: int
    page: Optional[int] = 1
    limit: Optional[int] = 20


class EnhancementOptions(BaseModel):
    """Request model for AI enhancement options"""

    improve_content: bool = False
    generate_questions: bool = False
    create_summary: bool = False


class LessonPlanBase(BaseModel):
    title: str
    description: str
    objectives: List[str] = []
    content: Dict[str, Any] = {}
    resources: Dict[str, Any] = {}
    duration_minutes: int


class LessonPlan(LessonPlanBase):
    id: int
    teacher_id: int
    course_id: int
    status: str = "draft"
    ai_enhanced: bool = False
    created_at: datetime
    updated_at: Optional[datetime]


class LessonPlansResponse(BaseModel):
    lesson_plans: List[LessonPlan]
    total: int


class LessonPlanGenerateOptions(BaseModel):
    course_id: int
    topic: str
    duration_minutes: int
    learning_objectives: Optional[List[str]] = None
    include_activities: bool = False
    include_resources: bool = False


class LessonPlanDetail(BaseModel):
    id: int
    title: str
    description: str
    objectives: List[str]
    content: dict
    resources: dict
    duration_minutes: int
    created_at: datetime
    updated_at: Optional[datetime] = None


class MaterialsResponse(BaseModel):
    """Response model for listing course materials"""

    materials: List[CourseMaterialDetail]
    total: int
    page: Optional[int] = 1
    limit: Optional[int] = 20


@router.get("/materials", response_model=MaterialsResponse)
async def get_professor_materials(
    course_id: Optional[int] = Query(None, description="Filter by course ID"),
    material_type: Optional[str] = Query(None, description="Filter by material type"),
    search_term: Optional[str] = Query(
        None, description="Search term for title or description"
    ),
    visibility: Optional[str] = Query(None, description="Filter by visibility"),
    ai_enhanced: Optional[bool] = Query(
        None, description="Filter by AI enhancement status"
    ),
    page: int = Query(1, description="Page number"),
    limit: int = Query(20, description="Items per page"),
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get teaching materials for a professor"""
    professor: Optional[SchoolProfessor] = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Build the query with filters
    query = select(CourseMaterial).where(CourseMaterial.professor_id == professor.id)

    if course_id:
        query = query.where(CourseMaterial.course_id == course_id)

    if material_type:
        query = query.where(CourseMaterial.material_type == material_type)

    if search_term:
        search_filter = or_(
            CourseMaterial.title.ilike(f"%{search_term}%"),
            CourseMaterial.description.ilike(f"%{search_term}%"),
        )
        query = query.where(search_filter)

    if visibility:
        query = query.where(CourseMaterial.visibility == visibility)

    if ai_enhanced is not None:
        query = query.where(CourseMaterial.ai_enhanced == ai_enhanced)

    # Count total results
    count_query = select(func.count()).select_from(query.subquery())
    total = await session.execute(count_query)
    total = total.scalar() or 0

    # Apply pagination
    query = query.order_by(CourseMaterial.updated_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)

    # Execute query
    result = await session.execute(query)
    materials = result.scalars().all()

    return MaterialsResponse(materials=materials, total=total)


@router.get("/materials/{material_id}", response_model=CourseMaterialDetail)
async def get_professor_material(
    material_id: int,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get a specific material by ID"""
    professor = await session.execute(
        select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    material = await session.execute(
        select(CourseMaterial).where(
            CourseMaterial.id == material_id,
            CourseMaterial.professor_id == professor.id,
        )
    ).scalar_one_or_none()

    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    return material


@router.post("/materials", response_model=CourseMaterialDetail)
async def create_course_material(
    material: CourseMaterialCreate,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Create a new course material"""
    professor = await session.execute(
        select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Verify course access
    course_access = await session.execute(
        select(ProfessorCourse).where(
            ProfessorCourse.professor_id == professor.id,
            ProfessorCourse.course_id == material.course_id,
        )
    ).scalar_one_or_none()

    if not course_access:
        raise HTTPException(
            status_code=403, detail="You don't have access to this course"
        )

    # Create the new material
    new_material = CourseMaterial(
        professor_id=professor.id, created_at=datetime.utcnow(), **material.dict()
    )

    session.add(new_material)
    await session.commit()
    await session.refresh(new_material)

    return new_material


@router.put("/materials/{material_id}", response_model=CourseMaterialDetail)
async def update_course_material(
    material_id: int,
    material_update: CourseMaterialUpdate,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Update an existing course material"""
    professor = await session.execute(
        select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Get the existing material and check ownership
    existing_material = await session.execute(
        select(CourseMaterial).where(
            CourseMaterial.id == material_id,
            CourseMaterial.professor_id == professor.id,
        )
    ).scalar_one_or_none()

    if not existing_material:
        raise HTTPException(
            status_code=404, detail="Material not found or access denied"
        )

    # Update fields from the request
    update_data = material_update.dict(exclude_unset=True)

    # If course_id is being changed, verify access to the new course
    if (
        "course_id" in update_data
        and update_data["course_id"] != existing_material.course_id
    ):
        course_access = await session.execute(
            select(ProfessorCourse).where(
                ProfessorCourse.professor_id == professor.id,
                ProfessorCourse.course_id == update_data["course_id"],
            )
        ).scalar_one_or_none()

        if not course_access:
            raise HTTPException(
                status_code=403, detail="You don't have access to the target course"
            )

    # Apply updates and set updated_at timestamp
    for field, value in update_data.items():
        setattr(existing_material, field, value)

    existing_material.updated_at = datetime.utcnow()

    session.add(existing_material)
    await session.commit()
    await session.refresh(existing_material)

    return existing_material


@router.delete("/materials/{material_id}", response_model=dict)
async def delete_course_material(
    material_id: int,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Delete a course material"""
    professor = await session.execute(
        select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Get the material and verify ownership
    material = await session.execute(
        select(CourseMaterial).where(
            CourseMaterial.id == material_id,
            CourseMaterial.professor_id == professor.id,
        )
    ).scalar_one_or_none()

    if not material:
        raise HTTPException(
            status_code=404, detail="Material not found or access denied"
        )

    # Delete the material
    await session.delete(material)
    await session.commit()

    return {"success": True, "message": "Material deleted successfully"}


@router.post(
    "/materials/{material_id}/attach-file", response_model=CourseMaterialDetail
)
async def attach_file_to_material(
    material_id: int,
    file_data: AttachFileRequest,
    current_user=Depends(get_current_user),
    session=Depends(get_session),
):
    """Attach a file to a course material"""
    professor = await session.execute(
        select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Get the material and verify ownership
    material = await session.execute(
        select(CourseMaterial).where(
            CourseMaterial.id == material_id,
            CourseMaterial.professor_id == professor.id,
        )
    ).scalar_one_or_none()

    if not material:
        raise HTTPException(
            status_code=404, detail="Material not found or access denied"
        )

    # Verify file exists and user has access
    file = await session.execute(
        select(UserFile).where(
            UserFile.id == file_data.file_id,
            not UserFile.is_deleted,
            or_(
                UserFile.user_id == current_user.id,
                UserFile.is_public,
                UserFile.sharing_level != "private",
            ),
        )
    ).scalar_one_or_none()

    if not file:
        raise HTTPException(status_code=404, detail="File not found or access denied")

    # Handle existing file if needed
    if material.file_id and file_data.replace_existing:
        # Mark old file as replaced in metadata
        old_file = await session.execute(
            select(UserFile).where(UserFile.id == material.file_id)
        ).scalar_one_or_none()

        if old_file:
            old_file.file_metadata = {
                **old_file.file_metadata,
                "replaced_at": datetime.utcnow().isoformat(),
                "replaced_by": file_data.file_id,
                "replacement_reason": "user_replaced",
            }
            session.add(old_file)

    # Update material with new file ID
    material.file_id = file_data.file_id
    material.updated_at = datetime.utcnow()

    # Update file with reference to this material
    file.reference_id = str(material_id)
    file.file_metadata = {
        **file.file_metadata,
        "material_id": material_id,
        "course_id": material.course_id,
        "material_type": material.material_type,
    }

    # If not already set, set file sharing based on material visibility
    if file.sharing_level == "private":
        if material.visibility == "public":
            file.sharing_level = "public"
            file.is_public = True
        elif material.visibility == "professors":
            file.sharing_level = "department"
        else:
            file.sharing_level = "course"

    session.add(material)
    session.add(file)
    await session.commit()
    await session.refresh(material)

    # Prepare response with file details
    response_dict = {
        **material.dict(),
        "file_url": file.file_url,
        "file_name": file.file_name,
        "file_size": file.file_size,
        "content_type": file.file_type,
    }

    return response_dict


# Lesson Plans endpoints


@router.get("/lesson-plans", response_model=LessonPlansResponse)
async def get_professor_lesson_plans(
    course_id: Optional[int] = Query(None, description="Filter by course ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    search_term: Optional[str] = Query(
        None, description="Search term for title or description"
    ),
    page: int = Query(1, description="Page number"),
    limit: int = Query(20, description="Items per page"),
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get lesson plans for a professor"""
    professor: Optional[SchoolProfessor] = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Build the query with filters
    query = select(LessonPlan).where(LessonPlan.teacher_id == professor.id)

    if course_id:
        query = query.where(LessonPlan.course_id == course_id)

    if status:
        query = query.where(LessonPlan.status == status)

    if search_term:
        search_filter = or_(
            LessonPlan.title.ilike(f"%{search_term}%"),
            LessonPlan.description.ilike(f"%{search_term}%"),
        )
        query = query.where(search_filter)

    # Count total results
    count_query = select(func.count()).select_from(query.subquery())
    total = await session.execute(count_query)
    total = total.scalar() or 0

    # Apply pagination and order by date
    query = query.order_by(LessonPlan.updated_at.desc())
    query = query.offset((page - 1) * limit).limit(limit)

    # Execute query
    result = await session.execute(query)
    lesson_plans = result.scalars().all()

    return LessonPlansResponse(lesson_plans=lesson_plans, total=total)


@router.post("/lesson-plans/generate", response_model=LessonPlanDetail)
async def generate_lesson_plan(
    options: LessonPlanGenerateOptions,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Generate a lesson plan with AI"""
    professor = await session.execute(
        select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Verify course access
    course_access = await session.execute(
        select(ProfessorCourse).where(
            ProfessorCourse.professor_id == professor.id,
            ProfessorCourse.course_id == options.course_id,
        )
    ).scalar_one_or_none()

    if not course_access:
        raise HTTPException(
            status_code=403, detail="You don't have access to this course"
        )

    # Here you would typically call your AI service to generate the lesson plan
    # For now, we'll create a sample one

    # Generate sample objectives if none provided
    objectives = options.learning_objectives or [
        f"Understand the basics of {options.topic}",
        f"Apply {options.topic} concepts to solve problems",
        f"Analyze and evaluate {options.topic} scenarios",
    ]

    # Create the new lesson plan
    new_lesson_plan = LessonPlan(
        teacher_id=professor.id,
        course_id=options.course_id,
        title=f"Lesson on {options.topic}",
        description=f"AI-generated lesson plan about {options.topic}",
        objectives=objectives,
        duration_minutes=options.duration_minutes,
        status="draft",
        ai_enhanced=True,
        content={
            "notes": f"This is an AI-generated lesson about {options.topic}.",
            "activities": ["Activity 1", "Activity 2"]
            if options.include_activities
            else [],
        },
        resources={
            "references": ["Reference 1", "Reference 2"]
            if options.include_resources
            else [],
            "links": [],
        },
        created_at=datetime.utcnow(),
    )

    session.add(new_lesson_plan)
    await session.commit()
    await session.refresh(new_lesson_plan)

    return new_lesson_plan


@router.post("/courses", response_model=CourseItem)
async def create_professor_course(
    course_data: CourseCreate,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Create a new course for a professor"""
    professor: Optional[SchoolProfessor] = (
        await session.execute(
            select(SchoolProfessor).where(SchoolProfessor.user_id == current_user.id)
        )
    ).scalar_one_or_none()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor profile not found")

    # Validate department access if specified
    if course_data.department_id:
        # Check if professor has access to this department
        dept_access = await session.execute(
            select(DepartmentStaffAssignment).where(
                DepartmentStaffAssignment.staff_id == professor.id,
                DepartmentStaffAssignment.department_id == course_data.department_id,
            )
        ).scalar_one_or_none()

        if not dept_access:
            raise HTTPException(
                status_code=403, detail="You don't have access to this department"
            )

    # Create new course
    new_course = SchoolCourse(
        title=course_data.title,
        code=course_data.code,
        description=course_data.description,
        academic_year=course_data.academic_year,
        education_level=course_data.education_level,
        academic_track=course_data.academic_track,
        credits=course_data.credits,
        syllabus=course_data.syllabus or {},
        learning_objectives=course_data.learning_objectives or [],
        prerequisites=course_data.prerequisites or [],
        ai_tutoring_enabled=course_data.ai_tutoring_enabled,
        ai_tutoring_config=course_data.ai_tutoring_config or {},
        suggested_topics=course_data.suggested_topics or [],
        required_materials=course_data.required_materials or {},
        supplementary_resources=course_data.supplementary_resources or {},
        grading_schema=course_data.grading_schema or {},
        assessment_types=course_data.assessment_types or [],
        allow_group_work=course_data.allow_group_work,
        peer_review_enabled=course_data.peer_review_enabled,
        discussion_enabled=course_data.discussion_enabled,
        status=course_data.status,
        school_id=professor.school_id,
        department_id=course_data.department_id,
        start_date=course_data.start_date,
        end_date=course_data.end_date,
        created_at=datetime.utcnow(),
    )

    session.add(new_course)
    await session.commit()
    await session.refresh(new_course)

    # Create professor-course relationship
    professor_course = ProfessorCourse(
        professor_id=professor.id,
        course_id=new_course.id,
        role="primary",  # Set as primary instructor
        responsibilities=["content", "grading", "teaching"],
        academic_year=course_data.academic_year,
        start_date=course_data.start_date or datetime.utcnow(),
        end_date=course_data.end_date,
        status="active",
        created_at=datetime.utcnow(),
    )

    session.add(professor_course)
    await session.commit()

    # Calculate any derived fields for response
    topics = []
    if new_course.syllabus and "topics" in new_course.syllabus:
        topics = new_course.syllabus["topics"]

    # Format response using CourseItem model
    return CourseItem(
        id=new_course.id,
        title=new_course.title,
        code=new_course.code,
        description=new_course.description,
        students=0,  # New course has no enrollments yet
        nextClass=None,  # No scheduled classes yet
        progress=0,  # No progress yet
        topics=topics,
        aiGenerated=new_course.ai_tutoring_enabled,
        status=new_course.status,
    )
