from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from src.db import get_session
from src.api.models.recommendation import RecommendationRead
from src.db.models.recommendations import Recommendation
from src.db.models.user import User, Guardian
from src.api.endpoints.auth import get_current_active_user
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("", response_model=List[dict])
async def get_recommendations(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session),
):
    """Get personalized recommendations for the user"""

    # Get recommendations that haven't been acted upon
    query = (
        select(Recommendation)
        .where(
            Recommendation.user_id == current_user.id,
            Recommendation.acted_upon == False,  # noqa: E712
        )
        .order_by(Recommendation.priority, Recommendation.created_at.desc())
    )

    result = await session.execute(query)
    recommendations = result.scalars().all()

    # Mark recommendations as viewed
    for recommendation in recommendations:
        if not recommendation.viewed_at:
            recommendation.viewed_at = datetime.now()

    await session.commit()

    # Transform to response format
    recommendation_list = []
    for rec in recommendations:
        recommendation_data = {
            "id": rec.id,
            "title": rec.title,
            "description": rec.description,
            "type": rec.type,
            "priority": rec.priority,
            "subjectId": rec.subject_id,
            "topicId": rec.topic_id,
            "lessonId": rec.lesson_id,
            "metaData": rec.data or {},
        }
        recommendation_list.append(recommendation_data)

    return recommendation_list


@router.get("/student/{student_id}", response_model=List[RecommendationRead])
async def get_student_recommendations(
    student_id: int,
    limit: int = 10,
    viewed: Optional[bool] = None,
    acted_upon: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Get recommendations for a specific student (for parents and supervisors)."""
    # Check if current user is authorized to view the student's recommendations
    is_authorized = False

    if current_user.id == student_id:
        is_authorized = True
    elif current_user.user_type == "admin":
        is_authorized = True
    elif current_user.user_type in ["parent", "teacher"]:
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
            detail="Not authorized to view this student's recommendations",
        )

    # Build query
    query = select(Recommendation).where(Recommendation.user_id == student_id)

    # Apply filters
    if viewed is not None:
        if viewed:
            query = query.where(Recommendation.viewed_at.is_not(None))
        else:
            query = query.where(Recommendation.viewed_at.is_(None))

    if acted_upon is not None:
        query = query.where(Recommendation.acted_upon == acted_upon)

    # Apply sorting and limit
    query = query.order_by(
        Recommendation.priority, Recommendation.created_at.desc()
    ).limit(limit)

    # Execute query
    recommendations = session.exec(query).all()

    return recommendations


@router.patch("/{recommendation_id}/view", response_model=RecommendationRead)
async def mark_recommendation_viewed(
    recommendation_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Mark a recommendation as viewed."""
    # Get the recommendation
    recommendation = session.get(Recommendation, recommendation_id)
    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found"
        )

    # Check if the recommendation belongs to the current user
    if recommendation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this recommendation",
        )

    # Mark as viewed
    recommendation.viewed_at = datetime.utcnow()

    session.add(recommendation)
    session.commit()
    session.refresh(recommendation)

    return recommendation


@router.patch("/{recommendation_id}/act", response_model=RecommendationRead)
async def mark_recommendation_acted_upon(
    recommendation_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
):
    """Mark a recommendation as acted upon."""
    # Get the recommendation
    recommendation = session.get(Recommendation, recommendation_id)
    if not recommendation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found"
        )

    # Check if the recommendation belongs to the current user
    if recommendation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this recommendation",
        )

    # Mark as acted upon and viewed (if not already)
    recommendation.acted_upon = True
    if not recommendation.viewed_at:
        recommendation.viewed_at = datetime.utcnow()

    session.add(recommendation)
    session.commit()
    session.refresh(recommendation)

    return recommendation
