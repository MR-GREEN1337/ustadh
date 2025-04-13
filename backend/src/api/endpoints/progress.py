from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlmodel import Session, select
from sqlalchemy.orm import joinedload

from src.db import get_session
from src.api.models.progress import (
    EnrollmentCreate,
    EnrollmentRead,
    EnrollmentUpdate,
    ActivityCreate,
    ActivityRead,
    ActivityUpdate,
    ProgressSummary,
    SubjectProgress,
    ActivitySummary,
)
from src.db.models.progress import Enrollment, Activity
from src.db.models.content import Subject, Lesson, Topic
from src.db.models.user import User, Guardian
from src.api.endpoints.auth import get_current_active_user
from src.api.dependencies import get_authorized_student
from src.utils.progress_helpers import calculate_streak
from sqlalchemy.ext.asyncio import AsyncSession

from typing import Dict, Any
from src.db.models.progress import Achievement
from src.db.models.school import CourseEnrollment, SchoolStudent
from loguru import logger

router = APIRouter(prefix="/progress", tags=["progress"])


# Enrollment endpoints
@router.post(
    "/enroll", response_model=EnrollmentRead, status_code=status.HTTP_201_CREATED
)
async def create_enrollment(
    enrollment: EnrollmentCreate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """
    Enroll a user in a subject.

    Users can enroll themselves or guardians can enroll their students if they have edit permissions.
    """
    # Verify the subject exists
    subject = session.get(Subject, enrollment.subject_id)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found"
        )

    # Check if current user is enrolling themselves or if they're authorized to enroll someone else
    is_authorized = False

    if enrollment.user_id == current_user.id:
        is_authorized = True
    elif current_user.user_type == "admin":
        is_authorized = True
    elif current_user.user_type in ["parent", "teacher"]:
        # Check if there's a guardian relationship
        guardian = session.exec(
            select(Guardian)
            .where(Guardian.parent_id == current_user.id)
            .where(Guardian.student_id == enrollment.user_id)
            .where(Guardian.can_edit == True)  # noqa: E712
        ).first()

        if guardian:
            is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to enroll this user",
        )

    # Check if the enrollment already exists
    existing_enrollment = session.exec(
        select(Enrollment)
        .where(Enrollment.user_id == enrollment.user_id)
        .where(Enrollment.subject_id == enrollment.subject_id)
    ).first()

    if existing_enrollment:
        # If enrollment exists but is not active, reactivate it
        if not existing_enrollment.active:
            existing_enrollment.active = True
            existing_enrollment.updated_at = datetime.utcnow()
            session.add(existing_enrollment)
            session.commit()
            session.refresh(existing_enrollment)
            return existing_enrollment
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already enrolled in this subject",
            )

    # Create new enrollment
    db_enrollment = Enrollment(
        user_id=enrollment.user_id,
        subject_id=enrollment.subject_id,
        progress_data={},  # Initialize empty progress data
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    session.add(db_enrollment)
    session.commit()
    session.refresh(db_enrollment)

    return db_enrollment


@router.get("/own", response_model=ProgressSummary)
async def get_own_progress(
    time_period: str = Query(
        "week", description="Time period for stats: day, week, month, all"
    ),
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """
    Get the current user's own progress summary.
    This is a convenience endpoint that redirects to the summary endpoint.
    """
    return await get_progress_summary(
        time_period=time_period, current_user=current_user, session=session
    )


@router.get("/enrollments", response_model=List[EnrollmentRead])
async def get_enrollments(
    active_only: bool = Query(True, description="Only return active enrollments"),
    include_subject_details: bool = Query(False, description="Include subject details"),
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """
    Get all enrollments for the current user with optional subject details.
    """
    if include_subject_details:
        query = (
            select(Enrollment)
            .options(joinedload(Enrollment.subject))
            .where(Enrollment.user_id == current_user.id)
        )
    else:
        query = select(Enrollment).where(Enrollment.user_id == current_user.id)

    if active_only:
        query = query.where(Enrollment.active == True)  # noqa: E712

    enrollments = session.exec(query).all()
    return enrollments


@router.get("/enrollments/{student_id}", response_model=List[EnrollmentRead])
async def get_student_enrollments(
    student_id: int = Depends(get_authorized_student),
    active_only: bool = Query(True, description="Only return active enrollments"),
    include_subject_details: bool = Query(False, description="Include subject details"),
    session: Session = Depends(get_session),
):
    """
    Get all enrollments for a specific student (for parents and supervisors).

    Authorization is handled by the get_authorized_student dependency.
    """
    if include_subject_details:
        query = (
            select(Enrollment)
            .options(joinedload(Enrollment.subject))
            .where(Enrollment.user_id == student_id)
        )
    else:
        query = select(Enrollment).where(Enrollment.user_id == student_id)

    if active_only:
        query = query.where(Enrollment.active == True)  # noqa: E712

    enrollments = session.exec(query).all()
    return enrollments


@router.patch("/enrollments/{enrollment_id}", response_model=EnrollmentRead)
async def update_enrollment(
    enrollment_id: int,
    enrollment_update: EnrollmentUpdate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """
    Update an enrollment's status or progress data.

    Users can update their own enrollments, or guardians can update for students
    if they have edit permissions.
    """
    # Get the enrollment with the subject
    enrollment = session.exec(
        select(Enrollment)
        .options(joinedload(Enrollment.subject))
        .where(Enrollment.id == enrollment_id)
    ).first()

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found"
        )

    # Check if current user is authorized to update the enrollment
    is_authorized = False

    if enrollment.user_id == current_user.id:
        is_authorized = True
    elif current_user.user_type == "admin":
        is_authorized = True
    elif current_user.user_type in ["parent", "teacher"]:
        # Check if there's a guardian relationship
        guardian = session.exec(
            select(Guardian)
            .where(Guardian.parent_id == current_user.id)
            .where(Guardian.student_id == enrollment.user_id)
            .where(Guardian.can_edit == True)  # noqa: E712
        ).first()

        if guardian:
            is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this enrollment",
        )

    # Update enrollment
    for key, value in enrollment_update.dict(exclude_unset=True).items():
        if value is not None:
            if key == "progress_data" and enrollment.progress_data:
                # Merge progress data dictionaries
                enrollment.progress_data.update(value)
            else:
                setattr(enrollment, key, value)

    # Update the timestamp
    enrollment.updated_at = datetime.utcnow()

    session.add(enrollment)
    session.commit()
    session.refresh(enrollment)

    return enrollment


# Activity endpoints
@router.post(
    "/activities", response_model=ActivityRead, status_code=status.HTTP_201_CREATED
)
async def create_activity(
    activity: ActivityCreate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """
    Create a new learning activity.

    Users can create activities for themselves. The activity can be linked
    to a specific lesson if provided.
    """
    # Verify the lesson exists if provided
    if activity.lesson_id:
        lesson = session.get(Lesson, activity.lesson_id)
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found"
            )

    # Check if current user is creating an activity for themselves or if they're authorized
    is_authorized = False

    if activity.user_id == current_user.id:
        is_authorized = True
    elif current_user.user_type == "admin":
        is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create activity for this user",
        )

    # Ensure start_time is set
    start_time = activity.start_time or datetime.utcnow()

    # Create new activity
    db_activity = Activity(
        user_id=activity.user_id,
        lesson_id=activity.lesson_id,
        type=activity.type,
        status=activity.status or "in_progress",
        data=activity.data or {},
        results=activity.results or {},
        start_time=start_time,
        end_time=activity.end_time,
        duration_seconds=activity.duration_seconds,
    )

    session.add(db_activity)
    session.commit()
    session.refresh(db_activity)

    return db_activity


@router.get("/activities", response_model=List[ActivityRead])
async def get_activities(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    lesson_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    activity_type: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """
    Get learning activities for the current user with various filtering options.
    """
    query = select(Activity).where(Activity.user_id == current_user.id)

    # Apply filters
    if lesson_id:
        query = query.where(Activity.lesson_id == lesson_id)
    if activity_type:
        query = query.where(Activity.type == activity_type)
    if status:
        query = query.where(Activity.status == status)
    if start_date:
        query = query.where(Activity.start_time >= start_date)
    if end_date:
        query = query.where(Activity.start_time <= end_date)

    # Filter by subject if provided
    if subject_id:
        # Find all lessons in the subject
        topic_query = select(Topic.id).where(Topic.subject_id == subject_id)
        topic_ids = [topic.id for topic in session.exec(topic_query).all()]

        if topic_ids:
            lesson_query = select(Lesson.id).where(Lesson.topic_id.in_(topic_ids))
            lesson_ids = [lesson.id for lesson in session.exec(lesson_query).all()]

            if lesson_ids:
                query = query.where(Activity.lesson_id.in_(lesson_ids))
            else:
                # No lessons found, return empty list
                return []
        else:
            # No topics found, return empty list
            return []

    # Apply sorting and pagination
    query = query.order_by(Activity.start_time.desc()).offset(offset).limit(limit)

    # Execute query
    activities = session.exec(query).all()

    return activities


@router.get("/student/{student_id}/activities", response_model=List[ActivityRead])
async def get_student_activities(
    student_id: int = Depends(get_authorized_student),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    activity_type: Optional[str] = None,
    subject_id: Optional[int] = None,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    session: Session = Depends(get_session),
):
    """
    Get learning activities for a specific student (for parents and supervisors).

    Authorization is handled by the get_authorized_student dependency.
    """
    # Build query
    query = select(Activity).where(Activity.user_id == student_id)

    # Apply filters
    if activity_type:
        query = query.where(Activity.type == activity_type)
    if status:
        query = query.where(Activity.status == status)
    if start_date:
        query = query.where(Activity.start_time >= start_date)
    if end_date:
        query = query.where(Activity.start_time <= end_date)

    # Filter by subject if provided
    if subject_id:
        # Find all lessons in the subject
        topic_query = select(Topic.id).where(Topic.subject_id == subject_id)
        topic_ids = [topic.id for topic in session.exec(topic_query).all()]

        if topic_ids:
            lesson_query = select(Lesson.id).where(Lesson.topic_id.in_(topic_ids))
            lesson_ids = [lesson.id for lesson in session.exec(lesson_query).all()]

            if lesson_ids:
                query = query.where(Activity.lesson_id.in_(lesson_ids))
            else:
                # No lessons found, return empty list
                return []
        else:
            # No topics found, return empty list
            return []

    # Apply sorting and pagination
    query = query.order_by(Activity.start_time.desc()).offset(offset).limit(limit)

    # Execute query
    activities = session.exec(query).all()

    return activities


@router.patch("/activities/{activity_id}", response_model=ActivityRead)
async def update_activity(
    activity_id: int,
    activity_update: ActivityUpdate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """
    Update a learning activity with progress, results, or status changes.
    """
    # Get the activity
    activity = session.get(Activity, activity_id)
    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found"
        )

    # Check if current user is authorized to update the activity
    is_authorized = False

    if activity.user_id == current_user.id:
        is_authorized = True
    elif current_user.user_type == "admin":
        is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this activity",
        )

    # Handle completion of activity
    if activity_update.status == "completed" and activity.status != "completed":
        activity_update.end_time = activity_update.end_time or datetime.utcnow()

        # Calculate duration if not provided
        if (
            not activity_update.duration_seconds
            and activity_update.end_time
            and activity.start_time
        ):
            delta = activity_update.end_time - activity.start_time
            activity_update.duration_seconds = int(delta.total_seconds())

        # If this is a quiz completion, update the enrollment progress
        if activity.lesson_id and (
            activity.type == "quiz" or activity.type == "assessment"
        ):
            lesson = session.get(Lesson, activity.lesson_id)
            if lesson and lesson.topic_id:
                topic = session.get(Topic, lesson.topic_id)
                if topic and topic.subject_id:
                    # Update the enrollment progress
                    enrollment = session.exec(
                        select(Enrollment)
                        .where(Enrollment.user_id == activity.user_id)
                        .where(Enrollment.subject_id == topic.subject_id)
                        .where(Enrollment.active == True)  # noqa: E712
                    ).first()

                    if enrollment:
                        # Update lesson completion in progress data
                        if "completed_lessons" not in enrollment.progress_data:
                            enrollment.progress_data["completed_lessons"] = []

                        if (
                            str(lesson.id)
                            not in enrollment.progress_data["completed_lessons"]
                        ):
                            enrollment.progress_data["completed_lessons"].append(
                                str(lesson.id)
                            )

                        # Update the timestamp
                        enrollment.updated_at = datetime.utcnow()

                        # Save enrollment changes
                        session.add(enrollment)

    # Update activity
    for key, value in activity_update.dict(exclude_unset=True).items():
        if value is not None:
            if key == "data" and activity.data:
                # Merge data dictionaries
                activity.data.update(value)
            elif key == "results" and activity.results:
                # Merge results dictionaries
                activity.results.update(value)
            else:
                setattr(activity, key, value)

    session.add(activity)
    session.commit()
    session.refresh(activity)

    return activity


# Stats and analytics endpoints
@router.get("/stats/subjects/{subject_id}")
async def get_subject_stats(
    subject_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """
    Get detailed statistics for a specific subject enrollment.
    """
    # Get the enrollment
    enrollment = session.exec(
        select(Enrollment)
        .where(Enrollment.user_id == current_user.id)
        .where(Enrollment.subject_id == subject_id)
        .where(Enrollment.active == True)  # noqa: E712
    ).first()

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active enrollment found for this subject",
        )

    # Get the subject with topics and lessons
    subject = session.exec(
        select(Subject)
        .options(joinedload(Subject.topics).joinedload(Topic.lessons))
        .where(Subject.id == subject_id)
    ).first()

    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found",
        )

    # Collect all lesson IDs for this subject
    lesson_ids = []
    topic_stats = []

    for topic in subject.topics:
        lesson_ids_in_topic = [lesson.id for lesson in topic.lessons]
        lesson_ids.extend(lesson_ids_in_topic)

        # Get activities for each topic
        topic_activities = session.exec(
            select(Activity)
            .where(Activity.user_id == current_user.id)
            .where(Activity.lesson_id.in_(lesson_ids_in_topic))
        ).all()

        # Calculate topic stats
        topic_total = len(topic_activities)
        topic_completed = sum(1 for a in topic_activities if a.status == "completed")
        topic_completion_rate = (
            (topic_completed / topic_total) * 100 if topic_total > 0 else 0
        )
        topic_time_spent = sum(a.duration_seconds or 0 for a in topic_activities)

        topic_stats.append(
            {
                "topic_id": topic.id,
                "topic_name": topic.name,
                "total_activities": topic_total,
                "completed_activities": topic_completed,
                "completion_rate": topic_completion_rate,
                "time_spent_seconds": topic_time_spent,
                "time_spent_hours": round(topic_time_spent / 3600, 1),
            }
        )

    # Get all activities for this subject
    activities = session.exec(
        select(Activity)
        .where(Activity.user_id == current_user.id)
        .where(Activity.lesson_id.in_(lesson_ids))
    ).all()

    # Calculate overall stats
    total_activities = len(activities)
    completed_activities = sum(1 for a in activities if a.status == "completed")
    completion_rate = (
        (completed_activities / total_activities) * 100 if total_activities > 0 else 0
    )
    total_time_spent = sum(a.duration_seconds or 0 for a in activities)

    # Get quiz results
    quiz_activities = [
        a for a in activities if a.type == "quiz" and a.status == "completed"
    ]
    quiz_scores = []

    for activity in quiz_activities:
        if activity.results and "score" in activity.results:
            try:
                score = float(activity.results["score"])
                quiz_scores.append(score)
            except (ValueError, TypeError):
                pass

    avg_quiz_score = sum(quiz_scores) / len(quiz_scores) if quiz_scores else 0

    # Get recent activities
    recent_activities = session.exec(
        select(Activity)
        .where(Activity.user_id == current_user.id)
        .where(Activity.lesson_id.in_(lesson_ids))
        .order_by(Activity.start_time.desc())
        .limit(5)
    ).all()

    return {
        "subject_id": subject_id,
        "subject_name": subject.name,
        "enrollment_id": enrollment.id,
        "enrollment_date": enrollment.created_at,
        "total_activities": total_activities,
        "completed_activities": completed_activities,
        "completion_rate": completion_rate,
        "total_time_spent_seconds": total_time_spent,
        "total_time_spent_hours": round(total_time_spent / 3600, 1),
        "average_quiz_score": avg_quiz_score,
        "topics": topic_stats,
        "recent_activities": [
            {
                "id": a.id,
                "type": a.type,
                "status": a.status,
                "start_time": a.start_time,
                "end_time": a.end_time,
                "duration_seconds": a.duration_seconds,
                "lesson_id": a.lesson_id,
            }
            for a in recent_activities
        ],
    }


