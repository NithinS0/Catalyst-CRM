from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from backend.services.campaign_service import CampaignService
from backend.database.repositories.campaign_repository import CampaignRepository
from backend.utils.llm import generate_campaign_report

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])

class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    type: str  # email, sms, whatsapp
    segment_id: Optional[str] = None
    content_template: str

class ApproveStudioCampaignRequest(BaseModel):
    marketing_goal: str
    segment_name: str
    segment_rules: List[Dict[str, Any]]
    channel: str  # email, sms, whatsapp
    content_template: str
    description: Optional[str] = None

@router.get("")
def list_campaigns():
    return CampaignService.list_campaigns()

@router.post("")
def create_campaign(campaign: CampaignCreate):
    return CampaignService.create_campaign(
        name=campaign.name,
        description=campaign.description,
        type_str=campaign.type,
        segment_id=campaign.segment_id,
        content_template=campaign.content_template
    )

@router.get("/{campaign_id}")
def get_campaign(campaign_id: str):
    """Get a single campaign with aggregated delivery stats."""
    campaign = CampaignRepository.get_by_id_with_stats(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.get("/{campaign_id}/report")
def get_campaign_report(campaign_id: str):
    """Generate an AI report for a campaign."""
    campaign = CampaignRepository.get_by_id_with_stats(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    report = generate_campaign_report(campaign)
    return {"report": report}

@router.delete("/{campaign_id}")
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

@router.post("/{campaign_id}/trigger")
def trigger_campaign(campaign_id: str, background_tasks: BackgroundTasks):
    try:
        return CampaignService.trigger_campaign(campaign_id, background_tasks)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/approve-studio-campaign")
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
