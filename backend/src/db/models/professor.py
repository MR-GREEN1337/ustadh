from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, JSON


class SchoolProfessor(SQLModel, table=True):
    """Enhanced model for professors with school integration."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    school_id: int = Field(foreign_key="school.id", index=True)

    # Academic Profile
    title: str  # Prof., Dr., etc.
    department_id: Optional[int] = Field(default=None, foreign_key="department.id")
    specializations: List[str] = Field(default=[], sa_type=JSON)
    academic_rank: str  # Assistant Professor, Associate Professor, etc.
    tenure_status: Optional[str] = None

    # Teaching Details
    teaching_languages: List[str] = Field(default=[], sa_type=JSON)
    preferred_subjects: List[str] = Field(default=[], sa_type=JSON)
    education_levels: List[str] = Field(default=[], sa_type=JSON)

    # Contact & Availability
    office_location: Optional[str] = None
    office_hours: Dict[str, Any] = Field(default={}, sa_type=JSON)
    contact_preferences: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Platform Integration
    ai_collaboration_preferences: Dict[str, Any] = Field(default={}, sa_type=JSON)
    tutoring_availability: bool = True
    max_students: Optional[int] = None

    # Onboarding Status
    has_completed_onboarding: bool = Field(default=False)
    onboarding_started_at: Optional[datetime] = None
    onboarding_completed_at: Optional[datetime] = None
    onboarding_step: Optional[str] = Field(
        default="profile",
        description="Current onboarding step: profile, expertise, availability, courses, teaching_materials",
    )
    onboarding_progress: int = Field(
        default=0, description="Progress percentage (0-100)"
    )

    # Timestamps
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    last_active: Optional[datetime] = None

    # Status
    is_active: bool = True
    account_status: str = "active"  # active, inactive, on_leave

    # Metadata
    meta_data: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Relationships
    user: "User" = Relationship()  # noqa: F821
    school: "School" = Relationship()  # noqa: F821
    department: Optional["Department"] = Relationship()  # noqa: F821
    courses: List["ProfessorCourse"] = Relationship(back_populates="professor")  # noqa: F821
    course_materials: List["CourseMaterial"] = Relationship(back_populates="professor")  # noqa: F821
    assignments: List["Assignment"] = Relationship(back_populates="professor")  # noqa: F821


class ProfessorCourse(SQLModel, table=True):
    """Model for managing professor-course relationships and responsibilities."""

    id: Optional[int] = Field(default=None, primary_key=True)
    professor_id: int = Field(foreign_key="schoolprofessor.id", index=True)
    course_id: int = Field(foreign_key="schoolcourse.id", index=True)

    # Role and Responsibilities
    role: str = "primary"  # primary, secondary, guest, advisor
    responsibilities: List[str] = Field(default=[], sa_type=JSON)

    # Time Period
    academic_year: str = Field(index=True)
    semester: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None

    # Course Customization
    custom_syllabus: Optional[Dict[str, Any]] = Field(default=None, sa_type=JSON)
    teaching_notes: Optional[Dict[str, Any]] = Field(default=None, sa_type=JSON)

    # Status
    status: str = "active"  # active, completed, planned

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Relationships
    professor: SchoolProfessor = Relationship(back_populates="courses")
    course: "SchoolCourse" = Relationship(back_populates="professors")  # noqa: F821


class CourseMaterial(SQLModel, table=True):
    """Model for managing course materials and resources."""

    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="schoolcourse.id", index=True)
    professor_id: int = Field(foreign_key="schoolprofessor.id", index=True)

    # Material Details
    title: str
    description: str
    material_type: str  # lecture_notes, presentation, worksheet, example, reference

    # Content - for text-based materials or JSON structured content
    content: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # File association - link to UserFile
    file_id: Optional[int] = Field(default=None, foreign_key="user_files.id")

    # Organization
    unit: Optional[str] = None
    sequence: Optional[int] = None
    tags: List[str] = Field(default=[], sa_type=JSON)

    # Access Control
    visibility: str = "students"  # students, professors, public
    requires_completion: bool = False

    # AI Integration
    ai_enhanced: bool = False
    ai_features: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Relationships
    course: "SchoolCourse" = Relationship(back_populates="materials")  # noqa: F821
    professor: SchoolProfessor = Relationship(back_populates="course_materials")  # noqa: F821
    file: Optional["UserFile"] = Relationship()  # One-way reference # noqa: F821
