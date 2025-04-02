from sqlmodel import SQLModel, Session, create_engine
from src.core.settings import settings

# Create PostgreSQL connection URL
DATABASE_URL = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    echo=settings.DEBUG,  # Log SQL queries only if DEBUG mode is enabled
    pool_pre_ping=True,  # Verify the connection before using it
)


def create_db_and_tables():
    """Create database tables if they don't exist."""
    # Import all models to ensure they're registered with SQLModel

    SQLModel.metadata.create_all(engine)


def get_session():
    """
    Dependency for FastAPI to get a database session.
    Usage in endpoints:
    ```
    @app.get("/some-endpoint")
    def some_endpoint(session: Session = Depends(get_session)):
        # Use session here
    ```
    """
    with Session(engine) as session:
        yield session
