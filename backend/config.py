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
        default="llama-3.3-70b-versatile",
        env="GROQ_MODEL"
    )
    CHANNEL_SERVICE_URL: str = Field(
        default="http://localhost:8001",
        env="CHANNEL_SERVICE_URL"
    )

    # LangSmith tracing
    LANGCHAIN_TRACING_V2: str = Field(default="false", env="LANGCHAIN_TRACING_V2")
    LANGCHAIN_ENDPOINT: str = Field(
        default="https://api.smith.langchain.com",
        env="LANGCHAIN_ENDPOINT"
    )
    LANGCHAIN_API_KEY: str = Field(default="", env="LANGCHAIN_API_KEY")
    LANGCHAIN_PROJECT: str = Field(default="catalyst-crm", env="LANGCHAIN_PROJECT")


    class Config:
        env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
