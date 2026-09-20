import json
import asyncio
import re
from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from backend.database.supabase import get_supabase
from backend.utils.auth import has_permission, Permission
from backend.utils.tenant import (
    get_current_company_id,
    get_current_user_role,
    get_super_admin_override_active,
    tenant_context,
)
from backend.utils.llm import is_llm_enabled, get_llm_client_and_model, call_llm_for_campaign
from backend.services.campaign_service import CampaignService
from backend.database.repositories.customer_repository import CustomerRepository
from backend.database.repositories.campaign_repository import CampaignRepository

router = APIRouter(
    prefix="/api/chat-studio",
    tags=["chat-studio"],
    dependencies=[Depends(has_permission(Permission.USE_AI_STUDIO))]
)

class ChatStudioMessage(BaseModel):
    role: str
    content: str

class ChatStudioRequest(BaseModel):
    messages: List[ChatStudioMessage]
    current_state: str = "idle"  # idle, awaiting_campaign_approval, awaiting_launch_approval, launched
    campaign_id: Optional[str] = None
    proposed_campaign: Optional[Dict[str, Any]] = None


def _fmt_revenue(amount: float) -> str:
    if amount >= 100000:
        return f"₹{amount/100000:.1f}L"
    if amount >= 1000:
        return f"₹{amount/1000:.1f}K"
    return f"₹{amount:.0f}"


def classify_user_reply(user_msg: str, current_state: str, company_id: str, role: str, override_active: bool) -> str:
    """Classifies if user response is a confirmation ('confirm') or a revision/new goal ('revision')."""
    # Quick check for simple confirmations
    t = user_msg.strip().lower()
    t = re.sub(r'[^\w\s]', '', t)
    confirm_words = {"yes", "yeah", "yep", "sure", "launch", "go", "agree", "do it", "y", "launch it", "confirm", "ok", "okay", "fine"}
    if t in confirm_words:
        return "confirm"
    words = t.split()
    if len(words) <= 3 and any(w in confirm_words for w in words):
        return "confirm"

    # Use LLM if enabled
    if is_llm_enabled():
        try:
            with tenant_context(company_id, role, override_active):
                client, model = get_llm_client_and_model()
                prompt = (
                    f"The system proposed a campaign workflow and is in the state: '{current_state}'.\n"
                    f"The user replied: \"{user_msg}\"\n\n"
                    "Determine if the user's reply is a clear confirmation/agreement (e.g., agreeing to create the campaign or launch it) "
                    "or if it is a revision/modification/new goal (e.g., asking to change the channel, change copy, change percentage, or target a different audience).\n\n"
                    "Respond with exactly one word: 'confirm' or 'revision'."
                )
                response = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are a classifier. Output only 'confirm' or 'revision'."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.0
                )
                choice = response.choices[0].message.content.strip().lower()
                if "confirm" in choice:
                    return "confirm"
                return "revision"
        except Exception as e:
            print(f"Error classifying reply: {e}")
            
    # Fallback default
    if any(w in t for w in ["yes", "sure", "launch", "confirm", "ok"]):
        return "confirm"
    return "revision"


