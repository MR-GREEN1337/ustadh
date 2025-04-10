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
