from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    DEBUG: bool = False
    ALLOWED_ORIGINS: List[str]
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    OPENAI_API_KEY: str
    GROQ_API_KEY: str

    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int
    POSTGRES_DB: str


settings = Settings()
