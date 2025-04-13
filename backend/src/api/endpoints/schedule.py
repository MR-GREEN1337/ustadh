from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from datetime import datetime, timedelta, time
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from src.db import get_session
from src.api.endpoints.auth import get_current_active_user
from src.db.models.user import User
from src.db.models.progress import ScheduleEntry  # Our new model
from src.db.models.school import (
    SchoolClass,
    SchoolStudent,
    ClassSchedule,
    ClassEnrollment,
)

router = APIRouter(prefix="/schedule", tags=["schedule"])


# Pydantic models for API
class ScheduleEntryCreate(BaseModel):
    title: str
    description: Optional[str] = None
    entry_type: str
    start_time: datetime
    end_time: datetime
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None
    recurrence_end_date: Optional[datetime] = None
    days_of_week: Optional[List[int]] = None
    school_class_id: Optional[int] = None
    course_id: Optional[int] = None
    assignment_id: Optional[int] = None
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    location: Optional[str] = None
    color: Optional[str] = None
    notification_minutes_before: Optional[int] = None
    is_completed: bool = False
    is_cancelled: bool = False
    meta_data: Optional[Dict[str, Any]] = None


class ScheduleEntryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    entry_type: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = None
    recurrence_end_date: Optional[datetime] = None
    days_of_week: Optional[List[int]] = None
    school_class_id: Optional[int] = None
    course_id: Optional[int] = None
    assignment_id: Optional[int] = None
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    location: Optional[str] = None
    color: Optional[str] = None
    notification_minutes_before: Optional[int] = None
    is_completed: Optional[bool] = None
    is_cancelled: Optional[bool] = None
    meta_data: Optional[Dict[str, Any]] = None


class DateRange(BaseModel):
    start_date: datetime
    end_date: datetime


# Helper functions
def format_schedule_entry(
    entry: ScheduleEntry, instance_date: Optional[datetime] = None
) -> Dict:
    """Format a schedule entry for API response"""
    result = {
        "id": entry.id,
        "title": entry.title,
        "description": entry.description,
        "entry_type": entry.entry_type,
        "start_time": entry.start_time.isoformat() if not instance_date else None,
        "end_time": entry.end_time.isoformat() if not instance_date else None,
        "is_recurring": entry.is_recurring,
        "recurrence_pattern": entry.recurrence_pattern,
        "recurrence_end_date": entry.recurrence_end_date.isoformat()
        if entry.recurrence_end_date
        else None,
        "days_of_week": entry.days_of_week,
        "school_class_id": entry.school_class_id,
        "course_id": entry.course_id,
        "assignment_id": entry.assignment_id,
        "subject_id": entry.subject_id,
        "topic_id": entry.topic_id,
        "location": entry.location,
        "color": entry.color,
        "notification_minutes_before": entry.notification_minutes_before,
        "is_completed": entry.is_completed,
        "is_cancelled": entry.is_cancelled,
        "created_at": entry.created_at.isoformat(),
        "updated_at": entry.updated_at.isoformat() if entry.updated_at else None,
    }

    # If this is a recurring instance, set the date for this instance
    if instance_date:
        # Combine instance date with original time
        start_time = datetime.combine(instance_date.date(), entry.start_time.time())
        end_time = datetime.combine(instance_date.date(), entry.end_time.time())

        result["instance_date"] = instance_date.date().isoformat()
        result["start_time"] = start_time.isoformat()
        result["end_time"] = end_time.isoformat()

    return result


def generate_recurring_instances(
    entry: ScheduleEntry, start_date: datetime, end_date: datetime
) -> List[Dict]:
    """Generate instances of a recurring entry within a date range"""
    instances = []

    # Check if the entry has valid recurrence settings
    if not entry.is_recurring or not entry.days_of_week:
        return [format_schedule_entry(entry)]

    # Get the original day of week and start date
    original_start = entry.start_time

    # Calculate the date range to consider
    range_start = max(start_date.date(), original_start.date())
    range_end = end_date.date()

    if entry.recurrence_end_date:
        range_end = min(range_end, entry.recurrence_end_date.date())

    # Generate a sequence of dates based on the recurrence pattern
    current_date = range_start

    while current_date <= range_end:
        day_of_week = current_date.weekday()  # 0-6 for Monday-Sunday

        if day_of_week in entry.days_of_week:
            # For this day, we need to create an instance
            instance_date = datetime.combine(current_date, time(0, 0))
            instances.append(format_schedule_entry(entry, instance_date))

        # Move to next day
        current_date += timedelta(days=1)

        # Handle specific recurrence patterns
        if entry.recurrence_pattern == "biweekly" and current_date.weekday() == 0:
            # Skip a week for bi-weekly pattern when we reach Monday
            current_date += timedelta(days=7)

    return instances


