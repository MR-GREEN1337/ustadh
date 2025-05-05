from typing import List, Optional, Dict, Any
from pydantic import BaseModel

# Base models and components


class GradingCriteriaItem(BaseModel):
    """Grading criteria item with name, description and points"""

    name: str
    description: str
    points: float


class QuizQuestion(BaseModel):
    """Quiz question model"""

    id: Optional[int] = None
    question: str
    questionType: (
        str  # 'multiple_choice', 'true_false', 'short_answer', 'essay', 'matching'
    )
    options: Optional[List[str]] = None
    correctAnswer: Optional[Any] = None  # string, list of strings, or dict for matching
    points: float


class AssignmentMaterial(BaseModel):
    """Material attached to an assignment"""

    id: int
    fileName: str
    fileUrl: str
    fileType: str
    size: int
    uploadedAt: str


class StudentInfo(BaseModel):
    """Student basic information"""

    id: int
    user_id: int
    full_name: str
    student_id: str
    education_level: str
    academic_track: Optional[str] = None


# Request models


class AssignmentCreate(BaseModel):
    """Request model for creating a new assignment"""

    title: str
    description: str
    assignment_type: str  # 'homework', 'quiz', 'exam', 'project', 'lab', 'discussion'
    course_id: int
    due_date: str  # ISO format date
    points_possible: float = 100
    instructions: str
    class_ids: Optional[List[int]] = None
    grading_criteria: Optional[List[GradingCriteriaItem]] = None
    material_ids: Optional[List[int]] = None
    status: Optional[str] = "draft"  # 'draft', 'published'


class AssignmentUpdate(BaseModel):
    """Request model for updating an assignment"""

    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None  # ISO format date
    points_possible: Optional[float] = None
    instructions: Optional[str] = None
    class_ids: Optional[List[int]] = None
    grading_criteria: Optional[List[GradingCriteriaItem]] = None
    material_ids: Optional[List[int]] = None
    status: Optional[str] = None  # 'draft', 'published'


class QuizCreate(AssignmentCreate):
    """Request model for creating a quiz assignment"""

    questions: List[QuizQuestion]
    time_limit: Optional[int] = None  # in minutes
    allow_multiple_attempts: Optional[bool] = False
    max_attempts: Optional[int] = 1
    shuffle_questions: Optional[bool] = False
    show_correct_answers: Optional[bool] = True
    passing_score: Optional[float] = 60


class GradeSubmissionRequest(BaseModel):
    """Request model for grading a submission"""

    submission_id: int
    grade: float
    feedback: Optional[str] = None
    criteria_grades: Optional[List[Dict[str, Any]]] = None


class BulkGradeRequest(BaseModel):
    """Request model for bulk grading submissions"""

    submission_ids: List[int]
    grade: float
    feedback: Optional[str] = None


class AIGenerateRequest(BaseModel):
    """Request model for generating an assignment with AI"""

    prompt: str
    course_id: int
    assignment_type: str  # 'homework', 'quiz', 'exam', 'project', 'lab', 'discussion'


# Response models


class AssignmentBase(BaseModel):
    """Base model for assignment responses"""

    id: int
    title: str
    description: str
    course_id: int
    course_name: str
    assignment_type: str
    due_date: str  # ISO format date
    points_possible: float
    status: str  # 'draft', 'published', 'closed', 'grading'
    created_at: str  # ISO format date
    updated_at: Optional[str] = None  # ISO format date
    instructions: str
    materials: List[Any]
    submission_count: int
    graded_count: int
    average_grade: Optional[float] = None
    content: Optional[Dict[str, Any]] = None


class AssignmentResponse(BaseModel):
    """Response model for single assignment operations"""

    assignment: AssignmentBase


class AssignmentsResponse(BaseModel):
    """Response model for listing assignments"""

    assignments: List[AssignmentBase]
    total: int
    page: int
    limit: int


class AssignmentDetailResponse(BaseModel):
    """Detailed assignment response model"""

    id: int
    title: str
    description: str
    course_id: int
    course_name: str
    assignment_type: str
    due_date: str
    points_possible: float
    status: str
    created_at: str
    updated_at: Optional[str] = None
    instructions: str
    materials: List[AssignmentMaterial]
    grading_criteria: Optional[List[GradingCriteriaItem]] = None
    class_ids: List[int]
    submission_count: int
    graded_count: int
    average_grade: Optional[float] = None
    content: Optional[Dict[str, Any]] = None


class SubmissionBase(BaseModel):
    """Base model for submission responses"""

    id: int
    assignment_id: int
    student_id: int
    student_name: str
    student_id_code: Optional[str] = None
    submission_date: str
    status: str  # 'submitted', 'late', 'graded', 'returned'
    grade: Optional[float] = None
    feedback: Optional[str] = None
    attachments: List[AssignmentMaterial]
    graded_at: Optional[str] = None
    graded_by: Optional[int] = None


class SubmissionsResponse(BaseModel):
    """Response model for listing submissions"""

    submissions: List[SubmissionBase]
    total: int
    page: int
    limit: int


class AssignmentSubmissionResponse(BaseModel):
    """Detailed submission response model"""

    id: int
    assignment_id: int
    student: StudentInfo
    submission_date: str
    status: str
    grade: Optional[float] = None
    feedback: Optional[str] = None
    attachments: List[AssignmentMaterial]
    content: Optional[Dict[str, Any]] = None
    graded_at: Optional[str] = None
    graded_by: Optional[int] = None
    grader_name: Optional[str] = None
    criteria_grades: Optional[List[Dict[str, Any]]] = None


class AssignmentStatsResponse(BaseModel):
    """Response model for assignment statistics"""

    assignment_id: int
    total_students: int
    submission_counts: Dict[str, int]  # total, submitted, graded, late, missing
    submission_rate: float  # percentage
    grade_stats: Dict[str, Any]  # count, average, median, min, max, distribution
    time_stats: Dict[str, Any]  # avg_time_to_grade, avg_time_to_submit


class AIGenerateResponse(BaseModel):
    """Response model for AI-generated assignment content"""

    title: str
    description: str
    instructions: str
    gradingCriteria: List[GradingCriteriaItem]
    questions: Optional[List[Dict[str, Any]]] = None
