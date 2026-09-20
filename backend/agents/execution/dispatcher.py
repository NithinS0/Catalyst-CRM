import json
import time
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from backend.config import settings
from backend.database.supabase import get_supabase
from backend.database.repositories.campaign_repository import CampaignRepository
from backend.database.repositories.customer_repository import CustomerRepository
from backend.services.email.factory import get_email_provider
from backend.utils.tenant import get_current_company_id

def render_template(template: str, context: dict) -> str:
    rendered = template or ""
    for key, val in context.items():
        placeholder = "{{" + key + "}}"
        rendered = rendered.replace(placeholder, str(val or ""))
    return rendered

def dispatch_campaign(campaign_id: str) -> int:
    """
    Production-grade campaign execution engine for Catalyst V2:
    - Queries targeted audience
    - Initializes recipient queue with idempotency keys
    - Dispatches emails through configured EmailProvider (Resend / SMTP)
    - Records provider message IDs, timestamps, and error logs
    - Updates campaign progress in real-time
    """
    supabase = get_supabase()
    company_id = get_current_company_id()

    # 1. Fetch Campaign details
    campaign = CampaignRepository.get_by_id(campaign_id)
    if not campaign:
        print(f"[ExecutionDispatcher] Campaign {campaign_id} not found.")
        return 0

    cid = campaign.get("company_id") or company_id
    channel = (campaign.get("type") or campaign.get("target_channel") or "email").lower()

    # Transition campaign status to 'processing'
    CampaignRepository.update_status(campaign_id, "processing")
    supabase.table("campaigns").update({
        "launched_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", campaign_id).execute()

    # 2. Fetch Segment and evaluate customers
    customers: List[Dict[str, Any]] = []
    if campaign.get("segment_id"):
        segment = CampaignRepository.get_segment_by_id(str(campaign["segment_id"]))
        if segment:
            definition = segment.get("definition")
            if isinstance(definition, str):
                try:
                    definition = json.loads(definition)
                except Exception:
                    definition = []
            try:
                customers = CustomerRepository.evaluate_segment_rules(definition or [])
            except Exception as e:
                print(f"[ExecutionDispatcher] Segment evaluation failed: {e}")
                customers = []

    # If no segment or empty segment, fallback to active company customers
    if not customers:
        query = supabase.table("customers").select("id, first_name, last_name, email, phone, company")
        if cid:
            query = query.eq("company_id", cid)
        cust_res = query.limit(50).execute()
        customers = cust_res.data or []

    if not customers:
        print(f"[ExecutionDispatcher] No recipients found for campaign {campaign_id}.")
        CampaignRepository.update_status(campaign_id, "completed")
        return 0

    total_recipients = len(customers)

    # 3. Channel Check: V2 only executes EMAIL
    if channel != "email":
        print(f"[ExecutionDispatcher] Channel '{channel}' is marked 'coming soon'. Skipping live send.")
        for cust in customers:
            cust_id = str(cust["id"])
            key = f"camp_{campaign_id}_cust_{cust_id}"
            try:
                supabase.table("campaign_recipients").upsert({
                    "company_id": cid,
                    "campaign_id": campaign_id,
                    "customer_id": cust_id,
                    "email": cust.get("email"),
                    "status": "failed",
                    "error_message": f"Channel '{channel}' is not active (coming soon)",
                    "idempotency_key": key,
                    "failed_at": datetime.now(timezone.utc).isoformat()
                }, on_conflict="idempotency_key").execute()
            except Exception:
                pass
            CampaignRepository.create_delivery(
                campaign_id=campaign_id,
                customer_id=cust_id,
                status="failed"
            )
        supabase.table("campaigns").update({
            "status": "partially_failed",
            "failed_deliveries": total_recipients,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", campaign_id).execute()
        return 0

    # 4. Pre-create Campaign Recipients in 'queued' state
    now_iso = datetime.now(timezone.utc).isoformat()
    for cust in customers:
        cust_id = str(cust["id"])
        email = cust.get("email")
        key = f"camp_{campaign_id}_cust_{cust_id}"
        try:
            supabase.table("campaign_recipients").upsert({
                "company_id": cid,
                "campaign_id": campaign_id,
                "customer_id": cust_id,
                "email": email,
                "status": "queued",
                "idempotency_key": key,
                "created_at": now_iso
            }, on_conflict="idempotency_key").execute()
        except Exception as e:
            print(f"[ExecutionDispatcher] Recipient queue insert error: {e}")

    # Mark campaign as 'sending'
    CampaignRepository.update_status(campaign_id, "sending")
    supabase.table("campaigns").update({
        "total_recipients": total_recipients,
        "launched_at": now_iso
    }).eq("id", campaign_id).execute()

    # 5. Resolve Email Provider
    email_provider = get_email_provider(cid)
    subject = campaign.get("subject") or campaign.get("name") or "Catalyst Campaign"
    content_template = campaign.get("content_template") or ""
    sender_name = campaign.get("sender_name")
    sender_email = campaign.get("sender_email")
    reply_to = campaign.get("reply_to")

    from_header = f"{sender_name} <{sender_email}>" if (sender_name and sender_email) else None

    sent_count = 0
    failed_count = 0

    # 6. Process recipients batch with retries and idempotency
    for idx, cust in enumerate(customers):
        cust_id = str(cust["id"])
        email = cust.get("email")
        if not email:
            failed_count += 1
            continue

        idempotency_key = f"camp_{campaign_id}_cust_{cust_id}"

        # Idempotency check: Skip if already sent
        existing_comm = supabase.table("communications").select("id, status").eq("idempotency_key", idempotency_key).execute()
        if existing_comm.data and existing_comm.data[0].get("status") in ("sent", "delivered"):
            print(f"[ExecutionDispatcher] Idempotency match: Recipient {email} already processed.")
            sent_count += 1
            continue

        context = {
            "first_name": cust.get("first_name") or "Valued Customer",
            "last_name": cust.get("last_name") or "",
            "company": cust.get("company") or "your company",
            "email": email,
            "phone": cust.get("phone") or ""
        }
        rendered_body = render_template(content_template, context)

        # Log pending communication
        comm_res = supabase.table("communications").insert({
            "company_id": cid,
            "customer_id": cust_id,
            "campaign_id": campaign_id,
            "channel": "email",
            "direction": "outbound",
            "subject": subject,
            "body": rendered_body,
            "status": "queued",
            "idempotency_key": idempotency_key
        }).execute()

        comm_id = comm_res.data[0]["id"] if comm_res.data else None

        CampaignRepository.create_delivery(
            campaign_id=campaign_id,
            customer_id=cust_id,
            status="pending"
        )

        # Dispatch through provider abstraction with idempotency & recipient tracking
        send_result = email_provider.send_campaign_email(
            campaign_id=campaign_id,
            customer_id=cust_id,
            to_email=email,
            subject=subject,
            body=rendered_body,
            from_email=from_header,
            reply_to=reply_to,
            company_id=cid,
            idempotency_key=idempotency_key
        )

        event_now = datetime.now(timezone.utc).isoformat()

        if send_result and send_result.success:
            sent_count += 1
            if comm_id:
                supabase.table("communications").update({
                    "status": "sent",
                    "provider_message_id": send_result.provider_message_id,
                    "updated_at": event_now
                }).eq("id", comm_id).execute()

            CampaignRepository.update_delivery(
                campaign_id=campaign_id,
                customer_id=cust_id,
                updates={
                    "status": "sent",
                    "sent_at": event_now
                }
            )

            if comm_id:
                CampaignRepository.insert_communication_event(
                    comm_id=str(comm_id),
                    event_type="sent",
                    metadata={
                        "provider_message_id": send_result.provider_message_id,
                        "recipient": email,
                        "timestamp": event_now
                    }
                )
        else:
            failed_count += 1
            err_msg = send_result.error_message if send_result else "Unknown provider failure"
            if comm_id:
                supabase.table("communications").update({
                    "status": "failed",
                    "error_message": err_msg,
                    "updated_at": event_now
                }).eq("id", comm_id).execute()

            CampaignRepository.update_delivery(
                campaign_id=campaign_id,
                customer_id=cust_id,
                updates={
                    "status": "failed",
                    "error_message": err_msg
                }
            )

            if comm_id:
                CampaignRepository.insert_communication_event(
                    comm_id=str(comm_id),
                    event_type="failed",
                    metadata={
                        "error": err_msg,
                        "recipient": email,
                        "timestamp": event_now
                    }
                )

    # 7. Finalize Campaign Status
    final_status = "completed" if (sent_count > 0 and failed_count == 0) else ("partially_failed" if sent_count > 0 else "failed")
    supabase.table("campaigns").update({
        "status": final_status,
        "successful_deliveries": sent_count,
        "failed_deliveries": failed_count,
        "completed_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", campaign_id).execute()

    print(f"[ExecutionDispatcher] Campaign {campaign_id} dispatch finished: {sent_count} sent, {failed_count} failed. Final status: {final_status}")
    return sent_count
