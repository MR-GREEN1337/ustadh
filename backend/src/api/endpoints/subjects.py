from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from src.db import get_session
from src.api.models.content import (
    SubjectRead,
    SubjectDetailedRead,
    TopicRead,
    TopicWithSubjectRead,
    LessonRead,
)
from src.db.models.content import Subject, Topic, Lesson
from src.db.models.user import User
from src.api.endpoints.auth import get_current_active_user

router = APIRouter(prefix="/curriculum", tags=["curriculum"])


# Subject endpoints
@router.get("/subjects", response_model=List[SubjectRead])
async def get_subjects(
    grade_level: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """
    Get all subjects available.
    If grade_level is provided, filter subjects by grade level.
    """
    query = select(Subject)

    if grade_level:
        query = query.where(Subject.grade_level == grade_level)

    subjects = session.exec(query).all()
    return subjects


@router.get("/subjects/{subject_id}", response_model=SubjectDetailedRead)
async def get_subject(
    subject_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Get detailed information about a specific subject."""
    subject = session.get(Subject, subject_id)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found"
        )

    return subject


# Topic endpoints
@router.get("/subjects/{subject_id}/topics", response_model=List[TopicRead])
async def get_topics_by_subject(
    subject_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Get all topics for a specific subject."""
    # Check if subject exists
    subject = session.get(Subject, subject_id)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found"
        )

    # Get topics
    topics = session.exec(
        select(Topic).where(Topic.subject_id == subject_id).order_by(Topic.order)
    ).all()

    return topics


@router.get("/topics/{topic_id}", response_model=TopicWithSubjectRead)
async def get_topic(
    topic_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Get detailed information about a specific topic."""
    topic = session.get(Topic, topic_id)
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found"
        )

    return topic


# Lesson endpoints
@router.get("/topics/{topic_id}/lessons", response_model=List[LessonRead])
async def get_lessons_by_topic(
    topic_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Get all lessons for a specific topic."""
    # Check if topic exists
    topic = session.get(Topic, topic_id)
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found"
        )

    # Get lessons
    lessons = session.exec(
        select(Lesson).where(Lesson.topic_id == topic_id).order_by(Lesson.order)
    ).all()

    return lessons


@router.get("/lessons/{lesson_id}", response_model=LessonRead)
async def get_lesson(
    lesson_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Get detailed information about a specific lesson."""
    lesson = session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found"
        )

    return lesson


# Grade-specific curriculum endpoints
@router.get("/curriculum/{grade_level}", response_model=List[SubjectRead])
async def get_curriculum_by_grade(
    grade_level: str,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Get the entire curriculum for a specific grade level."""
    # Get subjects for the grade level
    subjects = session.exec(
        select(Subject).where(Subject.grade_level == grade_level)
    ).all()

    if not subjects:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No curriculum found for grade level: {grade_level}",
        )

    return subjects