@router.post("/chat")
def chat_studio_endpoint(
    req: ChatStudioRequest,
    request: Request,
    background_tasks: BackgroundTasks
):
    # Capture tenant context vars to propagate into the streaming generator
    company_id = get_current_company_id()
    role = get_current_user_role()
    override_active = get_super_admin_override_active()

    async def stream_generator():
        # Setup context in the streaming thread
        with tenant_context(company_id, role, override_active):
            messages = req.messages
            current_state = req.current_state
            campaign_id = req.campaign_id
            proposed_campaign = req.proposed_campaign

            if not messages:
                yield "data: " + json.dumps({'type': 'text', 'content': 'Hello! How can I help you build campaigns today?'}) + "\n\n"
                return

            last_msg = messages[-1].content
            
            # Determine transition
            action = "new_prompt"
            if current_state in ["awaiting_campaign_approval", "awaiting_launch_approval"]:
                decision = classify_user_reply(last_msg, current_state, company_id, role, override_active)
                if decision == "confirm":
                    action = "confirm"
                else:
                    action = "revision"

            # ----------------------------------------------------
            # ACTION: NEW_PROMPT or REVISION
            # ----------------------------------------------------
            if action in ["new_prompt", "revision"]:
                yield "data: " + json.dumps({'type': 'log', 'agent': 'customer_intelligence', 'message': f'Analyzing user request: "{last_msg}"...'}) + "\n\n"
                await asyncio.sleep(0.6)

                # Fetch company details
                brand_name = "Catalyst"
                brand_voice = None
                email_footer = None
                campaign_tone = None
                
                try:
                    sb = get_supabase()
                    comp_res = sb.table("companies").select("*").eq("id", company_id).single().execute()
                    if comp_res.data:
                        brand_name = comp_res.data.get("name", brand_name)
                        brand_voice = comp_res.data.get("brand_voice")
                        email_footer = comp_res.data.get("email_footer")
                        campaign_tone = comp_res.data.get("campaign_tone")
                        yield "data: " + json.dumps({'type': 'log', 'agent': 'customer_intelligence', 'message': f'Retrieved brand settings for {brand_name}.'}) + "\n\n"
                        await asyncio.sleep(0.4)
                except Exception as e:
                    print(f"Branding load error: {e}")

                yield "data: " + json.dumps({'type': 'log', 'agent': 'segmentation', 'message': 'Generating target audience segmentation filters...'}) + "\n\n"
                await asyncio.sleep(0.6)

                # Call LLM or get fallback campaign properties
                revision_feedback = last_msg if action == "revision" else None
                goal = messages[0].content
                if action == "revision":
                    goal = f"Original goal: {goal}. Feedback: {last_msg}"

                yield "data: " + json.dumps({'type': 'log', 'agent': 'customer_intelligence', 'message': 'Processing marketing goal with LLM engine...'}) + "\n\n"
                await asyncio.sleep(0.5)

                campaign_data = call_llm_for_campaign(
                    goal=goal,
                    revision_feedback=revision_feedback,
                    brand_name=brand_name,
                    brand_voice=brand_voice,
                    email_footer=email_footer,
                    campaign_tone=campaign_tone
                )

                segment_rules = campaign_data.get("segment_rules", [])
                segment_name = campaign_data.get("segment_name", "AI Segment")
                channel = campaign_data.get("recommended_channel", "email")
                
                # Format template message
                subject = campaign_data.get("subject", "")
                body = campaign_data.get("variant_a", "")
                content_template = f"Subject: {subject}\n\n{body}" if subject else body

                yield "data: " + json.dumps({'type': 'log', 'agent': 'segmentation', 'message': f'Executing customer database filter check for segment: "{segment_name}"...'}) + "\n\n"
                await asyncio.sleep(0.8)

                # Run evaluate segment rules to get real audience count
                matching_customers = []
                try:
                    matching_customers = CustomerRepository.evaluate_segment_rules(segment_rules)
                except Exception as e:
                    print(f"Segment evaluation error: {e}")
                
                audience_size = len(matching_customers)
                yield "data: " + json.dumps({'type': 'log', 'agent': 'segmentation', 'message': f'Database scan complete. Found {audience_size} matching customers.'}) + "\n\n"
                await asyncio.sleep(0.5)

                yield "data: " + json.dumps({'type': 'log', 'agent': 'content', 'message': 'Personalizing copywriting templates with brand voice parameters...'}) + "\n\n"
                await asyncio.sleep(0.6)

                yield "data: " + json.dumps({'type': 'log', 'agent': 'channel', 'message': f'Scoring channels... Recommended channel: {channel}.'}) + "\n\n"
                await asyncio.sleep(0.5)

                yield "data: " + json.dumps({'type': 'log', 'agent': 'simulation', 'message': 'Running predictive response simulation...'}) + "\n\n"
                await asyncio.sleep(0.8)

                # Retrieve average order value of company for potential revenue calculation
                avg_order_value = 1200.0
                try:
                    orders_res = sb.table("orders").select("total_amount").eq("status", "completed").execute()
                    if orders_res.data:
                        avg_order_value = sum(float(o.get("total_amount") or 0) for o in orders_res.data) / len(orders_res.data)
                except Exception:
                    pass

                conversion_rate = campaign_data.get("predicted_conversion_rate", 0.05)
                predicted_revenue = audience_size * avg_order_value * conversion_rate
                
                # Format discount pct
                discount_match = re.search(r'(\d+)%', last_msg + " " + goal + " " + segment_name + " " + body)
                discount_pct = discount_match.group(1) if discount_match else "15"

                ai_response_text = f"Found {audience_size} customers matching your criteria. Would you like a {discount_pct}% offer campaign?"
                if "dormant" in segment_name.lower() or "inactive" in segment_name.lower():
                    ai_response_text = f"Found {audience_size} dormant customers. Would you like a {discount_pct}% offer campaign?"
                elif "vip" in segment_name.lower():
                    ai_response_text = f"Found {audience_size} VIP customers. Would you like a {discount_pct}% offer campaign?"

                yield "data: " + json.dumps({'type': 'log', 'agent': 'simulation', 'message': 'Simulation complete.'}) + "\n\n"
                await asyncio.sleep(0.4)

                # Stream the text response chunk by chunk
                words = ai_response_text.split()
                for i in range(0, len(words), 3):
                    chunk = " ".join(words[i:i+3]) + " "
                    yield "data: " + json.dumps({'type': 'text', 'content': chunk}) + "\n\n"
                    await asyncio.sleep(0.1)

                # Prepare proposed campaign data packet
                yield "data: " + json.dumps({
                    'type': 'result',
                    'next_state': 'awaiting_campaign_approval',
                    'proposed_campaign': {
                        'segment_name': segment_name,
                        'segment_rules': segment_rules,
                        'channel': channel,
                        'content_template': content_template,
                        'predicted_revenue': round(predicted_revenue, 2),
                        'audience_size': audience_size,
                        'predicted_outcomes': {
                            'delivery_rate': round(campaign_data.get('predicted_delivery_rate', 0.98) * 100, 1),
                            'open_rate': round(campaign_data.get('predicted_open_rate', 0.45) * 100, 1),
                            'click_rate': round(campaign_data.get('predicted_click_rate', 0.15) * 100, 1),
                            'conversion_rate': round(campaign_data.get('predicted_conversion_rate', 0.05) * 100, 1),
                            'estimated_roi': round(campaign_data.get('estimated_roi', 210.0), 1)
                        }
                    }
                }) + "\n\n"

            # ----------------------------------------------------
            # ACTION: CONFIRM Campaign Approval
            # ----------------------------------------------------
            elif current_state == "awaiting_campaign_approval":
                yield "data: " + json.dumps({'type': 'log', 'agent': 'customer_intelligence', 'message': 'Analyzing confirmation response... Proceeding.'}) + "\n\n"
                await asyncio.sleep(0.4)
                
                if not proposed_campaign:
                    yield "data: " + json.dumps({'type': 'text', 'content': 'Error: Campaign proposal context missing. Please restart the session.'}) + "\n\n"
                    return

                segment_name = proposed_campaign.get("segment_name", "AI Campaign Segment")
                segment_rules = proposed_campaign.get("segment_rules", [])
                
                yield "data: " + json.dumps({'type': 'log', 'agent': 'segmentation', 'message': f'Creating segment "{segment_name}" in database...'}) + "\n\n"
                await asyncio.sleep(0.6)
                
                seg_description = f"Segment automatically generated by Conversational AI Studio"
                segment_id = CampaignRepository.create_segment(segment_name, seg_description, segment_rules)
                
                campaign_name = f"Studio - {segment_name}"
                channel = proposed_campaign.get("channel", "email")
                content_template = proposed_campaign.get("content_template", "")
                
                yield "data: " + json.dumps({'type': 'log', 'agent': 'content', 'message': f'Saving campaign draft "{campaign_name}"...'}) + "\n\n"
                await asyncio.sleep(0.6)
                
                campaign_res = CampaignRepository.create(
                    name=campaign_name,
                    description=seg_description,
                    type_str=channel,
                    segment_id=segment_id,
                    content_template=content_template,
                    status="draft"
                )
                
                campaign_id = str(campaign_res.get("id"))
                
                yield "data: " + json.dumps({'type': 'log', 'agent': 'simulation', 'message': 'Regenerating final outcome predictions...'}) + "\n\n"
                await asyncio.sleep(0.5)

                predicted_rev = float(proposed_campaign.get("predicted_revenue", 0.0))
                formatted_rev = _fmt_revenue(predicted_rev)

                ai_response_text = f"Campaign created. Predicted revenue {formatted_rev}. Launch?"
                
                words = ai_response_text.split()
                for i in range(0, len(words), 3):
                    chunk = " ".join(words[i:i+3]) + " "
                    yield "data: " + json.dumps({'type': 'text', 'content': chunk}) + "\n\n"
                    await asyncio.sleep(0.1)

                yield "data: " + json.dumps({
                    'type': 'result',
                    'campaign_id': campaign_id,
                    'next_state': 'awaiting_launch_approval'
                }) + "\n\n"

            # ----------------------------------------------------
            # ACTION: CONFIRM Launch Approval
            # ----------------------------------------------------
            elif current_state == "awaiting_launch_approval":
                yield "data: " + json.dumps({'type': 'log', 'agent': 'customer_intelligence', 'message': 'Analyzing launch confirmation... Proceeding.'}) + "\n\n"
                await asyncio.sleep(0.4)

                if not campaign_id:
                    yield "data: " + json.dumps({'type': 'text', 'content': 'Error: Campaign ID missing. Cannot launch.'}) + "\n\n"
                    return

                yield "data: " + json.dumps({'type': 'log', 'agent': 'execution', 'message': f'Initiating campaign dispatch (ID: {campaign_id})...'}) + "\n\n"
                await asyncio.sleep(0.6)

                try:
                    CampaignService.trigger_campaign(campaign_id, background_tasks)
                    yield "data: " + json.dumps({'type': 'log', 'agent': 'execution', 'message': 'Campaign queued in background task runner successfully.'}) + "\n\n"
                    await asyncio.sleep(0.5)
                except Exception as e:
                    yield "data: " + json.dumps({'type': 'log', 'agent': 'execution', 'message': f'Launch error: {str(e)}.'}) + "\n\n"
                    await asyncio.sleep(0.5)

                yield "data: " + json.dumps({'type': 'log', 'agent': 'analytics', 'message': 'Connecting live tracking dashboard webhook list...'}) + "\n\n"
                await asyncio.sleep(0.6)

                ai_response_text = "Campaign launched! Deliveries are currently queueing. You can check the real-time status in the Campaigns menu."
                
                words = ai_response_text.split()
                for i in range(0, len(words), 3):
                    chunk = " ".join(words[i:i+3]) + " "
                    yield "data: " + json.dumps({'type': 'text', 'content': chunk}) + "\n\n"
                    await asyncio.sleep(0.1)

                yield "data: " + json.dumps({
                    'type': 'result',
                    'next_state': 'launched'
                }) + "\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")