@router.get("/stats/student/{student_id}/subject/{subject_id}")
async def get_student_subject_stats(
    student_id: int = Depends(get_authorized_student),
    subject_id: int = Path(...),
    session: Session = Depends(get_session),
):
    """
    Get subject stats for a specific student (for parents and supervisors).

    Authorization is handled by the get_authorized_student dependency.
    """
    # Get the enrollment
    enrollment = session.exec(
        select(Enrollment)
        .where(Enrollment.user_id == student_id)
        .where(Enrollment.subject_id == subject_id)
        .where(Enrollment.active == True)  # noqa: E712
    ).first()

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active enrollment found for this subject",
        )

    # This endpoint reuses the same logic as get_subject_stats but for a different user
    # Get the subject with topics and lessons
    subject = session.exec(
        select(Subject)
        .options(joinedload(Subject.topics).joinedload(Topic.lessons))
        .where(Subject.id == subject_id)
    ).first()

    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found",
        )

    # Collect all lesson IDs for this subject
    lesson_ids = []
    topic_stats = []

    for topic in subject.topics:
        lesson_ids_in_topic = [lesson.id for lesson in topic.lessons]
        lesson_ids.extend(lesson_ids_in_topic)

        # Get activities for each topic
        topic_activities = session.exec(
            select(Activity)
            .where(Activity.user_id == student_id)
            .where(Activity.lesson_id.in_(lesson_ids_in_topic))
        ).all()

        # Calculate topic stats
        topic_total = len(topic_activities)
        topic_completed = sum(1 for a in topic_activities if a.status == "completed")
        topic_completion_rate = (
            (topic_completed / topic_total) * 100 if topic_total > 0 else 0
        )
        topic_time_spent = sum(a.duration_seconds or 0 for a in topic_activities)

        topic_stats.append(
            {
                "topic_id": topic.id,
                "topic_name": topic.name,
                "total_activities": topic_total,
                "completed_activities": topic_completed,
                "completion_rate": topic_completion_rate,
                "time_spent_seconds": topic_time_spent,
                "time_spent_hours": round(topic_time_spent / 3600, 1),
            }
        )

    # Get all activities for this subject
    activities = session.exec(
        select(Activity)
        .where(Activity.user_id == student_id)
        .where(Activity.lesson_id.in_(lesson_ids))
    ).all()

    # Calculate overall stats
    total_activities = len(activities)
    completed_activities = sum(1 for a in activities if a.status == "completed")
    completion_rate = (
        (completed_activities / total_activities) * 100 if total_activities > 0 else 0
    )
    total_time_spent = sum(a.duration_seconds or 0 for a in activities)

    # Get quiz results
    quiz_activities = [
        a for a in activities if a.type == "quiz" and a.status == "completed"
    ]
    quiz_scores = []

    for activity in quiz_activities:
        if activity.results and "score" in activity.results:
            try:
                score = float(activity.results["score"])
                quiz_scores.append(score)
            except (ValueError, TypeError):
                pass

    avg_quiz_score = sum(quiz_scores) / len(quiz_scores) if quiz_scores else 0

    # Get recent activities
    recent_activities = session.exec(
        select(Activity)
        .where(Activity.user_id == student_id)
        .where(Activity.lesson_id.in_(lesson_ids))
        .order_by(Activity.start_time.desc())
        .limit(5)
    ).all()

    # Get student info
    student = session.get(User, student_id)

    return {
        "student_id": student_id,
        "student_name": student.full_name if student else "Unknown",
        "subject_id": subject_id,
        "subject_name": subject.name,
        "enrollment_id": enrollment.id,
        "enrollment_date": enrollment.created_at,
        "total_activities": total_activities,
        "completed_activities": completed_activities,
        "completion_rate": completion_rate,
        "total_time_spent_seconds": total_time_spent,
        "total_time_spent_hours": round(total_time_spent / 3600, 1),
        "average_quiz_score": avg_quiz_score,
        "topics": topic_stats,
        "recent_activities": [
            {
                "id": a.id,
                "type": a.type,
                "status": a.status,
                "start_time": a.start_time,
                "end_time": a.end_time,
                "duration_seconds": a.duration_seconds,
                "lesson_id": a.lesson_id,
            }
            for a in recent_activities
        ],
    }


