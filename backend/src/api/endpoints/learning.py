from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from typing import Optional

from src.db import get_session
from src.api.endpoints.auth import get_current_active_user
from src.db.models.user import User
from src.db.models.content import Subject, Course, Topic, Lesson
from src.db.models.progress import Enrollment, Activity
from src.db.models.recommendations import Recommendation, ExplorationTopic
from src.db.models.community import StudySession

router = APIRouter()


# Subjects endpoints
@router.get("/subjects/enrolled")
async def get_enrolled_subjects(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """Get subjects the user is enrolled in"""
    try:
        # Query enrollments with their subjects
        result = await db.execute(
            select(Enrollment)
            .where(Enrollment.user_id == current_user.id, Enrollment.active)
            .join(Subject)
        )
        enrollments = result.scalars().all()

        # Format the response
        subjects = []
        for enrollment in enrollments:
            # Get progress data from enrollment
            progress_data = enrollment.progress_data or {}  # noqa: F841

            # Get activity data for this subject
            result = await db.execute(
                select(func.sum(Activity.duration_seconds)).where(
                    Activity.user_id == current_user.id,
                    Activity.lesson_id.in_(
                        select(Lesson.id).where(
                            Lesson.topic_id.in_(
                                select(Topic.id).where(
                                    Topic.subject_id == enrollment.subject_id
                                )
                            )
                        )
                    ),
                )
            )
            total_seconds = result.scalar() or 0

            # Format time spent
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            time_spent = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"

            # Get units completed info
            result = await db.execute(
                select(func.count(Lesson.id)).where(
                    Lesson.topic_id.in_(
                        select(Topic.id).where(
                            Topic.subject_id == enrollment.subject_id
                        )
                    )
                )
            )
            total_units = result.scalar() or 0

            result = await db.execute(
                select(func.count(Activity.id)).where(
                    Activity.user_id == current_user.id,
                    Activity.status == "completed",
                    Activity.lesson_id.in_(
                        select(Lesson.id).where(
                            Lesson.topic_id.in_(
                                select(Topic.id).where(
                                    Topic.subject_id == enrollment.subject_id
                                )
                            )
                        )
                    ),
                )
            )
            units_completed = result.scalar() or 0

            # Get color class based on subject name
            color_class = get_subject_color_class(enrollment.subject.name)

            subjects.append(
                {
                    "id": enrollment.subject_id,
                    "name": enrollment.subject.name,
                    "level": f"Niveau {enrollment.subject.grade_level}"
                    if enrollment.subject.grade_level
                    else None,
                    "grade_level": enrollment.subject.grade_level,
                    "progress": int(enrollment.progress_percentage),
                    "unitsCompleted": units_completed,
                    "totalUnits": total_units,
                    "timeSpent": time_spent,
                    "icon": get_subject_icon(enrollment.subject.name),
                    "colorClass": color_class,
                    "enrollmentDate": enrollment.enrolled_at.isoformat(),
                    "lastActivity": enrollment.last_activity_at.isoformat()
                    if enrollment.last_activity_at
                    else None,
                }
            )

        return {"subjects": subjects}
    except Exception as e:
        print(f"Error getting enrolled subjects: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.get("/subjects")
async def get_all_subjects(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
    grade_level: Optional[int] = None,
):
    """Get all available subjects, optionally filtered by grade level"""
    try:
        # Build query based on filters
        query = select(Subject)
        if grade_level is not None:
            query = query.where(Subject.grade_level == grade_level)

        # Execute query
        result = await db.execute(query)
        db_subjects = result.scalars().all()

        # Check which subjects the user is enrolled in
        result = await db.execute(
            select(Enrollment.subject_id).where(
                Enrollment.user_id == current_user.id, Enrollment.active
            )
        )
        enrolled_subject_ids = [row[0] for row in result.all()]

        # Format the response
        subjects = []
        for subject in db_subjects:
            subjects.append(
                {
                    "id": subject.id,
                    "name": subject.name,
                    "description": subject.description,
                    "grade_level": subject.grade_level,
                    "icon": get_subject_icon(subject.name),
                    "colorClass": get_subject_color_class(subject.name),
                    "isEnrolled": subject.id in enrolled_subject_ids,
                }
            )

        return {"subjects": subjects}
    except Exception as e:
        print(f"Error getting all subjects: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.get("/subjects/{subject_id}")
async def get_subject_details(
    subject_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """Get detailed information about a specific subject"""
    try:
        # Get the subject
        result = await db.execute(select(Subject).where(Subject.id == subject_id))
        subject = result.scalars().first()

        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found"
            )

        # Check if user is enrolled
        result = await db.execute(
            select(Enrollment).where(
                Enrollment.user_id == current_user.id,
                Enrollment.subject_id == subject_id,
            )
        )
        enrollment = result.scalars().first()

        # Get topics for this subject
        result = await db.execute(select(Topic).where(Topic.subject_id == subject_id))
        topics = result.scalars().all()

        formatted_topics = []
        for topic in topics:
            # Get lessons for this topic
            result = await db.execute(
                select(Lesson).where(Lesson.topic_id == topic.id).order_by(Lesson.order)
            )
            lessons = result.scalars().all()

            formatted_lessons = []
            for lesson in lessons:
                # Check if user has completed this lesson
                result = await db.execute(
                    select(Activity).where(
                        Activity.user_id == current_user.id,
                        Activity.lesson_id == lesson.id,
                        Activity.status == "completed",
                    )
                )
                is_completed = result.scalars().first() is not None

                formatted_lessons.append(
                    {
                        "id": lesson.id,
                        "title": lesson.title,
                        "contentType": lesson.content_type,
                        "duration": lesson.duration_minutes,
                        "isCompleted": is_completed,
                    }
                )

            formatted_topics.append(
                {
                    "id": topic.id,
                    "name": topic.name,
                    "description": topic.description,
                    "difficulty": topic.difficulty,
                    "order": topic.order,
                    "lessons": formatted_lessons,
                }
            )

        # Format the response
        return {
            "id": subject.id,
            "name": subject.name,
            "description": subject.description,
            "grade_level": subject.grade_level,
            "icon": get_subject_icon(subject.name),
            "colorClass": get_subject_color_class(subject.name),
            "isEnrolled": enrollment is not None,
            "progress": enrollment.progress_percentage if enrollment else 0,
            "enrollmentDate": enrollment.enrolled_at.isoformat()
            if enrollment
            else None,
            "topics": formatted_topics,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting subject details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.post("/subjects/{subject_id}/enroll")
async def enroll_in_subject(
    subject_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """Enroll the user in a subject"""
    try:
        # Check if the subject exists
        result = await db.execute(select(Subject).where(Subject.id == subject_id))
        subject = result.scalars().first()

        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found"
            )

        # Check if user is already enrolled
        result = await db.execute(
            select(Enrollment).where(
                Enrollment.user_id == current_user.id,
                Enrollment.subject_id == subject_id,
            )
        )
        existing_enrollment = result.scalars().first()

        if existing_enrollment:
            # If already enrolled but not active, reactivate
            if not existing_enrollment.active:
                existing_enrollment.active = True
                existing_enrollment.enrolled_at = datetime.utcnow()
                await db.commit()
                return {"message": "Successfully re-enrolled in subject"}
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Already enrolled in this subject",
                )

        # Create new enrollment
        enrollment = Enrollment(
            user_id=current_user.id,
            subject_id=subject_id,
            enrolled_at=datetime.utcnow(),
            active=True,
            progress_percentage=0.0,
            progress_data={},
        )

        db.add(enrollment)
        await db.commit()

        return {"message": "Successfully enrolled in subject"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error enrolling in subject: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.post("/subjects/{subject_id}/unenroll")
async def unenroll_from_subject(
    subject_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """Unenroll the user from a subject"""
    try:
        # Check if user is enrolled
        result = await db.execute(
            select(Enrollment).where(
                Enrollment.user_id == current_user.id,
                Enrollment.subject_id == subject_id,
                Enrollment.active,
            )
        )
        enrollment = result.scalars().first()

        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Not enrolled in this subject",
            )

        # Deactivate enrollment instead of deleting
        enrollment.active = False
        await db.commit()

        return {"message": "Successfully unenrolled from subject"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error unenrolling from subject: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


# Recommendations endpoints
@router.get("/recommendations")
async def get_recommendations(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
    limit: int = Query(10, gt=0),
    offset: int = Query(0, ge=0),
):
    """Get personalized recommendations for the user"""
    try:
        # Get user's recommendations
        result = await db.execute(
            select(Recommendation)
            .where(Recommendation.user_id == current_user.id)
            .order_by(Recommendation.priority, Recommendation.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        recommendations = result.scalars().all()

        formatted_recommendations = []
        for rec in recommendations:
            formatted_rec = {
                "id": rec.id,
                "type": rec.type,
                "title": rec.title,
                "description": rec.description,
                "priority": rec.priority,
                "image_url": rec.image_url,
                "created_at": rec.created_at.isoformat(),
            }

            # Add subject, topic, or course info if available
            if rec.subject_id:
                result = await db.execute(
                    select(Subject).where(Subject.id == rec.subject_id)
                )
                subject = result.scalars().first()
                if subject:
                    formatted_rec["subject"] = subject.name
                    formatted_rec["icon"] = get_subject_icon(subject.name)
                    formatted_rec["colorClass"] = get_subject_color_class(subject.name)

            if rec.topic_id:
                result = await db.execute(select(Topic).where(Topic.id == rec.topic_id))
                topic = result.scalars().first()
                if topic:
                    formatted_rec["topic"] = topic.name

            if rec.course_id:
                result = await db.execute(
                    select(Course).where(Course.id == rec.course_id)
                )
                course = result.scalars().first()
                if course:
                    formatted_rec["category"] = course.title
                    formatted_rec["level"] = f"Niveau {course.difficulty_level}"
                    formatted_rec["duration"] = (
                        f"{course.meta_data.get('duration_hours', 0)} heures"
                        if course.meta_data
                        else None
                    )
                    formatted_rec["tags"] = (
                        course.meta_data.get("tags", []) if course.meta_data else []
                    )

            formatted_recommendations.append(formatted_rec)

        return {"recommendations": formatted_recommendations}
    except Exception as e:
        print(f"Error getting recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


# Courses endpoints
@router.get("/courses")
async def get_courses(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
    limit: int = Query(10, gt=0),
    offset: int = Query(0, ge=0),
    subject_id: Optional[int] = None,
):
    """Get available courses, optionally filtered by subject"""
    try:
        # Build query based on filters
        query = select(Course)
        if subject_id is not None:
            query = query.where(Course.subject_id == subject_id)

        # Add pagination
        query = query.offset(offset).limit(limit)

        # Execute query
        result = await db.execute(query)
        courses = result.scalars().all()

        # Format the response
        formatted_courses = []
        for course in courses:
            # Get subject info
            result = await db.execute(
                select(Subject).where(Subject.id == course.subject_id)
            )
            subject = result.scalars().first()

            formatted_course = {
                "id": course.id,
                "title": course.title,
                "description": course.description,
                "subject": subject.name if subject else None,
                "category": subject.name if subject else None,
                "level": f"Niveau {course.difficulty_level}",
                "duration": f"{course.meta_data.get('duration_hours', 0)} heures"
                if course.meta_data
                else None,
                "is_featured": course.is_featured,
                "is_new": course.is_new,
                "icon": get_subject_icon(subject.name if subject else ""),
                "colorClass": get_subject_color_class(subject.name if subject else ""),
                "created_at": course,
            }

            # Get tags if available
            if course.meta_data and "tags" in course.meta_data:
                formatted_course["tags"] = course.meta_data["tags"]

            formatted_courses.append(formatted_course)

        # Get total count for pagination
        result = await db.execute(
            select(func.count(Course.id)).where(
                Course.subject_id == subject_id if subject_id is not None else True
            )
        )
        total_count = result.scalar() or 0

        return {
            "courses": formatted_courses,
            "total": total_count,
            "limit": limit,
            "offset": offset,
        }
    except Exception as e:
        print(f"Error getting courses: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


# Explore endpoints
@router.get("/explore/topics")
async def get_explore_topics(
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """Get topics for exploration, optionally filtered by search query"""
    try:
        # Build query based on filters
        query = select(ExplorationTopic)

        if q:
            search_term = f"%{q}%"
            query = query.where(
                ExplorationTopic.title.ilike(search_term)
                | ExplorationTopic.description.ilike(search_term)
                | ExplorationTopic.connects_concepts.contains([q])
                | ExplorationTopic.related_subjects.contains([q])
            )

        # Execute query
        result = await db.execute(query)
        topics = result.scalars().all()

        # Format the response
        formatted_topics = []
        for topic in topics:
            icon = "science"  # Default icon

            # Try to determine icon based on related subjects
            if topic.related_subjects:
                for subject in topic.related_subjects:
                    if subject.lower() in [
                        "math",
                        "mathematics",
                        "mathématiques",
                        "algebra",
                        "geometry",
                    ]:
                        icon = "math"
                        break
                    elif subject.lower() in [
                        "literature",
                        "littérature",
                        "poetry",
                        "poésie",
                        "writing",
                    ]:
                        icon = "literature"
                        break
                    elif subject.lower() in [
                        "history",
                        "histoire",
                        "historical",
                        "historique",
                    ]:
                        icon = "history"
                        break

            formatted_topics.append(
                {
                    "id": topic.id,
                    "title": topic.title,
                    "description": topic.description,
                    "learners": topic.meta_data.get("learner_count", 0)
                    if topic.meta_data
                    else 0,
                    "is_featured": topic.is_featured,
                    "is_new": topic.is_new,
                    "connects_concepts": topic.connects_concepts,
                    "related_subjects": topic.related_subjects,
                    "icon": icon,
                }
            )

        return {"topics": formatted_topics}
    except Exception as e:
        print(f"Error getting explore topics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


# Schedule endpoints
@router.get("/schedule")
async def get_schedule(
    start: Optional[str] = None,
    end: Optional[str] = None,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """Get user's schedule, optionally filtered by date range"""
    try:
        # Convert string dates to datetime if provided
        start_date = (
            datetime.fromisoformat(start.replace("Z", "+00:00"))
            if start
            else datetime.utcnow()
        )
        end_date = (
            datetime.fromisoformat(end.replace("Z", "+00:00"))
            if end
            else start_date + timedelta(days=14)
        )

        # Get study sessions in date range
        result = await db.execute(
            select(StudySession)
            .where(
                StudySession.user_id == current_user.id,
                StudySession.start_time >= start_date,
                StudySession.start_time <= end_date,
            )
            .order_by(StudySession.start_time)
        )
        sessions = result.scalars().all()

        # Format schedule events
        events = []
        for session in sessions:
            # Format date info
            start_time = session.start_time
            day = start_time.strftime("%d")
            day_name = start_time.strftime("%a")

            # Get subject info if available
            subject_name = None
            if session.subject_id:
                result = await db.execute(
                    select(Subject).where(Subject.id == session.subject_id)
                )
                subject = result.scalars().first()
                if subject:
                    subject_name = subject.name

            events.append(
                {
                    "id": session.id,
                    "title": session.title,
                    "subject": subject_name,
                    "day": day,
                    "dayName": day_name,
                    "startTime": session.start_time.isoformat(),
                    "endTime": session.end_time.isoformat()
                    if session.end_time
                    else (
                        session.start_time + timedelta(minutes=session.duration_minutes)
                    ).isoformat(),
                    "duration": session.duration_minutes,
                    "status": session.status,
                    "type": session.session_type,
                }
            )

        return {"events": events}
    except Exception as e:
        print(f"Error getting schedule: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.post("/schedule")
async def create_schedule_event(
    event_data: dict,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new schedule event"""
    try:
        # Extract data from request
        title = event_data.get("title")
        if not title:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required"
            )

        # Create study session
        session = StudySession(
            user_id=current_user.id,
            title=title,
            session_type=event_data.get("type", "focused"),
            start_time=datetime.fromisoformat(
                event_data.get("startTime").replace("Z", "+00:00")
            ),
            duration_minutes=event_data.get("duration", 60),
            subject_id=event_data.get("subjectId"),
            topic_id=event_data.get("topicId"),
            status="scheduled",
        )

        db.add(session)
        await db.commit()

        # Return the created event
        return {
            "id": session.id,
            "title": session.title,
            "startTime": session.start_time.isoformat(),
            "endTime": (
                session.start_time + timedelta(minutes=session.duration_minutes)
            ).isoformat(),
            "duration": session.duration_minutes,
            "type": session.session_type,
            "subject_id": session.subject_id,
            "topic_id": session.topic_id,
            "status": session.status,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating schedule event: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.put("/schedule/{event_id}")
async def update_schedule_event(
    event_id: int,
    event_data: dict,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """Update an existing schedule event"""
    try:
        # Get the event
        result = await db.execute(
            select(StudySession).where(
                StudySession.id == event_id, StudySession.user_id == current_user.id
            )
        )
        session = result.scalars().first()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Schedule event not found"
            )

        # Update fields
        if "title" in event_data:
            session.title = event_data["title"]

        if "type" in event_data:
            session.session_type = event_data["type"]

        if "startTime" in event_data:
            session.start_time = datetime.fromisoformat(
                event_data["startTime"].replace("Z", "+00:00")
            )

        if "duration" in event_data:
            session.duration_minutes = event_data["duration"]

        if "subjectId" in event_data:
            session.subject_id = event_data["subjectId"]

        if "topicId" in event_data:
            session.topic_id = event_data["topicId"]

        if "status" in event_data:
            session.status = event_data["status"]

        await db.commit()

        # Return the updated event
        return {
            "id": session.id,
            "title": session.title,
            "startTime": session.start_time.isoformat(),
            "endTime": (
                session.start_time + timedelta(minutes=session.duration_minutes)
            ).isoformat(),
            "duration": session.duration_minutes,
            "type": session.session_type,
            "subject_id": session.subject_id,
            "topic_id": session.topic_id,
            "status": session.status,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating schedule event: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.delete("/schedule/{event_id}")
async def delete_schedule_event(
    event_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a schedule event"""
    try:
        # Get the event
        result = await db.execute(
            select(StudySession).where(
                StudySession.id == event_id, StudySession.user_id == current_user.id
            )
        )
        session = result.scalars().first()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Schedule event not found"
            )

        # Delete the session
        await db.delete(session)
        await db.commit()

        return {"message": "Schedule event deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting schedule event: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.get("/progress")
async def get_learning_progress(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """Get user's learning progress across all subjects"""
    try:
        # Get enrollments
        result = await db.execute(
            select(Enrollment)
            .where(Enrollment.user_id == current_user.id, Enrollment.active)
            .join(Subject)
        )
        enrollments = result.scalars().all()

        # Get weekly activity
        one_week_ago = datetime.utcnow() - timedelta(days=7)
        result = await db.execute(
            select(Activity).where(
                Activity.user_id == current_user.id, Activity.start_time >= one_week_ago
            )
        )
        activities = result.scalars().all()

        # Calculate total study time this week
        total_seconds = sum(activity.duration_seconds or 0 for activity in activities)
        total_hours = total_seconds / 3600

        # Get unique days with activity
        active_days = len(set(activity.start_time.date() for activity in activities))

        # Count completed topics
        result = await db.execute(
            select(func.count(Topic.id)).where(
                Topic.id.in_(
                    select(Activity.topic_id)
                    .where(
                        Activity.user_id == current_user.id,
                        Activity.status == "completed",
                    )
                    .group_by(Activity.topic_id)
                )
            )
        )
        completed_topics = result.scalar() or 0

        # Format subject progress
        subjects_progress = []
        for enrollment in enrollments:
            # Get activities for this subject
            result = await db.execute(
                select(Activity).where(
                    Activity.user_id == current_user.id,
                    Activity.subject_id == enrollment.subject_id,
                )
            )
            subject_activities = result.scalars().all()

            # Calculate subject stats
            subject_seconds = sum(
                activity.duration_seconds or 0 for activity in subject_activities
            )
            subject_hours = subject_seconds / 3600

            subjects_progress.append(
                {
                    "id": enrollment.subject_id,
                    "name": enrollment.subject.name,
                    "progress": enrollment.progress_percentage,
                    "time_spent_hours": round(subject_hours, 1),
                    "last_activity": enrollment.last_activity_at.isoformat()
                    if enrollment.last_activity_at
                    else None,
                    "color_class": get_subject_color_class(enrollment.subject.name),
                }
            )

        # Format the response
        return {
            "weekly_hours": round(total_hours, 1),
            "weekly_goal": 5,  # Hard-coded for now, could be user setting
            "active_days": active_days,
            "completed_topics": completed_topics,
            "subjects": subjects_progress,
        }
    except Exception as e:
        print(f"Error getting learning progress: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


# Helper functions
def get_subject_icon(subject_name: str) -> str:
    """Get icon name based on subject name"""
    name_lower = subject_name.lower()

    if any(
        term in name_lower
        for term in ["math", "mathématique", "algebra", "calcul", "géométrie"]
    ):
        return "math"
    elif any(
        term in name_lower
        for term in [
            "literature",
            "littérature",
            "français",
            "french",
            "langue",
            "poésie",
        ]
    ):
        return "literature"
    elif any(
        term in name_lower
        for term in ["science", "physique", "chimie", "biology", "biologie"]
    ):
        return "science"
    elif any(
        term in name_lower for term in ["geography", "géographie", "earth", "terre"]
    ):
        return "geography"
    elif any(term in name_lower for term in ["history", "histoire", "historique"]):
        return "history"
    elif any(
        term in name_lower
        for term in ["language", "langue", "arabic", "arabe", "english", "anglais"]
    ):
        return "language"
    else:
        return "science"  # Default icon


def get_subject_color_class(subject_name: str) -> str:
    """Get color class based on subject name"""
    name_lower = subject_name.lower()

    if any(
        term in name_lower
        for term in ["math", "mathématique", "algebra", "calcul", "géométrie"]
    ):
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
    elif any(
        term in name_lower
        for term in [
            "literature",
            "littérature",
            "français",
            "french",
            "langue",
            "poésie",
        ]
    ):
        return (
            "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
        )
    elif any(
        term in name_lower
        for term in ["science", "physique", "chimie", "biology", "biologie"]
    ):
        return "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
    elif any(
        term in name_lower for term in ["geography", "géographie", "earth", "terre"]
    ):
        return "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400"
    elif any(term in name_lower for term in ["history", "histoire", "historique"]):
        return "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
    elif any(
        term in name_lower
        for term in ["language", "langue", "arabic", "arabe", "english", "anglais"]
    ):
        return "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400"
    else:
        return "bg-slate-100 text-slate-600 dark:bg-slate-900/40 dark:text-slate-400"  # Default color
