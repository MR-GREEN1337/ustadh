from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel


class TutoringExchangeBase(BaseModel):
    """Base schema for tutoring exchange."""

    session_id: int
    sequence: int
    student_input_type: str
    student_input: Dict[str, Any]
    ai_response_type: str
    ai_response: Dict[str, Any]
    learning_signals: Optional[Dict[str, Any]] = None


class TutoringExchangeCreate(BaseModel):
    """Schema for creating tutoring exchange."""

    session_id: int
    student_input_type: str
    student_input: Dict[str, Any]


class TutoringExchangeRead(TutoringExchangeBase):
    """Schema for reading tutoring exchange."""

    id: int
    timestamp: datetime

    class Config:
        from_attributes = True


class TutoringExchangeUpdate(BaseModel):
    """Schema for updating tutoring exchange."""

    learning_signals: Dict[str, Any]


class SessionResourceBase(BaseModel):
    """Base schema for session resource."""

    session_id: int
    resource_type: str
    title: str
    content: Dict[str, Any]


class SessionResourceCreate(SessionResourceBase):
    """Schema for creating session resource."""

    pass


class SessionResourceRead(SessionResourceBase):
    """Schema for reading session resource."""

    id: int
    created_at: datetime
    student_saved: bool

    class Config:
        from_attributes = True


class SessionResourceUpdate(BaseModel):
    """Schema for updating session resource."""

    title: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    student_saved: Optional[bool] = None


class StudentInput(BaseModel):
    """Schema for student input in a tutoring session."""

    input_type: str  # "text", "voice", "ocr", "drawing", "file-upload"
    content: Dict[str, Any]  # Content structure depends on input_type


class AIResponse(BaseModel):
    """Schema for AI response in a tutoring exchange."""

    response_type: str  # "text", "voice", "diagram", "annotation", "correction"
    content: Dict[str, Any]  # Content structure depends on response_type


class VoiceConfig(BaseModel):
    """Schema for voice configuration."""

    enabled: bool = True
    voice_id: Optional[str] = None  # ID for voice type
    speed: float = 1.0  # Playback speed
    volume: float = 1.0  # Volume level


class OCRConfig(BaseModel):
    """Schema for OCR configuration."""

    enabled: bool = True
    auto_process: bool = True  # Process images automatically
    confidence_threshold: float = 0.7  # Minimum confidence for OCR results
    specialized_for: Optional[str] = None  # "math", "chemistry", "handwriting"


class WhiteboardConfig(BaseModel):
    """Schema for whiteboard configuration."""

    tools_enabled: List[str] = ["pen", "eraser", "text", "shape"]
    default_tool: str = "pen"
    grid_enabled: bool = False
    canvas_size: Dict[str, int] = {"width": 1200, "height": 800}
