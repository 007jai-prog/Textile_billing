from typing import List
from pydantic_settings import BaseSettings
import os
from pathlib import Path

# Path to .env inside backend
ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"

class Settings(BaseSettings):
    DATABASE_NAME: str = "texbill_db"
    JWT_SECRET: str = "super_secret_jwt_key_texbill_retail_pos_2026_dev_prod"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

    # Google OAuth 2.0 / OpenID Connect credentials
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Microsoft OAuth 2.0 / Azure AD credentials
    MICROSOFT_CLIENT_ID: str = ""
    MICROSOFT_CLIENT_SECRET: str = ""

    # Redirect URI for frontend callback
    OAUTH_FRONTEND_REDIRECT_URI: str = "http://localhost:5173/auth/callback"

    class Config:
        env_file = str(ENV_PATH)
        extra = "allow"

settings = Settings()
