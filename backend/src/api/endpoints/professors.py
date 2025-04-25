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
from ...db.models.professor import SchoolProfessor, ProfessorCourse
from ...db.models.school import (
    SchoolCourse,
    ClassSchedule,
    Assignment,
    AssignmentSubmission,
    SchoolStudent,
    CourseEnrollment,
)
from ...db.models.communication import Message, Notification
from ...db.postgresql import get_session
from .auth import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

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
    courses = []
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

        courses.append(
            CourseItem(
                id=course.id,
                title=course.title,
                code=course.code,
                description=course.description,
                students=enrollment_count,
                nextClass=next_class.start_date.strftime("%A, %I:%M %p")
                if next_class
                else None,
                progress=progress,
                topics=topics,
                aiGenerated=course.ai_tutoring_enabled,
                status=course.status,
            )
        )

    return CourseResponse(courses=courses)


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
