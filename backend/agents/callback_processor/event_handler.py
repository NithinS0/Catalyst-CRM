from typing import Dict, Any
from backend.database.repositories.campaign_repository import CampaignRepository
from backend.database.repositories.customer_repository import CustomerRepository
from backend.database.repositories.log_repository import LogRepository
from backend.agents.callback_processor.status_merger import (
    should_update_communication_status,
    should_update_delivery_status,
    map_event_to_delivery_status
)

def process_callback_event(payload: Dict[str, Any]) -> Dict[str, Any]:
    comm_id = payload.get("communicationId")
    event = payload.get("event")
    recipient = payload.get("recipient", "")
    channel = payload.get("channel", "")
    message = payload.get("message", "")
    timestamp = payload.get("timestamp", "")
    metadata = payload.get("metadata") or {}
    
    if not comm_id or not event:
        return {"status": "error", "message": "Missing communicationId or event"}

    # 1. Idempotency validation
    if CampaignRepository.check_event_exists(comm_id, event):
        return {
            "status": "duplicate",
            "message": f"Event {event} for communication {comm_id} already processed"
        }
        
    # 2. Fetch current status of communication record
    comm = CampaignRepository.get_communication_by_id(comm_id)
    if not comm:
        return {"status": "error", "message": f"Communication {comm_id} not found"}
        
    current_status = comm["status"]
    cust_id = str(comm["customer_id"])
    campaign_id = str(comm["campaign_id"]) if comm.get("campaign_id") else None

    # 3. Store event in public.communication_events
    event_metadata = metadata.copy()
    if not event_metadata:
        event_metadata = {
            "recipient": recipient,
            "channel": channel,
            "timestamp": timestamp
        }
    CampaignRepository.insert_communication_event(comm_id, event, event_metadata)

    # 4. Prevent status regression and update communication status
    if should_update_communication_status(current_status, event):
        CampaignRepository.update_communication_status(comm_id, event)
        print(f"[Callback Processor Agent] Updated communication {comm_id} status to '{event}'.")
    else:
        print(f"[Callback Processor Agent] Ignored status update to '{event}' for communication {comm_id} (current: '{current_status}').")

    # 5. Sync campaign delivery if campaign_id is present
    if campaign_id:
        current_deliv_status = CampaignRepository.get_delivery_status(campaign_id, cust_id)
        if current_deliv_status:
            new_deliv_status = map_event_to_delivery_status(event)
            
            if should_update_delivery_status(current_deliv_status, new_deliv_status):
                updates = {"status": new_deliv_status}
                if event == "sent":
                    updates["sent_at"] = True
                elif event in ("opened", "read"):
                    updates["opened_at"] = True
                elif event in ("clicked", "converted"):
                    updates["clicked_at"] = True
                elif event == "failed":
                    updates["error_message"] = "Delivery gateway failure simulation"
                    
                CampaignRepository.update_delivery(campaign_id, cust_id, updates)
                print(f"[Callback Processor Agent] Updated delivery log to '{new_deliv_status}'.")

    # 6. Real-time Lead Scoring update on conversion
    if event == "converted":
        new_score = CustomerRepository.increment_lead_score(cust_id, 15)
        
        # Log to agent_logs via LogRepository
        input_data = {"communication_id": comm_id, "event": "converted"}
        output_data = {"new_lead_score": new_score, "adjustment": "+15"}
        
        LogRepository.insert_log(
            agent_name="lead_scorer",
            customer_id=cust_id,
            task_description="Auto-adjust lead score on campaign conversion",
            status="success",
            input_data=input_data,
            output_data=output_data
        )
        print(f"[Callback Processor Agent] Lead score updated for customer {cust_id}. New score: {new_score}")
        
    return {"status": "processed", "communicationId": comm_id, "event": event}
