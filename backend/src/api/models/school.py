from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, validator


class SchoolCreate(BaseModel):
    """Schema for creating a new school."""

    name: str = Field(..., description="School name")
    code: str = Field(..., description="Unique school code for identification")
    address: str = Field(default="", description="School address")
    city: str = Field(default="", description="School city")
    region: str = Field(..., description="School region")
    school_type: str = Field(
        ..., description="School type (public, private, mission, international)"
    )
    education_levels: List[str] = Field(
        default=[],
        description="Education levels offered (primary, college, lycee, university)",
    )
    contact_email: EmailStr = Field(..., description="School contact email")
    contact_phone: str = Field(default="", description="School contact phone")
    website: Optional[str] = Field(default=None, description="School website URL")

    @validator("school_type")
    def validate_school_type(cls, v):
        valid_types = ["public", "private", "mission", "international"]
        if v not in valid_types:
            raise ValueError(f"School type must be one of: {', '.join(valid_types)}")
        return v

    @validator("education_levels")
    def validate_education_levels(cls, v):
        valid_levels = ["primary", "college", "lycee", "university"]
        for level in v:
            if level not in valid_levels:
                raise ValueError(
                    f"Education level must be one of: {', '.join(valid_levels)}"
                )
        return v

    @validator("code")
    def validate_code(cls, v):
        if len(v) < 3:
            raise ValueError("School code must be at least 3 characters")
        return v


class SchoolResponse(BaseModel):
    """Schema for school response."""

    id: int
    name: str
    code: str
    address: str
    city: str
    region: str
    school_type: str
    education_levels: List[str]
    contact_email: str
    contact_phone: str
    website: Optional[str]
    is_active: bool
    subscription_type: str
    admin_user_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True


class AdminLinkRequest(BaseModel):
    """Schema for linking an admin to a school."""

    admin_id: int = Field(..., description="ID of the user to set as school admin")


class SchoolUserResponse(BaseModel):
    """Schema for user data in admin dashboard"""

    id: int
    user_id: int
    full_name: str
    email: str
    username: str
    user_type: str
    is_active: bool
    created_at: Optional[str] = None

    # Student-specific fields
    student_id: Optional[str] = None
    education_level: Optional[str] = None
    academic_track: Optional[str] = None
    enrollment_date: Optional[datetime] = None

    # Teacher-specific fields
    staff_type: Optional[str] = None
    expertise_subjects: Optional[List[str]] = None
    qualifications: Optional[List[str]] = None
    hire_date: Optional[datetime] = None


class UserListResponse(BaseModel):
    """Schema for paginated user list response"""

    users: List[Dict[str, Any]]
    total: int
    page: int
    totalPages: int


class CourseResponse(BaseModel):
    """Schema for course data in admin dashboard"""

    id: int
    title: str
    code: str
    description: str
    academic_year: str
    education_level: str
    academic_track: Optional[str] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    teacher_id: Optional[int] = None
    teacher_name: Optional[str] = None
    status: str
    students_count: int
    ai_tutoring_enabled: bool


class CourseListResponse(BaseModel):
    """Schema for paginated course list response"""

    courses: List[Dict[str, Any]]
    total: int
    page: int
    totalPages: int


class DepartmentResponse(BaseModel):
    """Schema for department data in admin dashboard"""

    id: int
    name: str
    code: str
    description: Optional[str] = None
    education_level: Optional[str] = None
    staff_count: int
    courses_count: int


class ClassResponse(BaseModel):
    """Schema for class data in admin dashboard"""

    id: int
    name: str
    academic_year: str
    education_level: str
    academic_track: Optional[str] = None
    homeroom_teacher_name: Optional[str] = None
    students_count: int


class ClassListResponse(BaseModel):
    """Schema for paginated class list response"""

    classes: List[Dict[str, Any]]
    total: int
    page: int
    totalPages: int


