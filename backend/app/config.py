from pydantic_settings import BaseSettings
from typing import Optional
import secrets


class Settings(BaseSettings):
    # Connect to PostgreSQL instead of SQLite
    DATABASE_URL: str = "postgresql://avasara_user:yourpassword@localhost:5432/startup_platform"

    SECRET_KEY: str = "your-strong-static-secret-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"


settings = Settings()
