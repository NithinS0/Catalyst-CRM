from fastapi import APIRouter, BackgroundTasks, Request
from pydantic import BaseModel, Field
import db
from workers.processor import simulate_delivery_flow

router = APIRouter()

class SendRequest(BaseModel):
    communicationId: str = Field(..., description="UUID of the communication in Catalyst CRM")
    recipient: str = Field(..., description="Recipient email address, phone number, etc.")
    channel: str = Field(..., description="Delivery channel (email, sms, whatsapp, push, call)")
    message: str = Field(..., description="Rendered message text to be delivered")
    idempotencyKey: str = Field(..., description="Unique key to ensure request idempotency")

@router.post("/send")
def send_communication(payload: SendRequest, background_tasks: BackgroundTasks, request: Request):
    """
    Enforces idempotency, queues the dispatch, and processes it in the background.
    """
    # 1. Check Idempotency Key
    cached = db.get_cached_response(payload.idempotencyKey)
    if cached:
        # Return identical response
        return cached["response_body"]

    # 2. Queue background task
    settings = request.app.state.settings
    background_tasks.add_task(
        simulate_delivery_flow,
        payload.communicationId,
        payload.recipient,
        payload.channel,
        payload.message,
        settings.BACKEND_API_URL
    )

    # 3. Create success response
    response_body = {
        "status": "queued",
        "communicationId": payload.communicationId,
        "recipient": payload.recipient,
        "channel": payload.channel
    }
    status_code = 200

    # 4. Cache response in Idempotency Keys table
    db.cache_response(payload.idempotencyKey, response_body, status_code)

    return response_body
