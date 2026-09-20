from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Request
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from backend.services.campaign_service import CampaignService
from backend.database.repositories.campaign_repository import CampaignRepository
from backend.utils.llm import generate_campaign_report
from backend.utils.auth import has_permission, Permission

router = APIRouter(
    prefix="/api/campaigns", 
    tags=["campaigns"],
    dependencies=[Depends(has_permission(Permission.READ_ONLY))]
)

class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    type: str = "email"  # email, sms, whatsapp, phone, rcs, push
    segment_id: Optional[str] = None
    content_template: str
    subject: Optional[str] = None
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None
    reply_to: Optional[str] = None

class TestEmailRequest(BaseModel):
    recipient_email: Optional[EmailStr] = None
    test_email: Optional[EmailStr] = None
    subject: Optional[str] = None
    content_template: Optional[str] = None

    def get_recipient(self, fallback_email: Optional[str] = None) -> str:
        addr = self.recipient_email or self.test_email or fallback_email
        if not addr:
            raise ValueError("recipient_email or test_email is required (or log in with a verified account email)")
        return addr

def get_user_email_from_token(request: Request) -> Optional[str]:
    auth_hdr = request.headers.get("Authorization") or ""
    if auth_hdr.startswith("Bearer "):
        token = auth_hdr.split(" ")[1]
        try:
            from backend.database.supabase import get_supabase
            sb = get_supabase()
            u = sb.auth.get_user(token)
            if u and u.user and u.user.email:
                return u.user.email
        except Exception:
            pass
    return None

class ApproveStudioCampaignRequest(BaseModel):
    marketing_goal: str
    segment_name: str
    segment_rules: List[Dict[str, Any]]
    channel: str = "email"
    content_template: str
    description: Optional[str] = None

@router.get("")
def list_campaigns():
    return CampaignService.list_campaigns()

@router.post("", dependencies=[Depends(has_permission(Permission.CREATE_CAMPAIGNS))])
def create_campaign(campaign: CampaignCreate):
    return CampaignService.create_campaign(
        name=campaign.name,
        description=campaign.description,
        type_str=campaign.type,
        segment_id=campaign.segment_id,
        content_template=campaign.content_template,
        subject=campaign.subject,
        sender_name=campaign.sender_name,
        sender_email=campaign.sender_email,
        reply_to=campaign.reply_to
    )

@router.get("/{campaign_id}")
def get_campaign(campaign_id: str):
    """Get a single campaign with aggregated delivery stats."""
    campaign = CampaignRepository.get_by_id_with_stats(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.get("/{campaign_id}/execution-monitor")
@router.get("/{campaign_id}/monitor")
def get_campaign_execution_monitor(campaign_id: str):
    """Get real-time execution progress and recipient delivery state."""
    try:
        return CampaignService.get_execution_monitor(campaign_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{campaign_id}/test-email", dependencies=[Depends(has_permission(Permission.CREATE_CAMPAIGNS))])
def send_campaign_test_email(campaign_id: str, req: TestEmailRequest, request: Request):
    """Sends a real test email for this campaign to the requested or authenticated user recipient."""
    try:
        fallback = get_user_email_from_token(request)
        target = req.get_recipient(fallback_email=fallback)
        return CampaignService.send_test_email(
            to_email=target,
            campaign_id=campaign_id,
            subject=req.subject,
            content=req.content_template
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send test email: {str(e)}")

@router.post("/send-test-email", dependencies=[Depends(has_permission(Permission.CREATE_CAMPAIGNS))])
def send_adhoc_test_email(req: TestEmailRequest, request: Request):
    """Sends an adhoc test email with provided subject and template to requested or authenticated user."""
    try:
        fallback = get_user_email_from_token(request)
        target = req.get_recipient(fallback_email=fallback)
        return CampaignService.send_test_email(
            to_email=target,
            subject=req.subject,
            content=req.content_template
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send test email: {str(e)}")

@router.get("/{campaign_id}/report")
def get_campaign_report(campaign_id: str):
    """Generate an AI report for a campaign."""
    campaign = CampaignRepository.get_by_id_with_stats(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    report = generate_campaign_report(campaign)
    return {"report": report}

@router.delete("/{campaign_id}", dependencies=[Depends(has_permission(Permission.CREATE_CAMPAIGNS))])
def delete_campaign(campaign_id: str):
    """Delete a campaign and all associated data."""
    campaign = CampaignRepository.get_by_id(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    try:
        CampaignRepository.delete_campaign_deliveries_by_campaign(campaign_id)
        CampaignRepository.delete_communications_by_campaign(campaign_id)
        CampaignRepository.delete_campaign(campaign_id)
        return {"message": "Campaign deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{campaign_id}/trigger", dependencies=[Depends(has_permission(Permission.CREATE_CAMPAIGNS))])
def trigger_campaign(campaign_id: str, background_tasks: BackgroundTasks):
    try:
        return CampaignService.trigger_campaign(campaign_id, background_tasks)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/approve-studio-campaign", dependencies=[Depends(has_permission(Permission.CREATE_CAMPAIGNS))])
def approve_studio_campaign(req: ApproveStudioCampaignRequest):
    try:
        return CampaignService.approve_studio_campaign(
            marketing_goal=req.marketing_goal,
            segment_name=req.segment_name,
            segment_rules=req.segment_rules,
            channel=req.channel,
            content_template=req.content_template,
            description=req.description
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to approve and save campaign: {str(e)}")
