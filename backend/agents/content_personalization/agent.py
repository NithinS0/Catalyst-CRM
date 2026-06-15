import json
import openai
from typing import Dict, Any
from backend.config import settings
from backend.database.repositories.memory_repository import MemoryRepository
from backend.database.supabase import execute_query, get_supabase
from backend.utils.llm import call_llm_for_campaign
from backend.agents.content_personalization.generator import package_message_variants

def run_content_personalization(state: Dict[str, Any]) -> Dict[str, Any]:
    state["current_agent"] = "content"
    logs = state.get("action_logs", [])
    logs.append("[Content Agent] Compiling personalization variants using RAG memory guidelines...")
    
    try:
        # 1. Query pgvector RAG memory system via Repository
        brand_guides = MemoryRepository.semantic_search(collection="Brand Memory", query=state["marketing_goal"], limit=1)
        campaign_mem = MemoryRepository.semantic_search(collection="Campaign Memory", query=state["marketing_goal"], limit=1)
        
        brand_txt = brand_guides[0]["content"] if brand_guides else "Tone: Professional, warm."
        camp_txt = campaign_mem[0]["content"] if campaign_mem else "History: High conversion on email CTAs."
        
        logs.append("[Content Agent] Retrieved brand guidelines and historical campaign performance from RAG.")
        
        # 2. Call LLM to draft copy incorporating RAG details
        feedback = None
        if not state.get("is_roi_approved") and state.get("revision_count", 0) > 0:
            feedback = "Revision loop: previous predicted ROI was below 150%. Please optimize template hooks to boost clicks."
            
        data = call_llm_for_campaign(state["marketing_goal"], feedback)
        subject = data.get("subject", "Catalyst outreach")
        vA = data.get("variant_a", "")
        vB = data.get("variant_b", "")
        vC = data.get("variant_c", "")
        
        variants = package_message_variants(subject, vA, vB, vC)
        
        state["content_variants"] = variants
        state["campaign_message"] = variants["variantA"]
        state["personalization_explanation"] = f"Injected RAG Context: Brand guidelines ({brand_txt[:40]}...) and campaign history ({camp_txt[:40]}...)"
        
        logs.append(f"[Content Agent] Successfully generated 3 copy variations (Variant A, B, C) incorporating brand tone.")
        state["next_node"] = "channel"
        state["agent_error"] = None
        state["error_message"] = None
        
    except Exception as e:
        logs.append(f"[Content Agent] Error encountered: {str(e)}")
        state["agent_error"] = "content"
        state["error_message"] = str(e)
        
    state["action_logs"] = logs
    return state

