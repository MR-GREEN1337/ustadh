"""Initialize database models and handle circular imports."""

# First import the models to make them available
from .user import User, Guardian
from .content import Subject, Topic, Lesson
from .progress import Enrollment, Activity, TutoringSession
from .recommendations import Recommendation
from .tutoring import (
    DetailedTutoringSession,  # Already renamed in the file
    TutoringExchange,
    SessionResource,
)

# Expose all models
__all__ = [
    "User",
    "Guardian",
    "Subject",
    "Topic",
    "Lesson",
    "Enrollment",
    "Activity",
    "TutoringSession",
    "Recommendation",
    "DetailedTutoringSession",  # Now correctly named
    "TutoringExchange",
    "SessionResource",
]
