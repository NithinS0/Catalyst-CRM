from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from backend.graph.workflow import run_agent_workflow
from backend.services.campaign_service import CampaignService

router = APIRouter(prefix="/api/agents", tags=["agents"])

class AgentChatRequest(BaseModel):
    prompt: str
    customer_id: Optional[str] = None

class AgentChatResponse(BaseModel):
    logs: List[str]
    proposed_content: Optional[str]
    suggested_score: Optional[int]
    suggested_segment_rules: Optional[List[Dict[str, Any]]]
    next_node: Optional[str]

class CampaignStudioRequest(BaseModel):
    marketing_goal: str

class CampaignStudioResponse(BaseModel):
    marketing_goal: str
    action_logs: List[str]
    current_agent: str
    generated_segment_rules: Optional[List[Dict[str, Any]]]
    generated_segment_name: Optional[str]
    audience_size: int
    campaign_message: Optional[str]
    recommended_channel: Optional[str]
    predicted_outcomes: Optional[Dict[str, Any]]

@router.post("/chat", response_model=AgentChatResponse)
def agent_chat(req: AgentChatRequest):
    try:
        result = run_agent_workflow(req.prompt, req.customer_id)
        return AgentChatResponse(
            logs=result.get("action_logs", []),
            proposed_content=result.get("proposed_content"),
            suggested_score=result.get("suggested_score"),
            suggested_segment_rules=result.get("suggested_segment_rules"),
            next_node=result.get("next_node")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent chat workflow failed: {str(e)}")

@router.post("/campaign-studio", response_model=CampaignStudioResponse)
def trigger_campaign_studio(req: CampaignStudioRequest):
    try:
        result = CampaignService.run_planning_workflow(req.marketing_goal)
        return CampaignStudioResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Campaign Studio planning failed: {str(e)}")
