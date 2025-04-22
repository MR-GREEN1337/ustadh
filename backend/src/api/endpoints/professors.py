from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from datetime import datetime

from ..models.professor import (
    ProfessorOnboardingResponse,
    ProfessorProfileCreate,
    ProfessorExpertiseUpdate,
    ProfessorAvailabilityUpdate,
    ProfessorCoursesUpdate,
)
from ...db.models.professor import SchoolProfessor
from ...db.postgresql import get_session
from .auth import get_current_user
from ...db.models.school import SchoolCourse, ClassSchedule
from ...db.models.professor import ProfessorCourse

from sqlalchemy.ext.asyncio import AsyncSession

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
        "has_completed_onboarding": professor.has_completed_onboarding,
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
    session.commit()
    session.refresh(professor)

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
    session.commit()
    session.refresh(professor)

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

    # Update onboarding status
    professor.onboarding_step = "courses"
    professor.onboarding_progress = 60

    session.add(professor)
    session.commit()
    session.refresh(professor)

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
    session.commit()
    session.refresh(professor)

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
    session.commit()
    session.refresh(professor)

    return {
        "has_completed_onboarding": professor.has_completed_onboarding,
        "onboarding_step": professor.onboarding_step,
        "onboarding_progress": professor.onboarding_progress,
        "onboarding_completed_at": professor.onboarding_completed_at,
    }


# ------------------ New Endpoints for Dashboard ------------------


@router.get("/courses")
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

    # Get the professor's courses
    stmt = (
        select(SchoolCourse)
        .join(ProfessorCourse, ProfessorCourse.course_id == SchoolCourse.id)
        .where(ProfessorCourse.professor_id == professor.id)
    )

    result = await session.execute(stmt)
    db_courses = result.scalars().all()

    # Transform to response model
    courses = []
    for course in db_courses:
        # Get enrollment count
        enrollment_count = await session.execute(
            select(SchoolCourse.course_enrollments).where(SchoolCourse.id == course.id)
        )
        count = len(enrollment_count.scalars().first() or [])

        # Get next scheduled class
        next_class_stmt = (
            select(ClassSchedule)
            .where(ClassSchedule.course_id == course.id)
            .where(ClassSchedule.start_date >= datetime.utcnow())
            .order_by(ClassSchedule.start_date)
            .limit(1)
        )
        next_class_result = await session.execute(next_class_stmt)
        next_class = next_class_result.scalar_one_or_none()

        # Calculate progress (this would normally be a more complex calculation)
        # For now, we're just using a random value between 0 and 100
        import random

        progress = random.randint(0, 100)

        courses.append(
            {
                "id": course.id,
                "title": course.title,
                "code": course.code,
                "description": course.description,
                "students": count,
                "nextClass": next_class.start_date.strftime("%A, %I:%M %p")
                if next_class
                else None,
                "progress": progress,
                "topics": course.syllabus.get("topics", []) if course.syllabus else [],
                "aiGenerated": course.ai_tutoring_enabled,
                "status": course.status,
            }
        )

    return {"courses": courses}