def generate_class_schedule_instances(
    schedule: ClassSchedule, start_date: datetime, end_date: datetime
) -> List[Dict]:
    """Generate instances of a class schedule within a date range"""
    instances = []

    # Convert start/end time strings to time objects
    start_time_obj = datetime.strptime(schedule.start_time, "%H:%M").time()
    end_time_obj = datetime.strptime(schedule.end_time, "%H:%M").time()

    # Calculate the date range to consider
    range_start = max(start_date.date(), schedule.start_date.date())
    range_end = end_date.date()

    if schedule.end_date:
        range_end = min(range_end, schedule.end_date.date())

    # Find the first date that matches the day of week
    current_date = range_start
    days_to_add = (schedule.day_of_week - current_date.weekday()) % 7
    if days_to_add > 0:
        current_date += timedelta(days=days_to_add)

    # Generate instances
    while current_date <= range_end:
        # Create the instance for this date
        instance_start = datetime.combine(current_date, start_time_obj)
        instance_end = datetime.combine(current_date, end_time_obj)

        # Format the instance
        instances.append(
            {
                "id": f"class-{schedule.id}-{current_date.strftime('%Y%m%d')}",
                "title": schedule.title,
                "description": schedule.description,
                "entry_type": "class",
                "start_time": instance_start.isoformat(),
                "end_time": instance_end.isoformat(),
                "location": schedule.room,
                "color": schedule.color,
                "is_cancelled": schedule.is_cancelled,
                "class_id": schedule.class_id,
                "course_id": schedule.course_id,
                "teacher_id": schedule.teacher_id,
                "day_of_week": schedule.day_of_week,
                "instance_date": current_date.isoformat(),
            }
        )

        # Move to next occurrence based on recurrence pattern
        if schedule.recurrence_pattern == "weekly":
            current_date += timedelta(days=7)
        elif schedule.recurrence_pattern == "biweekly":
            current_date += timedelta(days=14)
        else:
            # For non-recurring, stop after one instance
            break

    return instances


