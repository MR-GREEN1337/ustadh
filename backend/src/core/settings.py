from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    DEBUG: bool = False
    FAIL_FAST: str = "true"
    ALLOWED_ORIGINS: List[str]
    ALLOWED_EXPOSED_HEADERS: List[str] = ["Session-Id", "Exchange-Id"]
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    FRONTEND_URL: str
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ENFORCE_ORIGIN_CHECK: bool = True
    MAX_FAILED_LOGIN_ATTEMPTS: int = 10
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    DEFAULT_LLM_PROVIDER: str = "groq" if ENVIRONMENT == "development" else "openai"
    DEFAULT_LLM_MODEL: str = "llama3-70b-8192"  # "gpt-4o-mini"
    DEFAULT_OPENAI_MODEL: str = "gpt-4o-mini"
    DEFAULT_GROQ_MODEL: str = "llama3-8b-8192"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSION: str = "1536"
    OPENAI_API_KEY: str
    GROQ_API_KEY: str

    RESEND_API_KEY: str

    POSTGRES_DATABASE_URL: str
    POSTGRES_USE_SSL: bool = True
    POSTGRES_POOL_SIZE: int = 10
    POSTGRES_MAX_OVERFLOW: int = 10
    POSTGRES_POOL_TIMEOUT: int = 30

    MIN_PASSWORD_LENGTH: int = 8
    MAX_PASSWORD_LENGTH: int = 128

    # AWS
    AWS_ACCESS_KEY: str
    AWS_SECRET_KEY: str
    AWS_REGION: str
    S3_BUCKET_NAME: str

    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_DEFAULT: str = "100/minute"

    # Qdrant settings
    QDRANT_HOST: str
    QDRANT_API_KEY: str


settings = Settings()
