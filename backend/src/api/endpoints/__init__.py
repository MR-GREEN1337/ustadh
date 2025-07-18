from fastapi import APIRouter

from src.api.endpoints.auth import router as auth_router
from src.api.endpoints.users import router as users_router
from src.api.endpoints.subjects import router as subjects_router
from src.api.endpoints.progress import router as progress_router
from src.api.endpoints.recommendations import router as recommendations_router
from src.api.endpoints.tutoring import router as tutoring_router
from src.api.endpoints.learning import router as learning_router
from src.api.endpoints.schools import router as schools_router
from src.api.endpoints.school_onboarding import router as school_onboarding_router
from src.api.endpoints.admin import router as admin_router
from src.api.endpoints.professors import router as professor_router
from src.api.endpoints.schedule import router as schedule_router
from src.api.endpoints.community import router as community_router
from src.api.endpoints.notes import router as notes_router
from src.api.endpoints.whiteboard import router as whiteboard_router
from src.api.endpoints.messaging import router as messaging_router
from src.api.endpoints.students import router as students_router
from src.api.endpoints.professor_school import router as professor_school_router
from src.api.endpoints.professor_insights import router as professor_insights_router
from src.api.endpoints.professor_ai import router as professor_ai_router
from src.api.endpoints.professor_assignments import (
    router as professor_assignments_router,
)
from src.api.endpoints.course_generator import router as course_generator_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(users_router)
router.include_router(subjects_router)
router.include_router(recommendations_router)
router.include_router(progress_router)
router.include_router(tutoring_router)
router.include_router(learning_router)
router.include_router(schools_router)
router.include_router(school_onboarding_router)
router.include_router(admin_router)
router.include_router(professor_router)
router.include_router(schedule_router)
router.include_router(community_router)
router.include_router(notes_router)
router.include_router(whiteboard_router)
router.include_router(messaging_router)
router.include_router(students_router)
router.include_router(professor_school_router)
router.include_router(professor_insights_router)
router.include_router(professor_ai_router)
router.include_router(professor_assignments_router)
router.include_router(course_generator_router)
