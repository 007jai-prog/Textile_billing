
from typing import List
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):

    # MongoDB Configuration
    MONGODB_URI: str = ""
    DATABASE_NAME: str = "texbill_db"

    # JWT Security
    JWT_SECRET: str = "change-this-secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://textile-billing-chi.vercel.app"
    ]

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Microsoft OAuth
    MICROSOFT_CLIENT_ID: str = ""
    MICROSOFT_CLIENT_SECRET: str = ""

    # OAuth Redirect
    OAUTH_FRONTEND_REDIRECT_URI: str = (
        "http://localhost:5173/auth/callback"
    )

    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH),
        extra="allow",
        case_sensitive=True
    )


settings = Settings()
