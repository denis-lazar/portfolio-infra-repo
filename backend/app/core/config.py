from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "MenuSync"
    
    # These will be populated from .env or environment variables
    MONGODB_USER: str = "admin"
    MONGODB_PASSWORD: str = "menusync_secure_pass"
    MONGODB_HOST: str = "mongodb"
    MONGODB_PORT: str = "27017"
    MONGODB_DB: str = "menusync"
    MONGODB_AUTH_SOURCE: str = "admin"
    MONGODB_REPLICA_SET_NAME: str = ""
    
    @property
    def MONGODB_URL(self) -> str:
        url = f"mongodb://{self.MONGODB_USER}:{self.MONGODB_PASSWORD}@{self.MONGODB_HOST}:{self.MONGODB_PORT}/{self.MONGODB_DB}?authSource={self.MONGODB_AUTH_SOURCE}"
        if self.MONGODB_REPLICA_SET_NAME:
            url += f"&replicaSet={self.MONGODB_REPLICA_SET_NAME}"
        return url

    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
