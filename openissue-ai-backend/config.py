from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/issues.db"
    OPENAI_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gpt-4o"
    LLM_ENABLED: bool = True
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    VECTOR_DB_TYPE: str = "faiss"
    SIMILARITY_THRESHOLD: float = 0.7
    GITHUB_WEBHOOK_SECRET: Optional[str] = None
    GITHUB_TOKEN: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

    # Webhook Precursor System
    WEBHOOK_MODE: str = "precursor"  # "auto" | "precursor" | "manual"
    WEBHOOK_KEYWORD_TRIGGERS: List[str] = [
        "crash", "bug", "error", "broken", "security", "urgent",
        "regression", "vulnerability", "critical", "fix",
        "exception", "stacktrace", "segfault", "panic"
    ]
    WEBHOOK_LABEL_TRIGGERS: List[str] = [
        "bug", "triage-needed", "help wanted", "priority: high",
        "priority: critical", "security", "regression"
    ]
    WEBHOOK_REPO_ALLOWLIST: List[str] = []  # Empty = allow all repos
    WEBHOOK_SKIP_BOTS: bool = True  # Skip issues created by bots

    # Playwright Enrichment
    PLAYWRIGHT_ENABLED: bool = False  # Enable rich page scraping

    class Config:
        env_file = ".env"

settings = Settings()
