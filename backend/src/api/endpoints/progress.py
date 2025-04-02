from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from src.db import get_session
from src.api.models.progress import (
    EnrollmentCreate,
    EnrollmentRead,
    EnrollmentUpdate,
    ActivityCreate,
    ActivityRead,
    ActivityUpdate,
)
from src.db.models.progress import Enrollment, Activity, TutoringSession
from src.db.models.content import Subject, Lesson, Topic
from src.db.models.user import User, Guardian
from src.api.endpoints.auth import get_current_active_user

router = APIRouter(prefix="/progress", tags=["progress"])


# Enrollment endpoints
@router.post("/enroll", response_model=EnrollmentRead)
async def create_enrollment(
    enrollment: EnrollmentCreate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Enroll a user in a subject."""
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
    elif current_user.user_type in ["parent", "supervisor"]:
        # Check if there's a guardian relationship
        guardian = session.exec(
            select(Guardian)
            .where(Guardian.parent_id == current_user.id)
            .where(Guardian.student_id == enrollment.user_id)
        ).first()

        if guardian and guardian.can_edit:
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
    )

    session.add(db_enrollment)
    session.commit()
    session.refresh(db_enrollment)

    return db_enrollment


@router.get("/enrollments", response_model=List[EnrollmentRead])
async def get_enrollments(
    active_only: bool = True,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Get all enrollments for the current user."""
    query = select(Enrollment).where(Enrollment.user_id == current_user.id)

    if active_only:
        query = query.where(Enrollment.active == True)  # noqa: E712

    enrollments = session.exec(query).all()

    return enrollments


@router.get("/enrollments/{student_id}", response_model=List[EnrollmentRead])
async def get_student_enrollments(
    student_id: int,
    active_only: bool = True,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Get all enrollments for a specific student (for parents and supervisors)."""
    # Check if current user is authorized to view the student's enrollments
    is_authorized = False

    if current_user.id == student_id:
        is_authorized = True
    elif current_user.user_type == "admin":
        is_authorized = True
    elif current_user.user_type in ["parent", "supervisor"]:
        # Check if there's a guardian relationship
        guardian = session.exec(
            select(Guardian)
            .where(Guardian.parent_id == current_user.id)
            .where(Guardian.student_id == student_id)
        ).first()

        if guardian and guardian.can_view:
            is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this student's enrollments",
        )

    # Get enrollments
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
    """Update an enrollment's status or progress data."""
    # Get the enrollment
    enrollment = session.get(Enrollment, enrollment_id)
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
    elif current_user.user_type in ["parent", "supervisor"]:
        # Check if there's a guardian relationship
        guardian = session.exec(
            select(Guardian)
            .where(Guardian.parent_id == current_user.id)
            .where(Guardian.student_id == enrollment.user_id)
        ).first()

        if guardian and guardian.can_edit:
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

    session.add(enrollment)
    session.commit()
    session.refresh(enrollment)

    return enrollment


# Activity endpoints
@router.post("/activities", response_model=ActivityRead)
async def create_activity(
    activity: ActivityCreate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Create a new learning activity."""
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

    # Create new activity
    db_activity = Activity(
        user_id=activity.user_id,
        lesson_id=activity.lesson_id,
        type=activity.type,
        status=activity.status,
        data=activity.data or {},
    )

    session.add(db_activity)
    session.commit()
    session.refresh(db_activity)

    return db_activity


@router.get("/activities", response_model=List[ActivityRead])
async def get_activities(
    limit: int = 10,
    offset: int = 0,
    lesson_id: Optional[int] = None,
    activity_type: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Get learning activities for the current user."""
    query = select(Activity).where(Activity.user_id == current_user.id)

    # Apply filters
    if lesson_id:
        query = query.where(Activity.lesson_id == lesson_id)
    if activity_type:
        query = query.where(Activity.type == activity_type)
    if status:
        query = query.where(Activity.status == status)

    # Apply sorting and pagination
    query = query.order_by(Activity.start_time.desc()).offset(offset).limit(limit)

    # Execute query
    activities = session.exec(query).all()

    return activities


@router.get("/student/{student_id}/activities", response_model=List[ActivityRead])
async def get_student_activities(
    student_id: int,
    limit: int = 10,
    offset: int = 0,
    activity_type: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Get learning activities for a specific student (for parents and supervisors)."""
    # Check if current user is authorized to view the student's activities
    is_authorized = False

    if current_user.id == student_id:
        is_authorized = True
    elif current_user.user_type == "admin":
        is_authorized = True
    elif current_user.user_type in ["parent", "supervisor"]:
        # Check if there's a guardian relationship
        guardian = session.exec(
            select(Guardian)
            .where(Guardian.parent_id == current_user.id)
            .where(Guardian.student_id == student_id)
        ).first()

        if guardian and guardian.can_view:
            is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this student's activities",
        )

    # Build query
    query = select(Activity).where(Activity.user_id == student_id)

    # Apply filters
    if activity_type:
        query = query.where(Activity.type == activity_type)

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
    """Update a learning activity."""
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
    """Get stats for a specific subject enrollment."""
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

    # Get topics for this subject
    topics = session.exec(select(Topic).where(Topic.subject_id == subject_id)).all()

    # Get activities for this user related to lessons in these topics
    topic_ids = [topic.id for topic in topics]
    lessons = session.exec(select(Lesson).where(Lesson.topic_id.in_(topic_ids))).all()

    lesson_ids = [lesson.id for lesson in lessons]
    activities = session.exec(
        select(Activity)
        .where(Activity.user_id == current_user.id)
        .where(Activity.lesson_id.in_(lesson_ids))
    ).all()

    # Calculate stats
    total_activities = len(activities)
    completed_activities = sum(1 for a in activities if a.status == "completed")
    completion_rate = (
        (completed_activities / total_activities) * 100 if total_activities > 0 else 0
    )

    total_time_spent = sum(a.duration_seconds or 0 for a in activities)

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
        "total_activities": total_activities,
        "completed_activities": completed_activities,
        "completion_rate": completion_rate,
        "total_time_spent_seconds": total_time_spent,
        "total_time_spent_hours": round(total_time_spent / 3600, 1),
        "recent_activities": [
            {
                "id": a.id,
                "type": a.type,
                "status": a.status,
                "start_time": a.start_time,
                "duration_seconds": a.duration_seconds,
            }
            for a in recent_activities
        ],
    }


@router.get("/stats/overall")
async def get_overall_stats(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Get overall learning stats for the current user."""
    # Get all active enrollments
    enrollments = session.exec(
        select(Enrollment)
        .where(Enrollment.user_id == current_user.id)
        .where(Enrollment.active == True)  # noqa: E712
    ).all()

    # Get all activities
    activities = session.exec(
        select(Activity).where(Activity.user_id == current_user.id)
    ).all()

    # Get all tutoring sessions
    tutoring_sessions = session.exec(
        select(TutoringSession).where(TutoringSession.user_id == current_user.id)
    ).all()

    # Calculate stats
    total_subjects = len(enrollments)
    total_activities = len(activities)
    completed_activities = sum(1 for a in activities if a.status == "completed")
    total_tutoring_sessions = len(tutoring_sessions)
    completed_tutoring_sessions = sum(
        1 for s in tutoring_sessions if s.status == "completed"
    )

    total_time_spent = sum(a.duration_seconds or 0 for a in activities) + sum(
        s.duration_seconds or 0 for s in tutoring_sessions
    )

    # Get activity counts by type
    activity_types = {}
    for activity in activities:
        activity_type = activity.type
        if activity_type in activity_types:
            activity_types[activity_type] += 1
        else:
            activity_types[activity_type] = 1

    # Get recent activity
    recent_activities = session.exec(
        select(Activity)
        .where(Activity.user_id == current_user.id)
        .order_by(Activity.start_time.desc())
        .limit(5)
    ).all()

    return {
        "total_subjects": total_subjects,
        "total_activities": total_activities,
        "completed_activities": completed_activities,
        "completion_rate": (completed_activities / total_activities) * 100
        if total_activities > 0
        else 0,
        "total_tutoring_sessions": total_tutoring_sessions,
        "completed_tutoring_sessions": completed_tutoring_sessions,
        "total_time_spent_seconds": total_time_spent,
        "total_time_spent_hours": round(total_time_spent / 3600, 1),
        "activity_types": activity_types,
        "recent_activities": [
            {
                "id": a.id,
                "type": a.type,
                "status": a.status,
                "start_time": a.start_time,
                "duration_seconds": a.duration_seconds,
            }
            for a in recent_activities
        ],
    }
