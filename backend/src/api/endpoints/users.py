from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

from src.db.postgresql import get_session
from src.db.models.user import User, Guardian
from src.core.security import get_password_hash, verify_password
from src.api.endpoints.auth import get_current_user

router = APIRouter(prefix="/api/v1/users", tags=["users"])


# Models
class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    grade_level: Optional[int] = None
    school_type: Optional[str] = None


class GuardianCreate(BaseModel):
    email: EmailStr
    relationship: str
    can_view: bool = True
    can_edit: bool = False


class GuardianResponse(BaseModel):
    id: int
    student: dict
    parent: dict
    relationship: str
    can_view: bool
    can_edit: bool
    created_at: datetime


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


# Profile endpoints
@router.get("/profile")
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Get current user profile"""
    return current_user


@router.put("/profile")
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Update user profile"""
    # Check if username is being changed and is unique
    if profile_data.username and profile_data.username != current_user.username:
        stmt = select(User).where(User.username == profile_data.username)
        result = await db.execute(stmt)
        existing_user = result.scalars().first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken"
            )

    # Check if email is being changed and is unique
    if profile_data.email and profile_data.email != current_user.email:
        stmt = select(User).where(User.email == profile_data.email)
        result = await db.execute(stmt)
        existing_user = result.scalars().first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use"
            )

    # Update user fields
    for field, value in profile_data.dict(exclude_unset=True).items():
        setattr(current_user, field, value)

    # Update timestamp
    current_user.updated_at = datetime.utcnow()

    # Save changes
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    return current_user


@router.put("/password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Change user password"""
    # Verify current password
    if not verify_password(
        password_data.current_password, current_user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.updated_at = datetime.utcnow()

    # Save changes
    db.add(current_user)
    await db.commit()

    return {"message": "Password updated successfully"}


# Guardian endpoints
@router.get("/guardians", response_model=List[GuardianResponse])
async def get_guardians(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Get guardians for the current user (if student) or students (if parent)"""
    if current_user.user_type == "student":
        # Get guardians for the student
        stmt = select(Guardian).where(Guardian.student_id == current_user.id)
    else:
        # Get students for the parent
        stmt = select(Guardian).where(Guardian.parent_id == current_user.id)

    result = await db.execute(stmt)
    guardians = result.scalars().all()

    # Format response
    response = []
    for guardian in guardians:
        # Get student and parent details
        student_stmt = select(User).where(User.id == guardian.student_id)
        parent_stmt = select(User).where(User.id == guardian.parent_id)

        student_result = await db.execute(student_stmt)
        parent_result = await db.execute(parent_stmt)

        student = student_result.scalars().first()
        parent = parent_result.scalars().first()

        response.append(
            {
                "id": guardian.id,
                "student": {
                    "id": student.id,
                    "username": student.username,
                    "full_name": student.full_name,
                    "email": student.email,
                    "grade_level": student.grade_level,
                    "school_type": student.school_type,
                },
                "parent": {
                    "id": parent.id,
                    "username": parent.username,
                    "full_name": parent.full_name,
                    "email": parent.email,
                },
                "relationship": guardian.relationship,
                "can_view": guardian.can_view,
                "can_edit": guardian.can_edit,
                "created_at": guardian.created_at,
            }
        )

    return response


@router.post("/guardians", status_code=status.HTTP_201_CREATED)
async def add_guardian(
    guardian_data: GuardianCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Add a guardian for a student"""
    # Only students can add guardians
    if current_user.user_type != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can add guardians",
        )

    # Find the parent user by email
    stmt = select(User).where(User.email == guardian_data.email)
    result = await db.execute(stmt)
    parent = result.scalars().first()

    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email not found",
        )

    # Check if the guardian relationship already exists
    stmt = select(Guardian).where(
        Guardian.student_id == current_user.id, Guardian.parent_id == parent.id
    )
    result = await db.execute(stmt)
    existing = result.scalars().first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This guardian relationship already exists",
        )

    # Create the guardian relationship
    guardian = Guardian(
        student_id=current_user.id,
        parent_id=parent.id,
        relationship=guardian_data.relationship,
        can_view=guardian_data.can_view,
        can_edit=guardian_data.can_edit,
    )

    db.add(guardian)
    await db.commit()
    await db.refresh(guardian)

    return {
        "id": guardian.id,
        "student": {
            "id": current_user.id,
            "username": current_user.username,
            "full_name": current_user.full_name,
        },
        "parent": {
            "id": parent.id,
            "username": parent.username,
            "full_name": parent.full_name,
        },
        "relationship": guardian.relationship,
        "can_view": guardian.can_view,
        "can_edit": guardian.can_edit,
        "created_at": guardian.created_at,
    }


@router.delete("/guardians/{guardian_id}")
async def remove_guardian(
    guardian_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Remove a guardian relationship"""
    # Find the guardian relationship
    stmt = select(Guardian).where(Guardian.id == guardian_id)
    result = await db.execute(stmt)
    guardian = result.scalars().first()

    if not guardian:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guardian relationship not found",
        )

    # Ensure the user has permission to remove this relationship
    if guardian.student_id != current_user.id and guardian.parent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to remove this guardian relationship",
        )

    # Remove the relationship
    await db.delete(guardian)
    await db.commit()

    return {"message": "Guardian relationship removed successfully"}


@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Delete user account"""
    # For students, first remove all guardian relationships
    if current_user.user_type == "student":
        # Find all guardian relationships where the user is the student
        stmt = select(Guardian).where(Guardian.student_id == current_user.id)
        result = await db.execute(stmt)
        guardians = result.scalars().all()

        # Delete all guardian relationships
        for guardian in guardians:
            await db.delete(guardian)

    # For parents, check if they are the sole guardian for any students
    elif current_user.user_type in ["parent", "teacher"]:
        # Find all guardian relationships where the user is the parent
        stmt = select(Guardian).where(Guardian.parent_id == current_user.id)
        result = await db.execute(stmt)
        guardians = result.scalars().all()

        # Check for each student if they have other guardians
        for guardian in guardians:
            # Count other guardians for this student
            stmt = select(Guardian).where(
                Guardian.student_id == guardian.student_id,
                Guardian.parent_id != current_user.id,
            )
            result = await db.execute(stmt)
            other_guardians = result.scalars().all()

            # If this is the only guardian, don't allow account deletion
            if not other_guardians:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete account as you are the only guardian for at least one student",
                )

            # Delete this guardian relationship
            await db.delete(guardian)

    # Delete the user
    await db.delete(current_user)
    await db.commit()

    return {"message": "Account deleted successfully"}
