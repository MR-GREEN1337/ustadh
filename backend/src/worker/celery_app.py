from celery import Celery
from src.core.settings import settings
import logging

# Configure logging
logger = logging.getLogger("celery")

# Create celery instance
celery_app = Celery(
    "edtech_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "src.worker.tasks.tutoring",
        "src.worker.tasks.school",
        "src.worker.tasks.content",
        "src.worker.tasks.analytics",
        "src.worker.tasks.notifications",
    ],
)

# Optional configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour task timeout
    worker_max_tasks_per_child=200,  # Restart worker after 200 tasks
    broker_connection_retry_on_startup=True,
)

# Configure periodic tasks (Celery Beat)
celery_app.conf.beat_schedule = {
    "send-daily-progress-reports": {
        "task": "src.worker.tasks.notifications.send_daily_progress_reports",
        "schedule": 86400.0,  # Daily
    },
    "update-user-recommendations": {
        "task": "src.worker.tasks.analytics.update_user_recommendations",
        "schedule": 43200.0,  # Every 12 hours
    },
    "cleanup-expired-sessions": {
        "task": "src.worker.tasks.tutoring.cleanup_expired_sessions",
        "schedule": 3600.0,  # Hourly
    },
}
