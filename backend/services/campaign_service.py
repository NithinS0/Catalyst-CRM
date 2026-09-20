from typing import Dict, Any, List, Optional
from backend.database.supabase import get_supabase
from backend.database.repositories.campaign_repository import CampaignRepository
from backend.graph.workflow import run_campaign_studio_workflow, run_campaign_execution_workflow
from backend.services.email.factory import get_email_provider
from backend.utils.tenant import get_current_company_id

class CampaignService:
    @staticmethod
    def list_campaigns() -> List[Dict[str, Any]]:
        return CampaignRepository.list_all()

    @staticmethod
    def create_campaign(
        name: str,
        description: Optional[str],
        type_str: str,
        segment_id: Optional[str],
        content_template: str,
        subject: Optional[str] = None,
        sender_name: Optional[str] = None,
        sender_email: Optional[str] = None,
        reply_to: Optional[str] = None
    ) -> Dict[str, Any]:
        return CampaignRepository.create(
            name=name,
            description=description,
            type_str=type_str,
            segment_id=segment_id,
            content_template=content_template,
            subject=subject,
            sender_name=sender_name,
            sender_email=sender_email,
            reply_to=reply_to
        )

    @staticmethod
    def trigger_campaign(campaign_id: str, background_tasks) -> Dict[str, str]:
        from backend.utils.tenant import get_current_company_id, tenant_context
        campaign = CampaignRepository.get_by_id(campaign_id)
        if not campaign:
            raise ValueError("Campaign not found")
        if campaign.get("status") in ("sending", "processing"):
            raise ValueError("Campaign is currently being processed.")
            
        company_id = get_current_company_id()
        def wrapped_dispatch(cid, camp_id):
            with tenant_context(cid):
                run_campaign_execution_workflow(camp_id)

        background_tasks.add_task(wrapped_dispatch, company_id, campaign_id)
        return {"message": "Campaign queued for real-time dispatch", "status": "queued"}

    @staticmethod
    def send_test_email(to_email: str, campaign_id: Optional[str] = None, subject: Optional[str] = None, content: Optional[str] = None) -> Dict[str, Any]:
        company_id = get_current_company_id()
        subj = subject
        body = content
        if campaign_id:
            camp = CampaignRepository.get_by_id(campaign_id)
            if camp:
                subj = subj or camp.get("subject") or camp.get("name")
                body = body or camp.get("content_template")

        provider = get_email_provider(company_id)
        res = provider.send_test_email(
            to_email=to_email,
            subject=f"[TEST] {subj or 'Catalyst Campaign Preview'}",
            body=body or "Hello {{first_name}},\n\nThis is a test preview from Catalyst CRM."
        )
        return {
            "success": res.success,
            "status": res.status,
            "provider_message_id": res.provider_message_id,
            "error_message": res.error_message
        }

    @staticmethod
    def get_execution_monitor(campaign_id: str) -> Dict[str, Any]:
        supabase = get_supabase()
        camp = CampaignRepository.get_by_id(campaign_id)
        if not camp:
            raise ValueError("Campaign not found")

        # 1. Fetch from campaign_recipients (V2 Ledger)
        recips_res = supabase.table("campaign_recipients").select("*").eq("campaign_id", campaign_id).order("created_at", desc=False).execute()
        recipients = recips_res.data or []

        # 2. Fallback to legacy campaign_deliveries if no records in campaign_recipients
        if not recipients:
            delivs_res = supabase.table("campaign_deliveries").select("customer_id, status, sent_at, opened_at, clicked_at, error_message").eq("campaign_id", campaign_id).execute()
            deliveries = delivs_res.data or []
            total = len(deliveries) or camp.get("total_recipients", 0)
            sent = sum(1 for d in deliveries if d.get("status") in ("sent", "delivered", "opened", "clicked"))
            delivered = sum(1 for d in deliveries if d.get("status") in ("delivered", "opened", "clicked"))
            opened = sum(1 for d in deliveries if d.get("status") in ("opened", "clicked"))
            clicked = sum(1 for d in deliveries if d.get("status") == "clicked")
            failed = sum(1 for d in deliveries if d.get("status") == "failed")
            queued = 0
            sending = 0
            bounced = 0
        else:
            total = len(recipients) or camp.get("total_recipients", 0)
            queued = sum(1 for r in recipients if r.get("status") == "queued")
            sending = sum(1 for r in recipients if r.get("status") == "sending")
            sent = sum(1 for r in recipients if r.get("status") == "sent")
            delivered = sum(1 for r in recipients if r.get("status") == "delivered")
            opened = sum(1 for r in recipients if r.get("status") == "opened")
            clicked = sum(1 for r in recipients if r.get("status") == "clicked")
            bounced = sum(1 for r in recipients if r.get("status") == "bounced")
            failed = sum(1 for r in recipients if r.get("status") == "failed")

        # Fetch communications log
        comms_res = supabase.table("communications").select("id, customer_id, channel, subject, status, provider_message_id, created_at, error_message").eq("campaign_id", campaign_id).limit(50).execute()
        comms = comms_res.data or []

        return {
            "campaign_id": campaign_id,
            "campaign_name": camp.get("name"),
            "status": camp.get("status"),
            "channel": camp.get("type", "email"),
            "total_recipients": total,
            "queued_count": queued,
            "sending_count": sending,
            "sent_count": sent,
            "delivered_count": delivered,
            "opened_count": opened,
            "clicked_count": clicked,
            "bounced_count": bounced,
            "failed_count": failed,
            "launched_at": camp.get("launched_at"),
            "completed_at": camp.get("completed_at"),
            "recipients": recipients[:100],
            "communications": comms[:50]
        }

    @staticmethod
    def approve_studio_campaign(
        marketing_goal: str,
        segment_name: str,
        segment_rules: List[Dict[str, Any]],
        channel: str,
        content_template: str,
        description: Optional[str]
    ) -> Dict[str, Any]:
        # 1. Create segment
        seg_description = f"Segment automatically generated by Campaign Studio for goal: '{marketing_goal}'"
        seg_id = CampaignRepository.create_segment(segment_name, seg_description, segment_rules)
        
        # 2. Create campaign
        camp_name = f"Studio - {segment_name}"
        camp_description = description or f"AI Campaign drafted for goal: '{marketing_goal}'"
        return CampaignRepository.create(
            name=camp_name,
            description=camp_description,
            type_str=channel,
            segment_id=seg_id,
            content_template=content_template,
            subject=f"Exciting news from our team",
            status="draft"
        )

    @staticmethod
    def run_planning_workflow(marketing_goal: str) -> Dict[str, Any]:
        return run_campaign_studio_workflow(marketing_goal)
