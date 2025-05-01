from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class RecommendationBase(BaseModel):
    """Base schema for recommendation."""

    user_id: int
    type: str
    title: str
    description: str
    priority: int = Field(3, ge=1, le=5)
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    lesson_id: Optional[int] = None
    data: Optional[Dict[str, Any]] = None


class RecommendationCreate(RecommendationBase):
    """Schema for creating recommendation."""

    pass


class RecommendationRead(RecommendationBase):
    """Schema for reading recommendation."""

    id: int
    created_at: datetime
    viewed_at: Optional[datetime] = None
    acted_upon: bool

    class Config:
        from_attributes = True


class RecommendationUpdate(BaseModel):
    """Schema for updating recommendation."""

    viewed_at: Optional[datetime] = None
    acted_upon: Optional[bool] = None
