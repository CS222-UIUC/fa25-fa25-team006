from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl
from typing import List

class Settings(BaseSettings):
    SECRET_KEY: str = "change_me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DB_URL: str = "sqlite:///./campuscache.db"
    CORS_ORIGINS: List[AnyHttpUrl] | List[str] = ["http://localhost:5173"]
    class Config:
        env_file = ".env"

settings = Settings()
