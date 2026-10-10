from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+psycopg2://nexus:nexus_dev_password@localhost:5433/nexus"
    anthropic_api_key: str | None = None
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Matching thresholds (0-100), tuned against the demo data.
    dedupe_auto_merge_score: int = 90
    dedupe_review_score: int = 78
    reconcile_date_window_days: int = 3


@lru_cache
def get_settings() -> Settings:
    return Settings()
