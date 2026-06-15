from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from backend.services.webhook_service import WebhookService
from backend.database.repositories.analytics_repository import AnalyticsRepository

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

class WebhookPayload(BaseModel):
    communicationId: str
    recipient: str
    channel: str
    message: str
    event: str
    timestamp: str
    metadata: Optional[dict] = None

@router.post("/channel-events")
def channel_events_webhook(payload: WebhookPayload):
    """
    Unified webhook endpoint to process channel communication events.
    Implements rank-based merge and idempotency handling.
    """
    try:
        res = WebhookService.process_channel_event(payload.dict())
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process webhook event: {str(e)}")

@router.get("/events")
def list_recent_events(limit: int = Query(default=30, le=100)):
    """
    Returns the most recent communication events for the analytics realtime feed.
    """
    try:
        events = AnalyticsRepository.get_realtime_events(limit)
        from datetime import datetime
        result = []
        for r in (events or []):
            import json as _json
            meta = r.get("metadata", {})
            if isinstance(meta, str):
                try:
                    meta = _json.loads(meta)
                except Exception:
                    meta = {}
            created = r.get("created_at")
            result.append({
                "id": str(r["id"]),
                "event_type": r["event_type"],
                "created_at": created.isoformat() if isinstance(created, datetime) else str(created),
                "channel": r.get("channel", ""),
                "subject": r.get("subject", ""),
                "recipient_name": f"{r.get('first_name', '')} {r.get('last_name', '')}".strip(),
                "recipient_email": r.get("email", ""),
                "details": meta,
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch events: {str(e)}")
