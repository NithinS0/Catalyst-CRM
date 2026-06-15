from fastapi import APIRouter
from backend.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/stats")
def get_analytics_stats():
    return AnalyticsService.get_stats()

@router.get("/summary")
def get_ai_summary():
    return AnalyticsService.get_ai_summary()

@router.get("/realtime")
def get_realtime_events(limit: int = 20):
    return AnalyticsService.get_realtime_events(limit)
