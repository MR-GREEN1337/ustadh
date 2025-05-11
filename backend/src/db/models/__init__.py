"""Initialize database models and handle circular imports."""

# Import all models in a way that avoids circular import issues
from typing import Dict, Type
from sqlmodel import SQLModel

# Import all model files - the imports themselves register the models
from .user import User, Guardian, UserFile
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
    ProfessorClassCourses,
)

# Import professor-related models
from .professor import (
    SchoolProfessor,
    ProfessorCourse,
    CourseMaterial,
)

# Import whiteboard models
from .whiteboard import WhiteboardSession, WhiteboardInteraction

# Import note-related models
from .notes import Note, NoteFolder, NoteCollaborator, AISuggestion

# Also import CourseAITutoringSession model to fix relationships
from .tutoring_integration import CourseAITutoringSession

from .flashcard import Flashcard

from .course_generation import CourseGenerationSession, CourseGenerationExport

# Dictionary to store all model classes
models: Dict[str, Type[SQLModel]] = {}

# Expose all models in __all__ for star imports
__all__ = [
    # User models
    "User",
    "UserFile",
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
    # Whiteboard models
    "WhiteboardSession",
    "WhiteboardInteraction",
    # Notes models
    "Note",
    "NoteFolder",
    "NoteCollaborator",
    "AISuggestion",
    # Flashcard models
    "Flashcard",
    "ProfessorClassCourses",
    "CourseGenerationSession",
    "CourseGenerationExport",
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
