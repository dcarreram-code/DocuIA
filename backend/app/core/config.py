from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DB_SERVER: str
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str

    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "pendiente"

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()