class RecentActivity(BaseModel):
    """Schema for recent activity in admin dashboard"""

    id: int
    type: str
    description: str
    time: str
    details: Optional[Dict[str, Any]] = None


class SystemStatus(BaseModel):
    """Schema for system status in admin dashboard"""

    serverStatus: str
    databaseStatus: str
    aiServicesStatus: str
    storageUsage: str
    latestUpdates: List[str]


class SchoolStatsResponse(BaseModel):
    """Schema for school statistics"""

    staffCount: int
    studentCount: int
    classCount: int
    departmentCount: int
    courseCount: int
    recentActivity: int


class ActivityLogResponse(BaseModel):
    """Schema for activity log"""

    activities: List[Dict[str, Any]]
    total: int
    page: int
    totalPages: int


class SchoolSettingsUpdate(BaseModel):
    """Schema for updating school settings"""

    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    color_scheme: Optional[str] = None
    subscription_type: Optional[str] = None


class SystemSettingsUpdate(BaseModel):
    """Schema for updating system settings"""

    ai_tutoring_enabled: Optional[bool] = None
    peer_review_enabled: Optional[bool] = None
    discussion_enabled: Optional[bool] = None
    api_key: Optional[str] = None
    integration_settings: Optional[Dict[str, Any]] = None


class StudentCreate(BaseModel):
    """Schema for creating a new student"""

    email: EmailStr
    username: str
    password: str
    full_name: str
    student_id: str
    education_level: str
    academic_track: Optional[str] = None
    enrollment_date: datetime = Field(default_factory=datetime.utcnow)


class TeacherCreate(BaseModel):
    """Schema for creating a new teacher"""

    email: EmailStr
    username: str
    password: str
    full_name: str
    staff_type: str = "teacher"
    is_teacher: bool = True
    expertise_subjects: List[str]
    department_id: Optional[int] = None
    qualifications: Optional[List[str]] = None


class CourseCreate(BaseModel):
    """Schema for creating a new course"""

    title: str
    code: str
    description: str
    department_id: Optional[int] = None
    teacher_id: Optional[int] = None
    academic_year: str
    education_level: str
    academic_track: Optional[str] = None
    ai_tutoring_enabled: bool = True
    status: str = "active"
    syllabus: Optional[Dict[str, Any]] = None
    learning_objectives: Optional[List[str]] = None


# New models for professor-related endpoints


class ProfessorResponse(BaseModel):
    """Schema for professor details"""

    id: int
    user_id: int
    school_id: int
    title: str
    department_id: Optional[int] = None
    specializations: List[str]
    academic_rank: str
    tenure_status: Optional[str] = None
    teaching_languages: List[str]
    preferred_subjects: List[str]
    education_levels: List[str]
    office_location: Optional[str] = None
    office_hours: Dict[str, Any]
    contact_preferences: Dict[str, Any]
    ai_collaboration_preferences: Dict[str, Any]
    tutoring_availability: bool
    max_students: Optional[int] = None
    joined_at: datetime
    last_active: Optional[datetime] = None
    is_active: bool
    account_status: str
    meta_data: Dict[str, Any]

    # Include foreign key relationships
    department: Optional[Dict[str, Any]] = None
    user: Dict[str, Any]

    class Config:
        from_attributes = True


class ProfessorProfileUpdate(BaseModel):
    """Schema for updating professor profile"""

    title: Optional[str] = None
    specializations: Optional[List[str]] = None
    office_location: Optional[str] = None
    office_hours: Optional[Dict[str, Any]] = None
    teaching_languages: Optional[List[str]] = None
    preferred_subjects: Optional[List[str]] = None
    contact_preferences: Optional[Dict[str, Any]] = None
    ai_collaboration_preferences: Optional[Dict[str, Any]] = None
    tutoring_availability: Optional[bool] = None
    max_students: Optional[int] = None


