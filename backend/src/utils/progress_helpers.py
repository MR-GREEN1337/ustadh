from datetime import datetime, timedelta
from typing import List, Dict, Any

from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models.progress import Activity, Enrollment
from src.db.models.content import Subject, Topic, Lesson


async def calculate_streak(user_id: int, session: AsyncSession):
    """
    Calculate a user's learning streak based on daily activity.

    A streak is defined as consecutive days with at least one learning activity.
    """
    # Get all completed activities for the user, ordered by date
    query = (
        select(Activity)
        .where(Activity.user_id == user_id)
        .where(Activity.status == "completed")
        .order_by(Activity.start_time.desc())
    )

    result = await session.execute(query)
    activities = result.scalars().all()

    if not activities:
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "last_active_date": None,
            "streak_start_date": None,
        }

    # Get dates of all activities (just the date part, not time)
    activity_dates = sorted(
        set(activity.start_time.date() for activity in activities),
        reverse=True,  # Most recent first
    )

    if not activity_dates:
        return {
            "current_streak": 0,
            "longest_streak": 0,
            "last_active_date": None,
            "streak_start_date": None,
        }

    # Check if there was activity today
    today = datetime.now().date()
    last_active_date = activity_dates[0]
    days_since_last_activity = (today - last_active_date).days

    # Calculate current streak
    current_streak = 0
    streak_start_date = None

    # Current streak logic
    if days_since_last_activity <= 1:  # Allow for today or yesterday
        # Start counting from the most recent activity
        date_to_check = last_active_date
        current_streak = 1
        streak_start_date = last_active_date

        # Count consecutive days before the most recent activity
        for i in range(1, len(activity_dates)):
            previous_date = activity_dates[i]
            days_between = (date_to_check - previous_date).days

            if days_between == 1:
                # This is a consecutive day
                current_streak += 1
                date_to_check = previous_date
                streak_start_date = previous_date
            elif days_between == 0:
                # Same day, continue checking
                date_to_check = previous_date
            else:
                # Streak broken
                break

    # Calculate longest streak (simple approach)
    longest_streak = 1
    current_run = 1

    for i in range(1, len(activity_dates)):
        days_between = (activity_dates[i - 1] - activity_dates[i]).days

        if days_between == 1:
            current_run += 1
        elif days_between > 1:
            longest_streak = max(longest_streak, current_run)
            current_run = 1

    longest_streak = max(longest_streak, current_run)

    # Use the greater of current and longest streak
    # (if current streak is the longest ever)
    longest_streak = max(longest_streak, current_streak)

    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "last_active_date": last_active_date.isoformat(),
        "streak_start_date": streak_start_date.isoformat()
        if streak_start_date
        else None,
    }


def calculate_longest_streak(activity_dates: List[datetime.date]) -> int:
    """
    Calculate the longest streak from a list of activity dates.
    """
    if not activity_dates:
        return 0

    # Sort dates chronologically
    sorted_dates = sorted(activity_dates)

    longest_streak = 1
    current_streak = 1

    for i in range(1, len(sorted_dates)):
        prev_date = sorted_dates[i - 1]
        curr_date = sorted_dates[i]

        # Check if dates are consecutive
        if (curr_date - prev_date).days == 1:
            current_streak += 1
            longest_streak = max(longest_streak, current_streak)
        elif (curr_date - prev_date).days > 1:
            # Break in streak
            current_streak = 1

    return longest_streak