@router.get("/summary", response_model=ProgressSummary)
async def get_progress_summary(
    time_period: str = Query(
        "week", description="Time period for stats: day, week, month, all"
    ),
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get a comprehensive summary of learning progress for the current user.

    Includes streak information, subject progress, recent activities, and overall stats.
    """
    # Determine date range based on time period
    now = datetime.utcnow()

    if time_period == "day":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_period == "week":
        # Start from Monday of current week
        start_date = now - timedelta(days=now.weekday())
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_period == "month":
        # Start from 1st of current month
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:  # "all"
        start_date = None

    # Calculate streak
    streak_info = await calculate_streak(current_user.id, session)

    # Get all active enrollments with subject details
    query = (
        select(Enrollment)
        .options(joinedload(Enrollment.subject))
        .where(Enrollment.user_id == current_user.id)
        .where(Enrollment.active == True)  # noqa: E712
    )

    result = await session.execute(query)
    enrollments = result.scalars().all()

    subject_progress_list = []

    for enrollment in enrollments:
        subject = enrollment.subject

        # Get topics for this subject
        topics_query = select(Topic).where(Topic.subject_id == subject.id)
        topics_result = await session.execute(topics_query)
        topics = topics_result.scalars().all()

        # Get lessons for these topics
        topic_ids = [topic.id for topic in topics]
        lessons_query = select(Lesson).where(Lesson.topic_id.in_(topic_ids))
        lessons_result = await session.execute(lessons_query)
        lessons = lessons_result.scalars().all()

        # Total lessons in subject
        total_lessons = len(lessons)

        # Get completed lessons from progress data
        completed_lesson_ids = enrollment.progress_data.get("completed_lessons", [])
        completed_lessons = len(completed_lesson_ids)

        # Calculate completion percentage
        completion_percentage = (
            (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
        )

        # Get activities for this subject's lessons
        lesson_ids = [lesson.id for lesson in lessons]

        # Activity query with date filter if applicable
        activity_query = select(Activity).where(
            Activity.user_id == current_user.id, Activity.lesson_id.in_(lesson_ids)
        )

        if start_date:
            activity_query = activity_query.where(Activity.start_time >= start_date)

        activities_result = await session.execute(activity_query)
        activities = activities_result.scalars().all()

        # Calculate time spent on this subject in the specified period
        total_time_spent = sum(a.duration_seconds or 0 for a in activities)

        # Get the most recent activity for this subject
        recent_activity_query = (
            select(Activity)
            .where(Activity.user_id == current_user.id)
            .where(Activity.lesson_id.in_(lesson_ids))
            .order_by(Activity.start_time.desc())
            .limit(1)
        )
        recent_activity_result = await session.execute(recent_activity_query)
        recent_activity = recent_activity_result.scalar_one_or_none()

        # Create subject progress object
        subject_progress = SubjectProgress(
            subject_id=subject.id,
            subject_name=subject.name,
            total_lessons=total_lessons,
            completed_lessons=completed_lessons,
            completion_percentage=completion_percentage,
            time_spent_seconds=total_time_spent,
            last_activity_date=recent_activity.start_time if recent_activity else None,
        )

        subject_progress_list.append(subject_progress)

    # Get recent activities across all subjects
    activity_query = select(Activity).where(Activity.user_id == current_user.id)

    if start_date:
        activity_query = activity_query.where(Activity.start_time >= start_date)

    recent_activity_query = activity_query.order_by(Activity.start_time.desc()).limit(
        10
    )
    recent_activities_result = await session.execute(recent_activity_query)
    recent_activities = recent_activities_result.scalars().all()

    # Process activities for response
    activity_summaries = []
    for activity in recent_activities:
        # Get lesson and subject info
        lesson = None
        subject = None

        if activity.lesson_id:
            lesson = await session.get(Lesson, activity.lesson_id)
            if lesson and lesson.topic_id:
                topic = await session.get(Topic, lesson.topic_id)
                if topic and topic.subject_id:
                    subject = await session.get(Subject, topic.subject_id)

        activity_summary = ActivitySummary(
            id=activity.id,
            type=activity.type,
            title=lesson.title if lesson else "Unknown Lesson",
            subject=subject.name if subject else "Unknown Subject",
            start_time=activity.start_time,
            duration_seconds=activity.duration_seconds or 0,
            status=activity.status,
            score=activity.results.get("score") if activity.results else None,
        )

        activity_summaries.append(activity_summary)

    # Calculate overall stats for the time period
    all_activities_query = select(Activity).where(Activity.user_id == current_user.id)

    if start_date:
        all_activities_query = all_activities_query.where(
            Activity.start_time >= start_date
        )

    all_activities_result = await session.execute(all_activities_query)
    all_activities = all_activities_result.scalars().all()

    total_activities = len(all_activities)
    completed_activities = sum(1 for a in all_activities if a.status == "completed")
    total_time_spent = sum(a.duration_seconds or 0 for a in all_activities)

    # Get average scores
    scores = []
    for activity in all_activities:
        if (
            activity.type == "quiz"
            and activity.status == "completed"
            and activity.results
        ):
            if "score" in activity.results:
                try:
                    score = float(activity.results["score"])
                    scores.append(score)
                except (ValueError, TypeError):
                    continue

    average_score = sum(scores) / len(scores) if scores else 0

    # Build final response - use dictionary access instead of attribute access
    return ProgressSummary(
        streak_days=streak_info["current_streak"],
        streak_start_date=streak_info["streak_start_date"],
        study_time_hours=round(total_time_spent / 3600, 1),
        average_score=average_score,
        subjects=subject_progress_list,
        recent_activities=activity_summaries,
        total_activities=total_activities,
        completed_activities=completed_activities,
    )


@router.get("/student/{student_id}/summary", response_model=ProgressSummary)
async def get_student_progress_summary(
    student_id: int = Depends(get_authorized_student),
    time_period: str = Query(
        "week", description="Time period for stats: day, week, month, all"
    ),
    session: Session = Depends(get_session),
):
    """
    Get a comprehensive summary of learning progress for a specific student.

    For parents and guardians to monitor student progress.
    Authorization is handled by the get_authorized_student dependency.
    """
    # Determine date range based on time period
    now = datetime.utcnow()

    if time_period == "day":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_period == "week":
        # Start from Monday of current week
        start_date = now - timedelta(days=now.weekday())
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_period == "month":
        # Start from 1st of current month
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:  # "all"
        start_date = None

    # Calculate streak
    streak_info = calculate_streak(student_id, session)

    # Get all active enrollments with subject details
    enrollments = session.exec(
        select(Enrollment)
        .options(joinedload(Enrollment.subject))
        .where(Enrollment.user_id == student_id)
        .where(Enrollment.active == True)  # noqa: E712
    ).all()

    subject_progress_list = []

    for enrollment in enrollments:
        subject = enrollment.subject

        # Get topics for this subject
        topics = session.exec(select(Topic).where(Topic.subject_id == subject.id)).all()

        # Get lessons for these topics
        topic_ids = [topic.id for topic in topics]
        lessons = session.exec(
            select(Lesson).where(Lesson.topic_id.in_(topic_ids))
        ).all()

        # Total lessons in subject
        total_lessons = len(lessons)

        # Get completed lessons from progress data
        completed_lesson_ids = enrollment.progress_data.get("completed_lessons", [])
        completed_lessons = len(completed_lesson_ids)

        # Calculate completion percentage
        completion_percentage = (
            (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
        )

        # Get activities for this subject's lessons
        lesson_ids = [lesson.id for lesson in lessons]

        # Activity query with date filter if applicable
        activity_query = select(Activity).where(
            Activity.user_id == student_id, Activity.lesson_id.in_(lesson_ids)
        )

        if start_date:
            activity_query = activity_query.where(Activity.start_time >= start_date)

        activities = session.exec(activity_query).all()

        # Calculate time spent on this subject in the specified period
        total_time_spent = sum(a.duration_seconds or 0 for a in activities)

        # Get the most recent activity for this subject
        recent_activity = session.exec(
            select(Activity)
            .where(Activity.user_id == student_id)
            .where(Activity.lesson_id.in_(lesson_ids))
            .order_by(Activity.start_time.desc())
            .limit(1)
        ).first()

        # Create subject progress object
        subject_progress = SubjectProgress(
            subject_id=subject.id,
            subject_name=subject.name,
            total_lessons=total_lessons,
            completed_lessons=completed_lessons,
            completion_percentage=completion_percentage,
            time_spent_seconds=total_time_spent,
            last_activity_date=recent_activity.start_time if recent_activity else None,
        )

        subject_progress_list.append(subject_progress)

    # Get recent activities across all subjects
    activity_query = select(Activity).where(Activity.user_id == student_id)

    if start_date:
        activity_query = activity_query.where(Activity.start_time >= start_date)

    recent_activities = session.exec(
        activity_query.order_by(Activity.start_time.desc()).limit(10)
    ).all()

    # Process activities for response
    activity_summaries = []
    for activity in recent_activities:
        # Get lesson and subject info
        lesson = None
        subject = None

        if activity.lesson_id:
            lesson = session.get(Lesson, activity.lesson_id)
            if lesson and lesson.topic_id:
                topic = session.get(Topic, lesson.topic_id)
                if topic and topic.subject_id:
                    subject = session.get(Subject, topic.subject_id)

        activity_summary = ActivitySummary(
            id=activity.id,
            type=activity.type,
            title=lesson.title if lesson else "Unknown Lesson",
            subject=subject.name if subject else "Unknown Subject",
            start_time=activity.start_time,
            duration_seconds=activity.duration_seconds or 0,
            status=activity.status,
            score=activity.results.get("score") if activity.results else None,
        )

        activity_summaries.append(activity_summary)

    # Calculate overall stats for the time period
    all_activities_query = select(Activity).where(Activity.user_id == student_id)

    if start_date:
        all_activities_query = all_activities_query.where(
            Activity.start_time >= start_date
        )

    all_activities = session.exec(all_activities_query).all()

    total_activities = len(all_activities)
    completed_activities = sum(1 for a in all_activities if a.status == "completed")
    total_time_spent = sum(a.duration_seconds or 0 for a in all_activities)

    # Get average scores
    scores = []
    for activity in all_activities:
        if (
            activity.type == "quiz"
            and activity.status == "completed"
            and activity.results
        ):
            if "score" in activity.results:
                try:
                    score = float(activity.results["score"])
                    scores.append(score)
                except (ValueError, TypeError):
                    continue

    average_score = sum(scores) / len(scores) if scores else 0

    # Get student info
    student = session.get(User, student_id)

    # Build final response
    return ProgressSummary(
        user_id=student_id,
        user_name=student.full_name if student else "Unknown Student",
        streak_days=streak_info.current_streak,
        streak_start_date=streak_info.streak_start_date,
        study_time_hours=round(total_time_spent / 3600, 1),
        average_score=average_score,
        subjects=subject_progress_list,
        recent_activities=activity_summaries,
        total_activities=total_activities,
        completed_activities=completed_activities,
    )


@router.get("/streak")
async def get_user_streak(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """
    Get the current user's streak information.
    """
    return calculate_streak(current_user.id, session)


@router.get("/student/{student_id}/streak")
async def get_student_streak(
    student_id: int = Depends(get_authorized_student),
    session: Session = Depends(get_session),
):
    """
    Get a specific student's streak information.

    Authorization is handled by the get_authorized_student dependency.
    """
    return calculate_streak(student_id, session)


@router.get("/achievements", response_model=List[Dict[str, Any]])
async def get_achievements(
    user_id: Optional[int] = Query(
        None, description="User ID to fetch achievements for"
    ),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
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
        result = await session.execute(achievements_query)
        achievements = result.scalars().all()

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
    user_id: Optional[int] = Query(None, description="User ID to fetch stats for"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
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
        result = await session.execute(user_query)
        user = result.scalars().first()

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
            activity.score
            for activity in activities
            if hasattr(activity, "score") and activity.score is not None
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
        school_result = await session.execute(school_student_query)
        school_student = school_result.scalars().first()

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
            platform_result = await session.execute(platform_enrollments_query)
            platform_enrollments = platform_result.scalars().all()

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
