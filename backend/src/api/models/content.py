from typing import Optional, Dict, Any
from pydantic import BaseModel


class SubjectBase(BaseModel):
    """Base schema for subject."""

    name: str
    grade_level: str
    description: str
    metadata: Optional[Dict[str, Any]] = None


class SubjectCreate(SubjectBase):
    """Schema for creating subject."""

    pass


class SubjectRead(SubjectBase):
    """Schema for reading subject."""

    id: int

    class Config:
        orm_mode = True


class SubjectUpdate(BaseModel):
    """Schema for updating subject."""

    name: Optional[str] = None
    grade_level: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class SubjectDetailedRead(SubjectRead):
    """Schema for reading detailed subject."""

    # Could include additional fields like topics count, etc.

    class Config:
        orm_mode = True


class TopicBase(BaseModel):
    """Base schema for topic."""

    name: str
    subject_id: int
    description: str
    order: int
    metadata: Optional[Dict[str, Any]] = None


class TopicCreate(TopicBase):
    """Schema for creating topic."""

    pass


class TopicRead(TopicBase):
    """Schema for reading topic."""

    id: int

    class Config:
        orm_mode = True


class TopicUpdate(BaseModel):
    """Schema for updating topic."""

    name: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class TopicWithSubjectRead(TopicRead):
    """Schema for reading topic with subject."""

    subject: SubjectRead

    class Config:
        orm_mode = True


class LessonBase(BaseModel):
    """Base schema for lesson."""

    title: str
    topic_id: int
    content_type: str
    content: Optional[Dict[str, Any]] = None
    order: int
    metadata: Optional[Dict[str, Any]] = None


class LessonCreate(LessonBase):
    """Schema for creating lesson."""

    pass


class LessonRead(LessonBase):
    """Schema for reading lesson."""

    id: int

    class Config:
        orm_mode = True


class LessonUpdate(BaseModel):
    """Schema for updating lesson."""

    title: Optional[str] = None
    content_type: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    order: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