async def generate_progress_summary(
    user_id: int, session: AsyncSession, time_period: str = "week"
) -> Dict[str, Any]:
    """
    Generate a comprehensive progress summary for a user.

    Parameters:
    - user_id: User ID
    - session: Database session
    - time_period: "day", "week", "month", or "all"

    Returns a dictionary with streak info, subject progress, and recent activities.
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
    streak_info = calculate_streak(user_id, session)

    # Get all active enrollments with subject details
    enrollments = await session.execute(
        select(Enrollment)
        .where(Enrollment.user_id == user_id)
        .where(Enrollment.active == True)  # noqa: E712
    ).all()

    subject_progress = []

    for enrollment in enrollments:
        # Get subject
        subject = session.get(Subject, enrollment.subject_id)
        if not subject:
            continue

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
            Activity.user_id == user_id,
            Activity.lesson_id.in_(lesson_ids) if lesson_ids else False,
        )

        if start_date:
            activity_query = activity_query.where(Activity.start_time >= start_date)

        activities = session.exec(activity_query).all()

        # Calculate time spent on this subject in the specified period
        total_time_spent = sum(a.duration_seconds or 0 for a in activities)

        # Get the most recent activity for this subject
        recent_activity = session.exec(
            select(Activity)
            .where(Activity.user_id == user_id)
            .where(Activity.lesson_id.in_(lesson_ids) if lesson_ids else False)
            .order_by(Activity.start_time.desc())
            .limit(1)
        ).first()

        subject_progress.append(
            {
                "subject_id": subject.id,
                "subject_name": subject.name,
                "total_lessons": total_lessons,
                "completed_lessons": completed_lessons,
                "completion_percentage": completion_percentage,
                "time_spent_seconds": total_time_spent,
                "last_activity_date": recent_activity.start_time
                if recent_activity
                else None,
            }
        )

    # Get recent activities across all subjects
    activity_query = select(Activity).where(Activity.user_id == user_id)

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

        activity_summaries.append(
            {
                "id": activity.id,
                "type": activity.type,
                "title": lesson.title if lesson else "Unknown Lesson",
                "subject": subject.name if subject else "Unknown Subject",
                "start_time": activity.start_time,
                "duration_seconds": activity.duration_seconds or 0,
                "status": activity.status,
                "score": activity.results.get("score") if activity.results else None,
            }
        )

    # Calculate overall stats for the time period
    all_activities_query = select(Activity).where(Activity.user_id == user_id)

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

    # Build final response
    return {
        "streak_days": streak_info.current_streak,
        "streak_start_date": streak_info.streak_start_date,
        "study_time_hours": round(total_time_spent / 3600, 1),
        "average_score": average_score,
        "subjects": subject_progress,
        "recent_activities": activity_summaries,
        "total_activities": total_activities,
        "completed_activities": completed_activities,
    }


async def get_subject_completion_status(
    subject_id: int, user_id: int, session: AsyncSession
) -> Dict[str, Any]:
    """
    Calculate detailed completion status for a subject.

    Returns information on lessons completed, quizzes taken, and overall progress.
    """
    # Get the subject
    subject = session.get(Subject, subject_id)
    if not subject:
        return {"error": "Subject not found"}

    # Get topics for this subject
    topics = session.exec(select(Topic).where(Topic.subject_id == subject_id)).all()

    if not topics:
        return {
            "subject_id": subject_id,
            "subject_name": subject.name,
            "error": "No topics found for this subject",
        }

    topic_stats = []
    total_lessons = 0
    total_completed = 0

    for topic in topics:
        # Get lessons for this topic
        lessons = session.exec(select(Lesson).where(Lesson.topic_id == topic.id)).all()
        lesson_ids = [lesson.id for lesson in lessons]

        # Get activities for these lessons
        activities = session.exec(
            select(Activity)
            .where(Activity.user_id == user_id)
            .where(Activity.lesson_id.in_(lesson_ids) if lesson_ids else False)
            .where(Activity.status == "completed")
        ).all()

        # Group activities by lesson
        completed_lessons = set()
        for activity in activities:
            completed_lessons.add(activity.lesson_id)

        # Calculate topic completion
        topic_lessons = len(lessons)
        topic_completed = len(completed_lessons)
        completion_percentage = (
            (topic_completed / topic_lessons * 100) if topic_lessons > 0 else 0
        )

        topic_stats.append(
            {
                "topic_id": topic.id,
                "topic_name": topic.name,
                "total_lessons": topic_lessons,
                "completed_lessons": topic_completed,
                "completion_percentage": completion_percentage,
            }
        )

        total_lessons += topic_lessons
        total_completed += topic_completed

    # Calculate overall completion
    overall_percentage = (
        (total_completed / total_lessons * 100) if total_lessons > 0 else 0
    )

    return {
        "subject_id": subject_id,
        "subject_name": subject.name,
        "total_lessons": total_lessons,
        "completed_lessons": total_completed,
        "completion_percentage": overall_percentage,
        "topics": topic_stats,
    }
