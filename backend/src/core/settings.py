from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    DEBUG: bool = False
    ALLOWED_ORIGINS: List[str]
    ENVIRONMENT: str = "development"
    OPENAI_API_KEY: str
    GROQ_API_KEY: str

    MONGODB_URL: str
    MONGODB_DB: str
    MONGODB_MAX_POOL_SIZE: int = 10
    MONGODB_MIN_POOL_SIZE: int = 10

settings = Settings()