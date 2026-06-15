import logging
from datetime import datetime
import httpx
import db
from callbacks.retry import get_retry_delay, RETRY_DELAYS
from workers.scheduler import schedule_delay

logger = logging.getLogger("channel-service-sender")

def send_webhook_callback_with_retry(
    communication_id: str,
    recipient: str,
    channel: str,
    message: str,
    event: str,
    backend_url: str
) -> bool:
    """
    Sends the event callback to the CRM backend webhook.
    Retries on failure using backoff: 1s, 2s, 4s, 8s, 16s.
    If all retries fail, moves payload to DLQ.
    """
    url = f"{backend_url.rstrip('/')}/api/webhooks/channel-events"
    payload = {
        "communicationId": communication_id,
        "recipient": recipient,
        "channel": channel,
        "message": message,
        "event": event,
        "timestamp": datetime.utcnow().isoformat()
    }

    attempts = 0
    max_attempts = len(RETRY_DELAYS) + 1  # Initial attempt + 5 retries
    error_msg = ""

    for attempt in range(1, max_attempts + 1):
        attempts = attempt
        try:
            logger.info(f"Sending webhook callback. Event: {event}, Attempt: {attempt}/{max_attempts}")
            response = httpx.post(url, json=payload, timeout=5.0)
            
            # Check for success (2xx)
            if 200 <= response.status_code < 300:
                logger.info(f"Webhook callback success for {communication_id} - event: {event}")
                return True
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                logger.warning(f"Webhook callback failed with status. Attempt {attempt} failed: {error_msg}")
        except Exception as e:
            error_msg = f"Network Error: {str(e)}"
            logger.warning(f"Webhook callback failed with exception. Attempt {attempt} failed: {error_msg}")

        # If not the last attempt, sleep before retry
        if attempt < max_attempts:
            delay = get_retry_delay(attempt - 1)
            logger.info(f"Waiting {delay}s before retry attempt {attempt + 1}...")
            schedule_delay(delay)

    # If we reached here, it means all attempts failed
    logger.error(f"All {max_attempts} webhook callback attempts failed. Moving to Dead-Letter Queue.")
    db.insert_dlq(
        communication_id=communication_id,
        recipient=recipient,
        channel=channel,
        message=message,
        event_type=event,
        payload=payload,
        error_message=error_msg,
        attempts=attempts
    )
    return False
