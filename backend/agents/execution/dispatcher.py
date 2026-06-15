import json
import urllib.request
import urllib.parse
from typing import Dict, Any
from backend.config import settings
from backend.database.repositories.campaign_repository import CampaignRepository
from backend.database.repositories.customer_repository import CustomerRepository

def render_template(template: str, context: dict) -> str:
    rendered = template
    for key, val in context.items():
        placeholder = "{{" + key + "}}"
        rendered = rendered.replace(placeholder, str(val or ""))
    return rendered

def dispatch_campaign(campaign_id: str) -> int:
    """
    Resolves the target segment, creates database records in communications and
    campaign deliveries, and dispatches requests to the Channel Service.
    """
    # 1. Fetch Campaign details
    campaign = CampaignRepository.get_by_id(campaign_id)
    if not campaign or not campaign["segment_id"]:
        return 0
        
    # 2. Fetch Segment details and evaluate rules
    segment = CampaignRepository.get_segment_by_id(str(campaign["segment_id"]))
    if not segment:
        return 0
        
    try:
        definition = segment["definition"]
        if isinstance(definition, str):
            definition = json.loads(definition)
        customers = CustomerRepository.evaluate_segment_rules(definition)
    except Exception as e:
        print(f"Failed to evaluate segment {campaign['segment_id']} for campaign {campaign_id}: {e}")
        return 0

    count = 0
    # 3. Create communications and campaign deliveries, and dispatch to /send
    for cust in customers:
        context = {
            "first_name": cust.get("first_name", ""),
            "last_name": cust.get("last_name", ""),
            "company": cust.get("company", "your company"),
            "email": cust.get("email", ""),
            "phone": cust.get("phone", "")
        }
        rendered_message = render_template(campaign["content_template"], context)
        recipient = cust.get("phone") if campaign["type"] in ("sms", "whatsapp") else cust.get("email")
        if not recipient:
            recipient = cust.get("email") or ""

        # a. Create communication and delivery logs
        comm_id = None
        try:
            comm_id = CampaignRepository.create_communication(
                customer_id=str(cust["id"]),
                campaign_id=campaign_id,
                channel=campaign["type"],
                subject=campaign["name"],
                body=rendered_message,
                status="queued"
            )
            
            CampaignRepository.create_delivery(
                campaign_id=campaign_id,
                customer_id=str(cust["id"]),
                status="pending"
            )
        except Exception as db_err:
            print(f"Failed to create communication/delivery record for customer {cust['id']}: {db_err}")
            continue

        # b. Trigger dispatch to Channel Service
        channel_url = f"{settings.CHANNEL_SERVICE_URL}/send"
        idempotency_key = f"camp_{campaign_id}_cust_{cust['id']}"
        
        payload = {
            "communicationId": str(comm_id),
            "recipient": recipient,
            "channel": campaign["type"],
            "message": rendered_message,
            "idempotencyKey": idempotency_key
        }
        
        try:
            data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(
                channel_url,
                data=data,
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                res_body = response.read().decode('utf-8')
                print(f"Channel service response for communication {comm_id}: {res_body}")
                count += 1
        except Exception as e:
            print(f"Failed to call Channel Service for communication {comm_id}: {e}")
            # Update logs to failed
            if comm_id:
                CampaignRepository.update_communication_status(comm_id, "failed")
            CampaignRepository.update_delivery(
                campaign_id=campaign_id,
                customer_id=str(cust["id"]),
                updates={
                    "status": "failed",
                    "error_message": f"Channel dispatch exception: {str(e)}"
                }
            )
            
    # Update Campaign status to active
    CampaignRepository.update_status(campaign_id, "active")
    return count
