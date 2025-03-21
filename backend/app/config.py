from pydantic import BaseSettings
from typing import Optional
import secrets

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./startup_platform.db"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"
    
    class Config:
        env_file = ".env"

settings = Settings()
