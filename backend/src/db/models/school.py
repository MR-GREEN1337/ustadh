from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlmodel import Field, SQLModel, Relationship, JSON


class School(SQLModel, table=True):
    """Model for schools integrating with the platform."""

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    code: str = Field(index=True, unique=True)  # Unique identifier for the school

    # School details
    address: str
    city: str
    region: str = Field(index=True)
    school_type: str = Field(index=True)  # public, private, mission, international
    education_levels: List[str] = Field(
        default=[], sa_type=JSON
    )  # primary, college, lycee, university

    # Contact information
    contact_email: str
    contact_phone: str
    website: Optional[str] = None

    # Administrative details
    admin_user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    is_active: bool = True
    subscription_type: str = "basic"  # basic, premium, enterprise
    subscription_expires: Optional[datetime] = None

    # Branding
    logo_url: Optional[str] = None
    color_scheme: Optional[str] = None

    # Integration settings
    integration_settings: Dict[str, Any] = Field(default={}, sa_type=JSON)
    api_key: Optional[str] = None

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Relationships
    departments: List["Department"] = Relationship(back_populates="school")
    school_classes: List["SchoolClass"] = Relationship(back_populates="school")
    staff_members: List["SchoolStaff"] = Relationship(back_populates="school")
    school_courses: List["SchoolCourse"] = Relationship(back_populates="school")
    students: List["SchoolStudent"] = Relationship(back_populates="school")


class Department(SQLModel, table=True):
    """Model for academic departments within a school."""

    id: Optional[int] = Field(default=None, primary_key=True)
    school_id: int = Field(foreign_key="school.id", index=True)
    name: str
    code: str = Field(index=True)  # Department code

    # Department details
    description: Optional[str] = None
    education_level: Optional[str] = None  # primary, college, lycee, university

    # Administrative details
    head_staff_id: Optional[int] = Field(default=None, foreign_key="schoolstaff.id")

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Relationships
    school: School = Relationship(back_populates="departments")
    courses: List["SchoolCourse"] = Relationship(back_populates="department")
    staff_members: List["DepartmentStaffAssignment"] = Relationship(
        back_populates="department"
    )


class SchoolClass(SQLModel, table=True):
    """Model for classes/sections within a school."""

    id: Optional[int] = Field(default=None, primary_key=True)
    school_id: int = Field(foreign_key="school.id", index=True)
    name: str  # e.g., "Class 10A", "Section B"

    # Class details
    academic_year: str = Field(index=True)  # e.g., "2024-2025"
    education_level: str = Field(index=True)  # primary_1, bac_2, etc.
    academic_track: Optional[str] = Field(
        default=None, index=True
    )  # sciences_math_a, etc.

    # Class information
    room_number: Optional[str] = None
    capacity: Optional[int] = None

    # Administrative details
    homeroom_teacher_id: Optional[int] = Field(
        default=None, foreign_key="schoolstaff.id"
    )

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Relationships
    school: School = Relationship(back_populates="school_classes")
    students: List["ClassEnrollment"] = Relationship(back_populates="school_class")
    class_schedules: List["ClassSchedule"] = Relationship(back_populates="school_class")


