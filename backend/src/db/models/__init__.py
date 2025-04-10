"""Initialize database models and handle circular imports."""

# Import all models in a way that avoids circular import issues
from typing import Dict, Type
from sqlmodel import SQLModel

# Import all model files - the imports themselves register the models
from .user import User, Guardian
from .content import Subject, Topic, Lesson, Course, CourseTopic, UserSubjectInterest
from .progress import Enrollment, Activity, Achievement
from .recommendations import Recommendation, ExplorationTopic
from .tutoring import (
    TutoringSession,
    DetailedTutoringSession,
    TutoringExchange,
    SessionResource,
)
from .communication import Notification, Message
from .community import StudySession, StudyGroup, StudyGroupMember, ForumPost, ForumReply

# Import school-related models
from .school import (
    School,
    Department,
    SchoolClass,
    SchoolStaff,
    DepartmentStaffAssignment,
    SchoolCourse,
    SchoolStudent,
    ClassEnrollment,
    CourseEnrollment,
    ClassSchedule,
    Assignment,
    AssignmentSubmission,
    LessonPlan,
    AttendanceRecord,
    SchoolAnnouncement,
)

# Import professor-related models
from .professor import (
    SchoolProfessor,
    ProfessorCourse,
    CourseMaterial,
)

# Also import CourseAITutoringSession model to fix relationships
from .tutoring_integration import CourseAITutoringSession

# Dictionary to store all model classes
models: Dict[str, Type[SQLModel]] = {}

# Expose all models in __all__ for star imports
__all__ = [
    # User models
    "User",
    "Guardian",
    # Content models
    "Subject",
    "Topic",
    "Lesson",
    "Course",
    "CourseTopic",
    "UserSubjectInterest",
    # Progress tracking models
    "Enrollment",
    "Activity",
    "Achievement",
    # AI Tutoring models
    "TutoringSession",
    "DetailedTutoringSession",
    "TutoringExchange",
    "SessionResource",
    "CourseAITutoringSession",
    # Recommendation models
    "Recommendation",
    "ExplorationTopic",
    # Communication models
    "Notification",
    "Message",
    # Community and social learning models
    "StudySession",
    "StudyGroup",
    "StudyGroupMember",
    "ForumPost",
    "ForumReply",
    # School models
    "School",
    "Department",
    "SchoolClass",
    "SchoolStaff",
    "DepartmentStaffAssignment",
    "SchoolCourse",
    "SchoolStudent",
    "ClassEnrollment",
    "CourseEnrollment",
    "ClassSchedule",
    "Assignment",
    "AssignmentSubmission",
    "LessonPlan",
    "AttendanceRecord",
    "SchoolAnnouncement",
    # Professor models
    "SchoolProfessor",
    "ProfessorCourse",
    "CourseMaterial",
]


# Verify that all models are properly loaded
def verify_models():
    """Verify that all expected models are loaded and registered."""
    missing_models = [model for model in __all__ if model not in globals()]
    if missing_models:
        raise ImportError(
            f"Failed to import the following models: {', '.join(missing_models)}"
        )


# Run verification when the module is imported
verify_models()
