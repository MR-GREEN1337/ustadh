from contextlib import asynccontextmanager
from fastapi import FastAPI
from loguru import logger
import time
import sys
import os

from src.db.postgresql import postgres_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI application.
    Handles startup and shutdown events with robust error handling.
    """
    start_time = time.time()

    # Configure logger based on environment
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    logger.remove()
    logger.add(
        sys.stderr,
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {module}:{function}:{line} - {message}",
        level=log_level,
    )

    # Display application startup information
    logger.info(
        f"Starting application in {os.getenv('ENVIRONMENT', 'development')} mode"
    )
    logger.info(f"API Version: {app.version}")

    # Startup: Initialize database connection
    logger.info("Starting up application and connecting to database...")
    try:
        # Try to connect to the database with retry logic
        await postgres_db.create_db_and_tables()

        # Log successful database connection
        startup_duration = time.time() - start_time
        logger.info(
            f"Database connection established successfully in {startup_duration:.2f} seconds"
        )

        # Add database info to app state for health check endpoints
        app.state.db = postgres_db

    except Exception as e:
        # Log detailed error information
        logger.error(f"Failed to initialize database: {str(e)}")

        if os.getenv("FAIL_FAST", "true").lower() in ("true", "1", "yes"):
            # In production, we might want to fail fast
            logger.critical(
                "Application startup failed due to database connection error. Exiting."
            )
            # We intentionally re-raise to prevent app from starting with DB issues
            raise
        else:
            # In development, we might want to continue without DB
            logger.warning(
                "Application continuing without database connection. "
                "Some endpoints may not function correctly."
            )
            app.state.db_available = False
    else:
        app.state.db_available = True

    # Application is now running
    logger.info(
        f"Application startup completed in {time.time() - start_time:.2f} seconds"
    )
    yield

    # Shutdown: Clean up resources
    logger.info("Shutting down application and cleaning up resources...")
    shutdown_start = time.time()

    # Add any specific shutdown logic here
    # No explicit database cleanup needed as sessions are managed with context managers

    logger.info(
        f"Application shutdown completed in {time.time() - shutdown_start:.2f} seconds"
    )