class AssignmentResponse(BaseModel):
    """Schema for assignment details"""

    id: int
    course_id: int
    professor_id: Optional[int] = None
    title: str
    description: str
    assignment_type: str
    assigned_date: datetime
    due_date: datetime
    points_possible: float
    grading_criteria: Dict[str, Any]
    instructions: str
    materials: Dict[str, Any]
    resources: Dict[str, Any]
    is_published: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Additional fields for API response
    course_title: Optional[str] = None
    professor_name: Optional[str] = None
    submission_count: Optional[int] = None
    graded_count: Optional[int] = None

    class Config:
        orm_mode = True


class AssignmentCreate(BaseModel):
    """Schema for creating a new assignment"""

    course_id: int
    title: str
    description: str
    assignment_type: str
    due_date: datetime
    points_possible: float
    instructions: str
    grading_criteria: Optional[Dict[str, Any]] = None
    materials: Optional[Dict[str, Any]] = None
    resources: Optional[Dict[str, Any]] = None
    is_published: bool = True


class CourseMaterialResponse(BaseModel):
    """Schema for course material details"""

    id: int
    course_id: int
    professor_id: int
    title: str
    description: str
    material_type: str
    content: Dict[str, Any]
    unit: Optional[str] = None
    sequence: Optional[int] = None
    tags: List[str]
    visibility: str
    requires_completion: bool
    ai_enhanced: bool
    ai_features: Dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Additional fields for API response
    professor_name: Optional[str] = None
    course_title: Optional[str] = None

    class Config:
        orm_mode = True


class CourseMaterialCreate(BaseModel):
    """Schema for creating a new course material"""

    course_id: int
    title: str
    description: str
    material_type: str
    content: Dict[str, Any]
    unit: Optional[str] = None
    sequence: Optional[int] = None
    tags: Optional[List[str]] = Field(default=[])
    visibility: str = "students"
    requires_completion: bool = False
    ai_enhanced: bool = False
    ai_features: Optional[Dict[str, Any]] = Field(default={})


class StudentResponse(BaseModel):
    """Schema for student details"""

    id: int
    user_id: int
    school_id: int
    student_id: str
    enrollment_date: datetime
    education_level: str
    academic_track: Optional[str] = None
    is_active: bool
    graduation_year: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Additional fields for API response
    user: Dict[str, Any]
    class_enrollments: Optional[List[Dict[str, Any]]] = None
    course_enrollments: Optional[List[Dict[str, Any]]] = None

    class Config:
        orm_mode = True


class StaffResponse(BaseModel):
    """Schema for staff member details"""

    id: int
    user_id: int
    school_id: int
    staff_type: str
    employee_id: Optional[str] = None
    is_teacher: bool
    qualifications: List[str]
    expertise_subjects: List[str]
    hire_date: Optional[datetime] = None
    is_active: bool
    work_email: Optional[str] = None
    work_phone: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Additional fields for API response
    user: Dict[str, Any]
    department_assignments: Optional[List[Dict[str, Any]]] = None

    class Config:
        orm_mode = True


class DepartmentStaffResponse(BaseModel):
    """Schema for department staff assignment details"""

    id: int
    department_id: int
    staff_id: int
    role: str
    is_primary: bool
    assigned_at: datetime
    updated_at: Optional[datetime] = None

    # Relations
    department: Dict[str, Any]
    staff_member: Dict[str, Any]

    class Config:
        orm_mode = True


class DepartmentCreate(BaseModel):
    """Schema for creating a new department"""

    name: str
    code: str
    description: Optional[str] = None
    education_level: Optional[str] = None
    head_staff_id: Optional[int] = None


class ClassCreateUpdate(BaseModel):
    """Schema for creating or updating a class"""

    name: str
    academic_year: str
    education_level: str
    academic_track: Optional[str] = None
    room_number: Optional[str] = None
    capacity: Optional[int] = None
    homeroom_teacher_id: Optional[int] = None