class SchoolStaff(SQLModel, table=True):
    """Model for staff members (teachers, administrators) at a school."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    school_id: int = Field(foreign_key="school.id", index=True)

    # Staff details
    staff_type: str = Field(index=True)  # teacher, admin, counselor, principal
    employee_id: Optional[str] = None

    # Teacher-specific fields
    is_teacher: bool = Field(default=False, index=True)
    qualifications: List[str] = Field(default=[], sa_type=JSON)
    expertise_subjects: List[str] = Field(default=[], sa_type=JSON)

    # Administrative
    hire_date: Optional[datetime] = None
    is_active: bool = True

    # Contact details
    work_email: Optional[str] = None
    work_phone: Optional[str] = None

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Relationships
    user: "User" = Relationship()  # Link to main user account # noqa: F821
    school: School = Relationship(back_populates="staff_members")
    department_assignments: List["DepartmentStaffAssignment"] = Relationship(
        back_populates="staff_member"
    )
    taught_courses: List["SchoolCourse"] = Relationship(back_populates="teacher")
    class_schedules: List["ClassSchedule"] = Relationship(back_populates="teacher")


class DepartmentStaffAssignment(SQLModel, table=True):
    """Model for assigning staff to departments."""

    id: Optional[int] = Field(default=None, primary_key=True)
    department_id: int = Field(foreign_key="department.id", index=True)
    staff_id: int = Field(foreign_key="schoolstaff.id", index=True)

    # Assignment details
    role: str  # member, coordinator, head
    is_primary: bool = False

    # Timestamps
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Relationships
    department: Department = Relationship(back_populates="staff_members")
    staff_member: SchoolStaff = Relationship(back_populates="department_assignments")


class SchoolCourse(SQLModel, table=True):
    """Enhanced model for school courses with AI tutoring integration."""

    id: Optional[int] = Field(default=None, primary_key=True)
    school_id: int = Field(foreign_key="school.id", index=True)
    department_id: Optional[int] = Field(
        default=None, foreign_key="department.id", index=True
    )
    platform_course_id: Optional[int] = Field(default=None, foreign_key="course.id")
    teacher_id: Optional[int] = Field(default=None, foreign_key="schoolstaff.id")

    # Course details
    title: str
    code: str  # School's course code
    description: str

    # Academic information
    academic_year: str = Field(index=True)
    education_level: str = Field(index=True)
    academic_track: Optional[str] = Field(default=None, index=True)
    credits: Optional[float] = None

    # Course Structure
    syllabus: Dict[str, Any] = Field(default={}, sa_type=JSON)
    learning_objectives: List[str] = Field(default=[], sa_type=JSON)
    prerequisites: List[str] = Field(default=[], sa_type=JSON)

    # AI Tutoring Integration
    ai_tutoring_enabled: bool = True
    ai_tutoring_config: Dict[str, Any] = Field(default={}, sa_type=JSON)
    suggested_topics: List[str] = Field(default=[], sa_type=JSON)

    # Course Materials
    required_materials: Dict[str, Any] = Field(default={}, sa_type=JSON)
    supplementary_resources: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Assessment Configuration
    grading_schema: Dict[str, Any] = Field(default={}, sa_type=JSON)
    assessment_types: List[str] = Field(default=[], sa_type=JSON)

    # Collaboration Settings
    allow_group_work: bool = True
    peer_review_enabled: bool = False
    discussion_enabled: bool = True

    # Status and Schedule
    status: str = "active"  # draft, active, archived
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Relationships
    teacher: Optional["SchoolStaff"] = Relationship(back_populates="taught_courses")  # noqa: F821
    school: "School" = Relationship(back_populates="school_courses")  # noqa: F821
    department: Optional["Department"] = Relationship(back_populates="courses")  # noqa: F821
    platform_course: Optional["Course"] = Relationship()  # noqa: F821
    professors: List["ProfessorCourse"] = Relationship(back_populates="course")  # noqa: F821
    class_schedules: List["ClassSchedule"] = Relationship(back_populates="course")  # noqa: F821
    course_enrollments: List["CourseEnrollment"] = Relationship(back_populates="course")  # noqa: F821
    assignments: List["Assignment"] = Relationship(back_populates="course")  # noqa: F821
    materials: List["CourseMaterial"] = Relationship()  # noqa: F821
    tutoring_sessions: List["CourseAITutoringSession"] = Relationship(  # noqa: F821
        back_populates="course"
    )


class SchoolStudent(SQLModel, table=True):
    """Model for students enrolled in a school."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    school_id: int = Field(foreign_key="school.id", index=True)

    # Student details
    student_id: str  # School's ID for the student
    enrollment_date: datetime

    # Academic information
    education_level: str = Field(index=True)  # primary_1, bac_2, etc.
    academic_track: Optional[str] = Field(default=None, index=True)

    # Status
    is_active: bool = True
    graduation_year: Optional[str] = None

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Relationships
    user: "User" = Relationship()  # Link to main user account # noqa: F821
    school: School = Relationship(back_populates="students")
    class_enrollments: List["ClassEnrollment"] = Relationship(back_populates="student")
    course_enrollments: List["CourseEnrollment"] = Relationship(
        back_populates="student"
    )
    assignment_submissions: List["AssignmentSubmission"] = Relationship(
        back_populates="student"
    )


class ClassEnrollment(SQLModel, table=True):
    """Model for student enrollment in classes."""

    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="schoolstudent.id", index=True)
    class_id: int = Field(foreign_key="schoolclass.id", index=True)

    # Enrollment details
    academic_year: str = Field(index=True)  # e.g., "2024-2025"
    enrollment_date: datetime = Field(default_factory=datetime.utcnow)

    # Status
    status: str = "active"  # active, inactive, transferred, graduated

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Relationships
    student: SchoolStudent = Relationship(back_populates="class_enrollments")
    school_class: SchoolClass = Relationship(back_populates="students")


class CourseEnrollment(SQLModel, table=True):
    """Model for student enrollment in school courses."""

    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="schoolstudent.id", index=True)
    course_id: int = Field(foreign_key="schoolcourse.id", index=True)

    # Enrollment details
    academic_year: str = Field(index=True)  # e.g., "2024-2025"
    enrollment_date: datetime = Field(default_factory=datetime.utcnow)

    # Performance tracking
    grade: Optional[float] = None
    grade_letter: Optional[str] = None
    attendance_percentage: Optional[float] = None

    # Status
    status: str = "enrolled"  # enrolled, completed, dropped, failed
    completion_date: Optional[datetime] = None

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Relationships
    student: SchoolStudent = Relationship(back_populates="course_enrollments")
    course: SchoolCourse = Relationship(back_populates="course_enrollments")


