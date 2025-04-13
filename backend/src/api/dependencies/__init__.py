from datetime import datetime, timedelta
from typing import Optional, Tuple

from fastapi import Depends, HTTPException, status, Query
from sqlmodel import Session, select

from src.db import get_session
from src.db.models.user import User, Guardian
from src.api.endpoints.auth import get_current_active_user


async def get_authorized_student(
    student_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
) -> int:
    """
    Dependency that checks if the current user is authorized to access a student's data.

    Returns the student_id if authorized, otherwise raises an HTTPException.
    """
    # If requesting own data, always allowed
    if current_user.id == student_id:
        return student_id

    # Admin can access any student data
    if current_user.user_type == "admin":
        return student_id

    # Check if the student exists
    student = session.get(User, student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
        )

    # If not admin, check for guardian relationship
    if current_user.user_type in ["parent", "teacher"]:
        # Query for guardian relationship
        guardian = session.exec(
            select(Guardian)
            .where(Guardian.parent_id == current_user.id)
            .where(Guardian.student_id == student_id)
            .where(Guardian.can_view == True)  # noqa: E712
        ).first()

        if guardian:
            return student_id

    # If not authorized, raise exception
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Not authorized to access this student's data",
    )


async def validate_date_range(
    start_date: Optional[datetime] = Query(
        None, description="Start date for filtering (ISO format)"
    ),
    end_date: Optional[datetime] = Query(
        None, description="End date for filtering (ISO format)"
    ),
) -> Tuple[Optional[datetime], Optional[datetime]]:
    """
    Validates that the provided date range is valid.

    Returns a tuple of (start_date, end_date).
    """
    # If both dates are provided, ensure start_date is before end_date
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be before end date",
        )

    # If only end_date is provided, set a default start_date (30 days ago)
    if end_date and not start_date:
        start_date = end_date - timedelta(days=30)

    # If only start_date is provided, set a default end_date (now)
    if start_date and not end_date:
        end_date = datetime.utcnow()

    return start_date, end_date
