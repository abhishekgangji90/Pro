import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "KiranaPulse API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = "d4b526592eb40dd88837a85aa187a32be110eb124d4c3e6be795961efb9ebf26"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    MONGODB_URL: str = "mongodb+srv://abhishekgangji90_db_user:Abhishek123@cluster0.ppslrci.mongodb.net/"
    DATABASE_NAME: str = "Shop"
    
    GEMINI_API_KEY: str | None = None
    
    ALLOW_CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://localhost:3000", "https://pro-three-beige.vercel.app"]

    @field_validator("ALLOW_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            if isinstance(v, str):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    return ["*"]
            return v
        return ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