class ClassSchedule(SQLModel, table=True):
    """Model for class schedules and timetables."""

    id: Optional[int] = Field(default=None, primary_key=True)
    class_id: int = Field(foreign_key="schoolclass.id", index=True)
    course_id: int = Field(foreign_key="schoolcourse.id", index=True)
    teacher_id: int = Field(foreign_key="schoolstaff.id", index=True)

    # Schedule details
    day_of_week: int  # 0-6 (Monday-Sunday)
    start_time: str  # HH:MM format
    end_time: str  # HH:MM format
    room: Optional[str] = None

    # Recurring pattern
    recurrence_pattern: str = "weekly"  # weekly, biweekly, once
    start_date: datetime
    end_date: Optional[datetime] = None

    # Status
    is_active: bool = True

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Relationships
    school_class: SchoolClass = Relationship(back_populates="class_schedules")
    course: SchoolCourse = Relationship(back_populates="class_schedules")
    teacher: SchoolStaff = Relationship(back_populates="class_schedules")


class Assignment(SQLModel, table=True):
    """Model for assignments given to students."""

    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="schoolcourse.id", index=True)
    professor_id: Optional[int] = Field(default=None, foreign_key="schoolprofessor.id")

    # Assignment details
    title: str
    description: str
    assignment_type: str  # homework, project, quiz, exam

    # Timeframe
    assigned_date: datetime = Field(default_factory=datetime.utcnow)
    due_date: datetime

    # Grading
    points_possible: float
    grading_criteria: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Content
    instructions: str
    materials: Dict[str, Any] = Field(default={}, sa_type=JSON)
    resources: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Status
    is_published: bool = True

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Relationships
    course: "SchoolCourse" = Relationship(back_populates="assignments")  # noqa: F821
    submissions: List["AssignmentSubmission"] = Relationship(
        back_populates="assignment"
    )  # noqa: F821
    professor: Optional["SchoolProfessor"] = Relationship(back_populates="assignments")  # noqa: F821


class AssignmentSubmission(SQLModel, table=True):
    """Model for student submissions to assignments."""

    id: Optional[int] = Field(default=None, primary_key=True)
    assignment_id: int = Field(foreign_key="assignment.id", index=True)
    student_id: int = Field(foreign_key="schoolstudent.id", index=True)

    # Submission details
    submission_date: datetime = Field(default_factory=datetime.utcnow)
    content: Dict[str, Any] = Field(
        sa_type=JSON
    )  # Flexible storage for various submission types

    # Status
    status: str = "submitted"  # draft, submitted, graded, returned

    # Grading
    grade: Optional[float] = None
    feedback: Optional[str] = None
    graded_by: Optional[int] = Field(default=None, foreign_key="schoolstaff.id")
    graded_at: Optional[datetime] = None

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Relationships
    assignment: Assignment = Relationship(back_populates="submissions")
    student: SchoolStudent = Relationship(back_populates="assignment_submissions")


# Additional models to enhance school integration


class LessonPlan(SQLModel, table=True):
    """Model for teacher lesson plans."""

    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="schoolcourse.id", index=True)
    teacher_id: int = Field(foreign_key="schoolstaff.id", index=True)

    # Lesson details
    title: str
    description: str
    objectives: List[str] = Field(default=[], sa_type=JSON)

    # Content
    content: Dict[str, Any] = Field(default={}, sa_type=JSON)
    resources: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Scheduling
    planned_date: Optional[datetime] = None
    duration_minutes: int

    # Status
    status: str = "draft"  # draft, ready, delivered, archived

    # AI integration
    ai_enhanced: bool = False
    ai_contributions: Dict[str, Any] = Field(default={}, sa_type=JSON)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class AttendanceRecord(SQLModel, table=True):
    """Model for tracking student attendance."""

    id: Optional[int] = Field(default=None, primary_key=True)
    class_id: int = Field(foreign_key="schoolclass.id", index=True)
    student_id: int = Field(foreign_key="schoolstudent.id", index=True)

    # Attendance details
    date: datetime = Field(index=True)
    status: str  # present, absent, late, excused

    # Additional information
    notes: Optional[str] = None
    recorded_by: Optional[int] = Field(default=None, foreign_key="schoolstaff.id")

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class SchoolAnnouncement(SQLModel, table=True):
    """Model for school-wide or department-specific announcements."""

    id: Optional[int] = Field(default=None, primary_key=True)
    school_id: int = Field(foreign_key="school.id", index=True)
    department_id: Optional[int] = Field(default=None, foreign_key="department.id")

    # Announcement details
    title: str
    content: str

    # Publishing details
    published_by: int = Field(foreign_key="schoolstaff.id")
    published_at: datetime = Field(default_factory=datetime.utcnow)

    # Target audience
    audience_type: str  # all, staff, students, parents, department
    target_classes: List[int] = Field(default=[], sa_type=JSON)

    # Display settings
    priority: str = "normal"  # low, normal, high, urgent
    expires_at: Optional[datetime] = None

    # Status
    is_published: bool = True

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
