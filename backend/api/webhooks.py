import json
import hmac
import hashlib
import base64
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from backend.config import settings
from backend.database.supabase import get_supabase
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

def verify_svix_signature(secret: str, svix_id: str, svix_timestamp: str, svix_signature: str, body: bytes) -> bool:
    """Verifies Svix signature according to standard HMAC-SHA256 protocol."""
    if not secret:
        return True
    if not (svix_id and svix_timestamp and svix_signature):
        return False
    try:
        raw_secret = secret[6:] if secret.startswith("whsec_") else secret
        secret_bytes = base64.b64decode(raw_secret)
        to_sign = f"{svix_id}.{svix_timestamp}.".encode("utf-8") + body
        expected_sig = base64.b64encode(hmac.new(secret_bytes, to_sign, hashlib.sha256).digest()).decode("utf-8")
        signatures = svix_signature.split(" ")
        for sig in signatures:
            parts = sig.split(",")
            if len(parts) == 2 and parts[0] == "v1":
                if hmac.compare_digest(parts[1], expected_sig):
                    return True
        return False
    except Exception as e:
        print(f"[Webhook] Signature validation exception: {e}")
        return False

@router.post("/resend")
@router.post("/email")
async def resend_email_webhook(request: Request):
    """
    Receives and processes Resend webhook events (sent, delivered, opened, clicked, bounced, complained).
    Authenticates via Svix headers and updates real database metrics without simulated numbers.
    """
    body = await request.body()
    
    # 1. Authenticate webhook if secret configured
    secret = settings.RESEND_WEBHOOK_SECRET
    if secret:
        svix_id = request.headers.get("svix-id")
        svix_timestamp = request.headers.get("svix-timestamp")
        svix_signature = request.headers.get("svix-signature")
        if not verify_svix_signature(secret, svix_id, svix_timestamp, svix_signature, body):
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid Svix webhook signature")

    # 2. Parse payload
    try:
        payload = json.loads(body.decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {str(e)}")

    event_type = payload.get("type", "")
    data = payload.get("data", {}) or {}
    email_id = data.get("email_id") or data.get("id")
    event_timestamp = payload.get("created_at") or datetime.now(timezone.utc).isoformat()

    if not email_id:
        return {"status": "ignored", "reason": "No email_id in webhook payload"}

    supabase = get_supabase()

    # Normalize status string
    status_map = {
        "email.sent": "sent",
        "email.delivered": "delivered",
        "email.opened": "opened",
        "email.clicked": "clicked",
        "email.bounced": "bounced",
        "email.complained": "failed"
    }
    normalized_status = status_map.get(event_type, "sent")

    # 3. Lookup recipient in campaign_recipients ledger
    try:
        recips_res = supabase.table("campaign_recipients").select("*").eq("provider_message_id", email_id).execute()
        recip = recips_res.data[0] if recips_res.data else None
        
        if recip:
            campaign_id = recip.get("campaign_id")
            company_id = recip.get("company_id")
            updates: Dict[str, Any] = {"status": normalized_status}
            if normalized_status == "delivered":
                updates["delivered_at"] = event_timestamp
            elif normalized_status == "opened":
                updates["opened_at"] = event_timestamp
            elif normalized_status == "clicked":
                updates["clicked_at"] = event_timestamp
            elif normalized_status in ("bounced", "failed"):
                updates["failed_at"] = event_timestamp
                updates["error_message"] = json.dumps(data.get("bounce") or "Email failed or reported spam")

            supabase.table("campaign_recipients").update(updates).eq("id", recip["id"]).execute()

            # Recalculate campaign delivery stats from real ledger
            if campaign_id:
                all_recips = supabase.table("campaign_recipients").select("status").eq("campaign_id", campaign_id).execute()
                r_list = all_recips.data or []
                succ = sum(1 for r in r_list if r.get("status") in ("delivered", "opened", "clicked"))
                fail = sum(1 for r in r_list if r.get("status") in ("failed", "bounced"))
                supabase.table("campaigns").update({
                    "successful_deliveries": succ,
                    "failed_deliveries": fail
                }).eq("id", campaign_id).execute()
    except Exception as e:
        print(f"[Webhook] Error updating campaign_recipients: {e}")

    # 4. Lookup and update communications record
    try:
        comm_res = supabase.table("communications").select("id, company_id").eq("provider_message_id", email_id).execute()
        if comm_res.data:
            comm = comm_res.data[0]
            comm_id = comm["id"]
            cid = comm.get("company_id")
            
            supabase.table("communications").update({
                "status": normalized_status,
                "updated_at": event_timestamp
            }).eq("id", comm_id).execute()

            # Insert immutable communication event
            supabase.table("communication_events").insert({
                "company_id": cid,
                "communication_id": comm_id,
                "event_type": normalized_status,
                "metadata": data,
                "created_at": event_timestamp
            }).execute()
    except Exception as e:
        print(f"[Webhook] Error updating communication ledger: {e}")

    return {
        "status": "success",
        "email_id": email_id,
        "event": event_type,
        "normalized_status": normalized_status
    }

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
        result = []
        for r in (events or []):
            created = r.get("created_at")
            result.append({
                "id": str(r["id"]),
                "event_type": r["event_type"],
                "created_at": created.isoformat() if isinstance(created, datetime) else str(created),
                "channel": r.get("channel", ""),
                "subject": r.get("subject", ""),
                "recipient_name": r.get("recipient_name", ""),
                "recipient_email": r.get("recipient_email", ""),
                "details": r.get("details") or {},
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch events: {str(e)}")
