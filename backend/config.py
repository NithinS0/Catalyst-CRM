import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgrespassword@localhost:54322/supabase_local",
        env="DATABASE_URL"
    )
    SUPABASE_URL: str = Field(
        default="http://localhost:54321",
        env="SUPABASE_URL"
    )
    SUPABASE_SERVICE_KEY: str = Field(
        default="mock-service-role-key",
        env="SUPABASE_SERVICE_KEY"
    )
    OPENAI_API_KEY: str = Field(
        default="",
        env="OPENAI_API_KEY"
    )
    OPENAI_MODEL: str = Field(
        default="gpt-4o-mini",
        env="OPENAI_MODEL"
    )
    GROQ_API_KEY: str = Field(
        default="",
        env="GROQ_API_KEY"
    )
    GROQ_MODEL: str = Field(
        default="groq/compound-mini",
        env="GROQ_MODEL"
    )

    # LangSmith tracing
    LANGCHAIN_TRACING_V2: str = Field(default="false", env="LANGCHAIN_TRACING_V2")
    LANGCHAIN_ENDPOINT: str = Field(
        default="https://api.smith.langchain.com",
        env="LANGCHAIN_ENDPOINT"
    )
    LANGCHAIN_API_KEY: str = Field(default="", env="LANGCHAIN_API_KEY")
    LANGCHAIN_PROJECT: str = Field(default="catalyst-crm", env="LANGCHAIN_PROJECT")

    # Email Provider Settings
    EMAIL_PROVIDER: str = Field(default="resend", env="EMAIL_PROVIDER")
    RESEND_API_KEY: str = Field(default="", env="RESEND_API_KEY")
    EMAIL_FROM: str = Field(default="onboarding@resend.dev", env="EMAIL_FROM")
    EMAIL_FROM_NAME: str = Field(default="Catalyst CRM", env="EMAIL_FROM_NAME")
    EMAIL_REPLY_TO: str = Field(default="", env="EMAIL_REPLY_TO")
    RESEND_WEBHOOK_SECRET: str = Field(default="", env="RESEND_WEBHOOK_SECRET")
    SMTP_HOST: str = Field(default="", env="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USERNAME: str = Field(default="", env="SMTP_USERNAME")
    SMTP_PASSWORD: str = Field(default="", env="SMTP_PASSWORD")
    SMTP_USE_TLS: bool = Field(default=True, env="SMTP_USE_TLS")
    CORS_ORIGINS: str = Field(default="", env="CORS_ORIGINS")


    class Config:
        env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