# CRUD operations for schedule entries
@router.post("/entries", response_model=Dict)
async def create_schedule_entry(
    entry: ScheduleEntryCreate,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new schedule entry for the user"""
    try:
        # Create new entry
        db_entry = ScheduleEntry(
            user_id=current_user.id,
            title=entry.title,
            description=entry.description,
            entry_type=entry.entry_type,
            start_time=entry.start_time,
            end_time=entry.end_time,
            is_recurring=entry.is_recurring,
            recurrence_pattern=entry.recurrence_pattern,
            recurrence_end_date=entry.recurrence_end_date,
            days_of_week=entry.days_of_week or [],
            school_class_id=entry.school_class_id,
            course_id=entry.course_id,
            assignment_id=entry.assignment_id,
            subject_id=entry.subject_id,
            topic_id=entry.topic_id,
            location=entry.location,
            color=entry.color,
            notification_minutes_before=entry.notification_minutes_before,
            is_completed=entry.is_completed,
            is_cancelled=entry.is_cancelled,
            meta_data=entry.meta_data or {},
        )

        db.add(db_entry)
        await db.commit()
        await db.refresh(db_entry)

        # Format and return the entry
        return format_schedule_entry(db_entry)

    except Exception as e:
        print(f"Error creating schedule entry: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.get("/entries", response_model=Dict)
async def get_schedule_entries(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    entry_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """Get user's schedule entries within a date range"""
    try:
        # Default to current week if no dates provided
        if not start_date:
            start_date = datetime.utcnow().replace(
                hour=0, minute=0, second=0, microsecond=0
            )
        if not end_date:
            end_date = start_date + timedelta(days=7)

        # Build query for non-recurring entries
        query = select(ScheduleEntry).where(
            ScheduleEntry.user_id == current_user.id,
            or_(
                # Regular entries that fall within date range
                and_(
                    ScheduleEntry.start_time >= start_date,
                    ScheduleEntry.start_time <= end_date,
                ),
                # Recurring entries that started before end_date and either have no end date or end after start_date
                and_(
                    ScheduleEntry.is_recurring,
                    ScheduleEntry.start_time <= end_date,
                    or_(
                        ScheduleEntry.recurrence_end_date is None,
                        ScheduleEntry.recurrence_end_date >= start_date,
                    ),
                ),
            ),
        )

        # Filter by entry type if provided
        if entry_type:
            query = query.where(ScheduleEntry.entry_type == entry_type)

        # Execute query
        result = await db.execute(query)
        entries = result.scalars().all()

        # Format entries and expand recurring events
        formatted_entries = []
        for entry in entries:
            if entry.is_recurring:
                # Generate recurring instances within the date range
                recurring_entries = generate_recurring_instances(
                    entry, start_date, end_date
                )
                formatted_entries.extend(recurring_entries)
            else:
                formatted_entries.append(format_schedule_entry(entry))

        return {"entries": formatted_entries}

    except Exception as e:
        print(f"Error getting schedule entries: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.get("/entries/{entry_id}", response_model=Dict)
async def get_schedule_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """Get a specific schedule entry"""
    try:
        # Get the entry
        result = await db.execute(
            select(ScheduleEntry).where(
                ScheduleEntry.id == entry_id, ScheduleEntry.user_id == current_user.id
            )
        )
        entry = result.scalars().first()

        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Schedule entry not found"
            )

        # Format and return the entry
        return format_schedule_entry(entry)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting schedule entry: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.put("/entries/{entry_id}", response_model=Dict)
async def update_schedule_entry(
    entry_id: int,
    entry_update: ScheduleEntryUpdate,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """Update a schedule entry"""
    try:
        # Get the entry
        result = await db.execute(
            select(ScheduleEntry).where(
                ScheduleEntry.id == entry_id, ScheduleEntry.user_id == current_user.id
            )
        )
        entry = result.scalars().first()

        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Schedule entry not found"
            )

        # Update fields if provided
        update_data = entry_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(entry, key, value)

        # Update timestamp
        entry.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(entry)

        # Format and return the updated entry
        return format_schedule_entry(entry)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating schedule entry: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.delete("/entries/{entry_id}", response_model=Dict)
async def delete_schedule_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a schedule entry"""
    try:
        # Get the entry
        result = await db.execute(
            select(ScheduleEntry).where(
                ScheduleEntry.id == entry_id, ScheduleEntry.user_id == current_user.id
            )
        )
        entry = result.scalars().first()

        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Schedule entry not found"
            )

        # Delete the entry
        await db.delete(entry)
        await db.commit()

        return {"message": "Schedule entry deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting schedule entry: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


# School schedule integration endpoints
@router.get("/class-schedule", response_model=Dict)
async def get_class_schedule(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """Get school class schedule for the user if they are a student"""
    try:
        # Check if user is a student
        if current_user.user_type != "student":
            return {"class_schedule": [], "message": "User is not a student"}

        # Default to current week if no dates provided
        if not start_date:
            start_date = datetime.utcnow().replace(
                hour=0, minute=0, second=0, microsecond=0
            )
        if not end_date:
            end_date = start_date + timedelta(days=7)

        # Get the student record
        result = await db.execute(
            select(SchoolStudent).where(SchoolStudent.user_id == current_user.id)
        )
        student = result.scalars().first()

        if not student:
            return {"class_schedule": [], "message": "No school student record found"}

        # Get student's class enrollments
        result = await db.execute(
            select(ClassEnrollment).where(
                ClassEnrollment.student_id == student.id,
                ClassEnrollment.status == "active",
            )
        )
        enrollments = result.scalars().all()

        # Get class IDs
        class_ids = [enrollment.class_id for enrollment in enrollments]

        if not class_ids:
            return {
                "class_schedule": [],
                "message": "No active class enrollments found",
            }

        # Get class schedules for these classes
        # We need to convert the date range to day-of-week numbers for comparison
        start_day = start_date.weekday()  # 0-6 for Monday-Sunday
        end_day = (start_day + (end_date - start_date).days) % 7  # Convert to 0-6 range

        # If the range spans more than a week, include all days
        include_all_days = (end_date - start_date).days >= 7

        # Build day of week filter
        if include_all_days:
            day_filter = True  # Include all days
        elif start_day <= end_day:
            # Range within same week, e.g. Monday to Friday
            day_filter = and_(
                ClassSchedule.day_of_week >= start_day,
                ClassSchedule.day_of_week <= end_day,
            )
        else:
            # Range spans week boundary, e.g. Friday to Tuesday
            day_filter = or_(
                ClassSchedule.day_of_week >= start_day,
                ClassSchedule.day_of_week <= end_day,
            )

        # Get active class schedules within date range
        result = await db.execute(
            select(ClassSchedule).where(
                ClassSchedule.class_id.in_(class_ids),
                ClassSchedule.is_active,
                day_filter,
                ClassSchedule.start_date <= end_date,
                or_(
                    ClassSchedule.end_date is None,
                    ClassSchedule.end_date >= start_date,
                ),
            )
        )
        class_schedules = result.scalars().all()

        # Format and expand recurring class schedules
        formatted_schedules = []
        for schedule in class_schedules:
            # Generate instances for the week
            instances = generate_class_schedule_instances(
                schedule, start_date, end_date
            )
            formatted_schedules.extend(instances)

        return {"class_schedule": formatted_schedules}

    except Exception as e:
        print(f"Error getting class schedule: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )


@router.post("/sync-school", response_model=Dict)
async def sync_school_schedule(
    options: Dict = Body({"overwrite_existing": False, "include_types": ["class"]}),
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_active_user),
):
    """Sync school class schedule to personal schedule"""
    try:
        # Check if user is a student
        if current_user.user_type != "student":
            return {"success": False, "message": "User is not a student"}

        # Get the student record
        result = await db.execute(
            select(SchoolStudent).where(SchoolStudent.user_id == current_user.id)
        )
        student = result.scalars().first()

        if not student:
            return {"success": False, "message": "No school student record found"}

        # Get student's class enrollments
        result = await db.execute(
            select(ClassEnrollment).where(
                ClassEnrollment.student_id == student.id,
                ClassEnrollment.status == "active",
            )
        )
        enrollments = result.scalars().all()

        # Get class IDs
        class_ids = [enrollment.class_id for enrollment in enrollments]

        if not class_ids:
            return {"success": False, "message": "No active class enrollments found"}

        # Get class schedules for these classes
        result = await db.execute(
            select(ClassSchedule).where(
                ClassSchedule.class_id.in_(class_ids),
                ClassSchedule.is_active,
            )
        )
        class_schedules = result.scalars().all()

        # Check if we should overwrite existing entries
        overwrite_existing = options.get("overwrite_existing", False)

        if overwrite_existing:
            # Delete existing entries linked to school classes
            result = await db.execute(
                select(ScheduleEntry).where(
                    ScheduleEntry.user_id == current_user.id,
                    ScheduleEntry.school_class_id.in_(class_ids),
                )
            )
            existing_entries = result.scalars().all()

            for entry in existing_entries:
                await db.delete(entry)

            await db.commit()

        # Create new entries for class schedules
        count = 0
        for schedule in class_schedules:
            # Check if the schedule already exists in personal schedule
            if not overwrite_existing:
                result = await db.execute(
                    select(func.count(ScheduleEntry.id)).where(
                        ScheduleEntry.user_id == current_user.id,
                        ScheduleEntry.school_class_id == schedule.class_id,
                        ScheduleEntry.meta_data.contains(
                            {"day_of_week": schedule.day_of_week}
                        ),
                    )
                )
                exists = result.scalar() > 0

                if exists:
                    continue

            # Get class and course info for title
            result = await db.execute(
                select(SchoolClass).where(SchoolClass.id == schedule.class_id)
            )
            school_class = result.scalars().first()

            class_name = school_class.name if school_class else "Class"

            # Create a recurring entry for this class schedule
            start_datetime = datetime.combine(
                schedule.start_date.date(),
                datetime.strptime(schedule.start_time, "%H:%M").time(),
            )
            end_datetime = datetime.combine(
                schedule.start_date.date(),
                datetime.strptime(schedule.end_time, "%H:%M").time(),
            )

            entry = ScheduleEntry(
                user_id=current_user.id,
                title=schedule.title or f"{class_name} Class",
                description=schedule.description or f"Class schedule for {class_name}",
                entry_type="class",
                start_time=start_datetime,
                end_time=end_datetime,
                is_recurring=True,
                recurrence_pattern=schedule.recurrence_pattern,
                recurrence_end_date=schedule.end_date,
                days_of_week=[schedule.day_of_week],
                school_class_id=schedule.class_id,
                course_id=schedule.course_id,
                location=schedule.room,
                color=schedule.color or "#4F46E5",  # Default indigo color
                notification_minutes_before=15,  # Default 15 minutes before
                is_completed=False,
                is_cancelled=schedule.is_cancelled,
                meta_data={
                    "day_of_week": schedule.day_of_week,
                    "teacher_id": schedule.teacher_id,
                    "original_schedule_id": schedule.id,
                },
            )

            db.add(entry)
            count += 1

        await db.commit()

        return {
            "success": True,
            "count": count,
            "message": f"Successfully synced {count} class schedules to personal schedule",
        }

    except Exception as e:
        print(f"Error syncing school schedule: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )
