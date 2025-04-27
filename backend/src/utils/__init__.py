from contextlib import asynccontextmanager
from fastapi import FastAPI
from loguru import logger
import time
import sys

from src.db.postgresql import postgres_db
from src.db.qdrant import QdrantClientWrapper
from src.core.ai.embeddings import EmbeddingModel
from src.core.llm import LLM
from src.core.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for FastAPI application.
    Handles startup and shutdown events with robust error handling.
    """
    start_time = time.time()

    # Configure logger based on environment
    log_level = "INFO"
    logger.remove()
    logger.add(
        sys.stderr,
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {module}:{function}:{line} - {message}",
        level=log_level,
    )

    # Display application startup information
    logger.info(f"Starting application in {settings.ENVIRONMENT} mode")
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
        app.state.db_available = True

    except Exception as e:
        # Log detailed error information
        logger.error(f"Failed to initialize database: {str(e)}")

        if settings.FAIL_FAST.lower() in ("true", "1", "yes"):
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

    # Initialize Qdrant for vector database
    logger.info("Initializing Qdrant vector database connection...")
    try:
        qdrant_client = QdrantClientWrapper(
            url=settings.QDRANT_HOST,
            api_key=settings.QDRANT_API_KEY,
        )
        await qdrant_client.init_client()

        # Add Qdrant client to app state
        app.state.qdrant_client = qdrant_client
        app.state.qdrant_available = True

        logger.info("Qdrant connection established successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Qdrant: {str(e)}")
        app.state.qdrant_available = False

        if settings.FAIL_FAST.lower() in ("true", "1", "yes"):
            # If fail-fast is enabled, raise the exception
            raise
        else:
            logger.warning(
                "Application continuing without Qdrant connection. "
                "Vector search features will not be available."
            )

    # Initialize Embedding Model
    logger.info("Initializing embedding model...")
    try:
        embedding_model = EmbeddingModel(model_name=settings.EMBEDDING_MODEL)
        await embedding_model.init_client()

        # Add embedding model to app state
        app.state.embedding_model = embedding_model
        app.state.embeddings_available = True

        logger.info(
            f"Embedding model initialized successfully: {embedding_model.model_name}"
        )
    except Exception as e:
        logger.error(f"Failed to initialize embedding model: {str(e)}")
        app.state.embeddings_available = False

        if settings.FAIL_FAST.lower() in ("true", "1", "yes"):
            # If fail-fast is enabled, raise the exception
            raise
        else:
            logger.warning(
                "Application continuing without embedding model. "
                "Features requiring embeddings will not be available."
            )

    # Initialize LLM client
    logger.info("Initializing LLM client...")
    try:
        # Use the existing LLM class from src.core.llm
        llm_provider = settings.DEFAULT_LLM_PROVIDER
        llm_client = LLM(provider=llm_provider)

        # Add LLM client to app state
        app.state.llm_client = llm_client
        app.state.llm_available = True

        logger.info(
            f"LLM client initialized successfully with provider: {llm_provider}"
        )
    except Exception as e:
        logger.error(f"Failed to initialize LLM client: {str(e)}")
        app.state.llm_available = False

        if settings.FAIL_FAST.lower() in ("true", "1", "yes"):
            # If fail-fast is enabled, raise the exception
            raise
        else:
            logger.warning(
                "Application continuing without LLM client. "
                "AI-powered features will not be available."
            )

    # Application is now running
    logger.info(
        f"Application startup completed in {time.time() - start_time:.2f} seconds"
    )
    yield

    # Shutdown: Clean up resources
    logger.info("Shutting down application and cleaning up resources...")
    shutdown_start = time.time()

    # Close Qdrant client if available
    if hasattr(app.state, "qdrant_client") and app.state.qdrant_available:
        try:
            await app.state.qdrant_client.close()
            logger.info("Qdrant client closed successfully")
        except Exception as e:
            logger.error(f"Error closing Qdrant client: {str(e)}")

    # Close LLM client if available
    if hasattr(app.state, "llm_client") and app.state.llm_available:
        try:
            await app.state.llm_client.close()
            logger.info("LLM client closed successfully")
        except Exception as e:
            logger.error(f"Error closing LLM client: {str(e)}")

    logger.info(
        f"Application shutdown completed in {time.time() - shutdown_start:.2f} seconds"
    )
