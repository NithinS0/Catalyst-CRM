from fastapi import FastAPI
from pydantic import Field
from pydantic_settings import BaseSettings

import db
from api.send import router as send_router

class Settings(BaseSettings):
    PORT: int = Field(default=8001, env="PORT")
    BACKEND_API_URL: str = Field(default="http://localhost:8000", env="BACKEND_API_URL")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

app = FastAPI(title="Catalyst Channel Service", version="1.0.0")
app.state.settings = settings

@app.on_event("startup")
def startup_event():
    # Initialize the SQLite database
    db.init_db()

# Include modular API routers
app.include_router(send_router)

@app.get("/events")
def get_events_history(limit: int = 100):
    """
    Audit endpoint to view local delivery event history.
    """
    return db.get_events(limit)

@app.get("/dlq")
def get_dlq_records(limit: int = 100):
    """
    Audit endpoint to view Dead-Letter Queue items.
    """
    return db.get_dlq(limit)

@app.get("/health")
def health():
    return {"status": "healthy", "service": "channel-service"}
