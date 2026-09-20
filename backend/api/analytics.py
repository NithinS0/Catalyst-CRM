from fastapi import APIRouter, Depends
from backend.services.analytics_service import AnalyticsService
from backend.utils.auth import has_permission, Permission

router = APIRouter(
    prefix="/api/analytics", 
    tags=["analytics"],
    dependencies=[Depends(has_permission(Permission.VIEW_ANALYTICS))]
)

@router.get("/stats")
def get_analytics_stats():
    return AnalyticsService.get_stats()

@router.get("/summary")
def get_ai_summary():
    return AnalyticsService.get_ai_summary()

@router.get("/realtime")
def get_realtime_events(limit: int = 20):
    return AnalyticsService.get_realtime_events(limit)

@router.get("/opportunities")
def get_opportunities():
    """AI Opportunity Engine — scans customer data and surfaces ranked growth opportunities."""
    from backend.agents.opportunity_engine.engine import scan_opportunities
    try:
        return scan_opportunities()
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Opportunity scan failed: {str(e)}")