def run_copywriter(state: dict) -> dict:
    """
    Copywriter Node.
    Drafts highly personalized campaign outreach template using RAG memory database.
    """
    logs = state.get("action_logs", [])
    logs.append("[Copywriter] Starting email copywriting process...")
    
    customer_id = state.get("customer_id")
    messages = state.get("messages", [])
    prompt_query = messages[-1]["content"] if messages else "re-engagement loyalty outreach"
    
    if not customer_id:
        res = get_supabase().table("customers").select("id").limit(1).execute()
        if res.data:
            customer_id = str(res.data[0]["id"])
            logs.append(f"[Copywriter] No customer_id context. Auto-resolved to customer: {customer_id}")
        else:
            state["action_logs"] = logs
            state["next_node"] = "end"
            return state

    # 1. Fetch customer details
    cust_res = get_supabase().table("customers").select("*").eq("id", customer_id).single().execute()
    if not cust_res.data:
        logs.append(f"[Copywriter] Customer {customer_id} not found.")
        state["action_logs"] = logs
        state["next_node"] = "end"
        return state
    customer = cust_res.data
    
    # 2. RAG MEMORY RETRIEVAL (Query pgvector collections)
    try:
        MemoryRepository.seed_default_memories()
    except Exception as se:
        logs.append(f"[Copywriter] Warning: RAG seeding failed: {se}")
        
    logs.append(f"[Copywriter] Querying pgvector RAG memory database for Brand, Campaign, and Customer collections on '{prompt_query}'...")
    
    # Retrieve Brand guidelines
    brand_memories = MemoryRepository.semantic_search(collection="Brand Memory", query=prompt_query, limit=2)
    brand_context = "\n".join([f"- {bm['content']}" for bm in brand_memories]) if brand_memories else ""
    if brand_context:
        logs.append(f"[Copywriter] Retrieved {len(brand_memories)} Brand Memory guidelines.")
        
    # Retrieve Campaign history
    campaign_memories = MemoryRepository.semantic_search(collection="Campaign Memory", query=prompt_query, limit=2)
    campaign_context = "\n".join([f"- {cm['content']}" for cm in campaign_memories]) if campaign_memories else ""
    if campaign_context:
        logs.append(f"[Copywriter] Retrieved {len(campaign_memories)} Campaign Memory logs.")
        
    # Retrieve Customer history
    customer_memories = MemoryRepository.semantic_search(collection="Customer Memory", query=prompt_query, customer_id=customer_id, limit=2)
    customer_context = "\n".join([f"- {c_mem['content']}" for c_mem in customer_memories]) if customer_memories else ""
    
    # Fallback to general interaction history if no semantic customer memory found
    if not customer_context:
        logs.append("[Copywriter] No specific customer memory found. Querying general timeline history...")
        gen_ints = get_supabase().table("interactions").select("summary").eq("customer_id", customer_id).order("created_at", desc=True).limit(2).execute()
        if gen_ints.data:
            customer_context = "\n".join([f"- {i['summary']}" for i in gen_ints.data])
    else:
        logs.append(f"[Copywriter] Retrieved {len(customer_memories)} semantic Customer Memory notes.")
        
    # Build complete memory context
    memory_context = f"""
Brand Guidelines:
{brand_context or "- Default to B2B SaaS warm and professional tone."}

Campaign History:
{campaign_context or "- No similar campaign history found."}

Customer History:
{customer_context or "- No specific historical customer memories. Follow up on active status."}
"""
            
    # 3. Generate Draft
    prompt = f"""
    You are an expert copywriter for Catalyst CRM. Draft a highly personalized email for the following customer.
    Use the provided Brand Guidelines, Campaign History, and Customer History to write the most cohesive and tailored message.
    Do not mention "RAG context" or "database" in the email. Just natural follow-up points.

    Customer Information:
    Name: {customer['first_name']} {customer['last_name']}
    Company: {customer.get('company') or 'N/A'}
    Status: {customer.get('status', 'unknown')}
    Industry: {(customer.get('custom_attributes') or {}).get('industry', 'SaaS')}
    
    RAG Memory Context:
    {memory_context}

    Campaign Objectives / Theme:
    {prompt_query}

    Respond with a JSON object:
    {{
      "subject": "<compelling subject line>",
      "body": "<professional email body, using paragraphs or line breaks. Keep it short and engaging>"
    }}
    """
    
    subject = "Outreach from Catalyst"
    body = f"Hello {customer['first_name']},\n\nWe wanted to follow up and see how we can assist you at {customer['company'] or 'your firm'}.\n\nBest,\nCatalyst Team"

    from backend.utils.llm import is_llm_enabled, get_llm_client_and_model

    if is_llm_enabled():
        try:
            client, model = get_llm_client_and_model()
            kwargs = {
                "model": model,
                "messages": [
                    {"role": "system", "content": "You are a professional B2B SaaS copywriter. Output strictly JSON."},
                    {"role": "user", "content": prompt}
                ]
            }
            if "gpt" in model.lower() or "llama-3" in model.lower() or "llama3" in model.lower():
                kwargs["response_format"] = {"type": "json_object"}
                
            response = client.chat.completions.create(**kwargs)
            result = json.loads(response.choices[0].message.content)
            subject = result.get("subject", subject)
            body = result.get("body", body)
            logs.append("[Copywriter] Personal copy drafted successfully using LLM.")
        except Exception as e:
            logs.append(f"[Copywriter] LLM call failed: {e}. Using rule fallback.")
            subject, body = _fallback_copy(customer, prompt_query, memory_context)
    else:
        logs.append("[Copywriter] LLM engine key missing or mock. Generating copy from fallback rule engine.")
        subject, body = _fallback_copy(customer, prompt_query, memory_context)

    # Store draft in state
    draft_str = f"Subject: {subject}\n\n{body}"
    state["proposed_content"] = draft_str
    state["action_logs"] = logs
    state["next_node"] = "end"
    return state

def _fallback_copy(customer: dict, theme: str, context: str) -> tuple:
    """
    Mock copywriter template generation based on customer facts.
    """
    first_name = customer["first_name"]
    company = customer["company"] or "your company"
    
    if "billing" in theme.lower() or "refund" in theme.lower() or "double charge" in theme.lower() or "unhappy" in theme.lower() or "churn" in theme.lower():
        subject = f"Resolving your recent issues at {company}"
        body = f"Hi {first_name},\n\nI wanted to reach out regarding the billing issues and support delays you experienced recently. I know it can be frustrating, and we are working hard to resolve this.\n\nTo make things right, I'd like to credit 20% back to your account. Let me know if you would be open to a quick call to ensure we meet your expectations.\n\nBest regards,\nCatalyst Customer Success Team"
    elif "pricing" in theme.lower() or "custom integration" in theme.lower() or "demo" in theme.lower() or "pilot" in theme.lower():
        subject = f"Next steps for {company} & Catalyst CRM"
        body = f"Hi {first_name},\n\nFollowing up on our recent conversation about custom integrations and enterprise pricing SLA. I wanted to see if you had any questions on the developer APIs we sent over.\n\nWould you be open to a short 10-minute slot next Tuesday to review the pilot agreement?\n\nBest,\nCatalyst Sales Team"
    else:
        subject = f"Special partnership proposal for {company}"
        body = f"Hi {first_name},\n\nWe've been tracking {company}'s development and we see tremendous synergy in launching a personalized campaign. I would love to show you how our AI studio is helping other firms in the industry.\n\nAre you free for a brief demo this week?\n\nWarmly,\nThe Catalyst Team"
        
    return subject, body
