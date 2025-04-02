from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from src.db import get_session
from src.api.models.user import (
    UserUpdate,
)
from src.db.models.user import User, Guardian
from src.api.endpoints.auth import get_current_active_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me/detailed", response_model=Any)
async def get_user_detailed(current_user: User = Depends(get_current_active_user)):
    """Get detailed information about the current user."""
    return current_user


@router.patch("/me", response_model=Any)
async def update_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Update current user's information."""
    # Update fields
    for key, value in user_update.dict(exclude_unset=True).items():
        if hasattr(current_user, key) and value is not None:
            setattr(current_user, key, value)

    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return current_user


@router.patch("/me/preferences", response_model=Any)
async def update_user_preferences(
    preferences_update: Any,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Update current user's preferences."""
    # Initialize preferences dictionary if it doesn't exist
    if current_user.preferences is None:
        current_user.preferences = {}

    # Add or update preferences
    for key, value in preferences_update.dict(exclude_unset=True).items():
        if value is not None:
            if key == "subjects_of_interest" or key == "subjects_of_difficulty":
                current_user.preferences[key] = value
            else:
                current_user.preferences[key] = value

    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return current_user


@router.patch("/me/education", response_model=Any)
async def update_user_education(
    education_update: Any,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Update current user's education information."""
    # Update education fields
    for key, value in education_update.dict(exclude_unset=True).items():
        if hasattr(current_user, key) and value is not None:
            setattr(current_user, key, value)

    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    return current_user


# Parent-specific endpoints
@router.post("/guardian", response_model=Any)
async def create_guardian_relationship(
    guardian_create: Any,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Create a guardian relationship between a parent and a student."""
    # Check if the current user is a parent
    if current_user.user_type != "parent" and current_user.user_type != "supervisor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents or supervisors can create guardian relationships",
        )

    # Check if the student exists
    student = session.get(User, guardian_create.student_id)
    if not student or student.user_type != "student":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
        )

    # Check if the relationship already exists
    existing_relationship = session.exec(
        select(Guardian)
        .where(Guardian.parent_id == current_user.id)
        .where(Guardian.student_id == guardian_create.student_id)
    ).first()

    if existing_relationship:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Relationship already exists",
        )

    # Create the relationship
    guardian = Guardian(
        student_id=guardian_create.student_id,
        parent_id=current_user.id,
        relationship=guardian_create.relationship,
        can_view=guardian_create.can_view,
        can_edit=guardian_create.can_edit,
    )

    session.add(guardian)
    session.commit()
    session.refresh(guardian)

    return guardian


@router.get("/guardian/students", response_model=Any)
async def get_parent_students(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Get all students that the current parent is a guardian of."""
    if current_user.user_type != "parent" and current_user.user_type != "supervisor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents or supervisors can access this endpoint",
        )

    # Get all guardian relationships for this parent
    guardians = session.exec(
        select(Guardian).where(Guardian.parent_id == current_user.id)
    ).all()

    # Get the students
    student_ids = [guardian.student_id for guardian in guardians]
    students = session.exec(select(User).where(User.id.in_(student_ids))).all()

    return students


@router.get("/student/{student_id}", response_model=Any)
async def get_student_details(
    student_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Get detailed information about a student (for parents and supervisors)."""
    # Check if current user is the student, a parent of the student, or an admin
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
            detail="Not authorized to view this student's details",
        )

    # Get the student
    student = session.get(User, student_id)
    if not student or student.user_type != "student":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Student not found"
        )

    return student
