"""
Application configuration
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # App
    APP_NAME: str = "Tools For You"
    DEBUG: bool = True
    VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str = "sqlite:///./it_tools.db"
    # For PostgreSQL: postgresql://user:password@localhost/dbname
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # AI API
    AI_API_URL: str = "https://integrate.api.nvidia.com/v1"
    AI_API_KEY: str = ""
    AI_MODEL: str = "z-ai/glm5"
    
    # GitHub API
    GITHUB_TOKEN: Optional[str] = None
    
    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
