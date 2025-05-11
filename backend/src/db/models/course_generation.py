from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlmodel import Field, SQLModel, Relationship, JSON


class CourseGenerationSession(SQLModel, table=True):
    """Model for tracking course generation sessions."""

    __tablename__ = "course_generation_session"

    id: str = Field(primary_key=True)  # Using string for UUID-like IDs
    user_id: int = Field(foreign_key="users.id", index=True)
    professor_id: Optional[int] = Field(
        default=None, foreign_key="schoolprofessor.id", index=True
    )

    # Session configuration
    title: Optional[str] = None
    subject: str
    education_level: str
    duration: str  # 'semester', 'quarter', 'year', etc.
    difficulty: str = "intermediate"  # 'beginner', 'intermediate', 'advanced'
    focus: str = "comprehensive"  # 'comprehensive', 'practical', 'theoretical'
    language: str = "en"
    specialization: Optional[str] = None

    # Session state
    status: str = "created"  # 'created', 'brainstorming', 'structuring', 'detailing', 'finalizing', 'complete', 'error'
    progress: int = 0  # 0-100
    current_step: Optional[str] = None

    # Generated content
    course_data: Dict[str, Any] = Field(default={}, sa_type=JSON)
    messages: List[Dict[str, Any]] = Field(default=[], sa_type=JSON)
    preferences: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Error handling
    error_message: Optional[str] = None
    retry_count: int = 0

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    last_activity: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: "User" = Relationship()  # noqa: F821
    professor: Optional["SchoolProfessor"] = Relationship()  # noqa: F821
    generated_course: Optional["SchoolCourse"] = Relationship(  # noqa: F821
        back_populates="generation_session"
    )


class CourseGenerationExport(SQLModel, table=True):
    """Model for tracking exported course generation sessions."""

    __tablename__ = "course_generation_export"

    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(foreign_key="course_generation_session.id", index=True)

    # Export details
    format: str  # 'pdf', 'docx', 'json', 'markdown'
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    download_count: int = 0

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_downloaded: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    # Relationships
    session: CourseGenerationSession = Relationship()
