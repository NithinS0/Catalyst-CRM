import json
import openai
from typing import Dict, Any, List
from backend.config import settings
from backend.utils.llm import call_llm_for_campaign
from backend.agents.segmentation.clustering import count_customers_for_rules
from backend.agents.segmentation.ranking import estimate_segment_impact
from backend.database.repositories.customer_repository import CustomerRepository
from backend.database.supabase import execute_query

def run_segmentation(state: Dict[str, Any]) -> Dict[str, Any]:
    state["current_agent"] = "segmentation"
    logs = state.get("action_logs", [])
    logs.append("[Segmentation Agent] Translating business goal and intelligence models to DB filters...")
    
    try:
        data = call_llm_for_campaign(state["marketing_goal"])
        rules = data.get("segment_rules", [])
        seg_name = data.get("segment_name", "AI Campaign Segment")
        seg_desc = data.get("segment_description", "Segment automatically generated for outreach.")
        
        state["generated_segment_rules"] = rules
        state["generated_segment_name"] = seg_name
        state["generated_segment_description"] = seg_desc
        
        # Count matching audience size using clustering helper
        size = count_customers_for_rules(rules)
        state["audience_size"] = size
        
        # Determine expected impact using ranking helper
        impact = estimate_segment_impact(size, state["marketing_goal"])
        state["expected_impact"] = data.get("expected_impact", impact)
        
        # Fetch target customer list snippet
        target_custs = CustomerRepository.list_all()[:10]
        state["target_customers"] = [
            {
                "id": str(c["id"]),
                "first_name": c["first_name"],
                "last_name": c["last_name"],
                "email": c["email"],
                "phone": c["phone"],
                "company": c["company"],
                "status": c["status"],
                "lead_score": c["lead_score"]
            } for c in target_custs
        ]
        
        logs.append(f"[Segmentation Agent] Identified segment '{seg_name}' ({size} matching profiles). Expected impact: {state['expected_impact']}")
        state["next_node"] = "content"
        state["agent_error"] = None
        state["error_message"] = None
        
    except Exception as e:
        logs.append(f"[Segmentation Agent] Error encountered: {str(e)}")
        state["agent_error"] = "segmentation"
        state["error_message"] = str(e)
        
    state["action_logs"] = logs
    return state

def run_segment_analyzer(state: dict) -> dict:
    """
    Segment Analyzer Node.
    Parses natural language prompts and generates structured SQL-like query parameters.
    """
    logs = state.get("action_logs", [])
    logs.append("[Segment Analyzer] Starting segment criteria analysis...")
    
    messages = state.get("messages", [])
    prompt_query = messages[-1]["content"] if messages else "find high value active customers"
    
    prompt = f"""
    Translate the following natural language request into structured CRM segment criteria.
    
    Allowed fields:
    - status (values: 'lead', 'contact_ready', 'active', 'churn_risk', 'inactive')
    - lead_score (integer 0-100)
    - company (string)
    - days_since_last_activity (integer number of days of inactivity)
    - last_active (string date, e.g. '60 days ago')
    
    Allowed operators:
    - eq (equals)
    - neq (not equals)
    - gte (greater than or equal to)
    - lte (less than or equal to)
    - contains (substring match)
    - in (value must be a list)

    Examples:
    Request: "find active customers with lead score over 80"
    Output: [{{"field": "status", "operator": "eq", "value": "active"}}, {{"field": "lead_score", "operator": "gte", "value": 80}}]

    Request: "inactive or churn risk customers"
    Output: [{{"field": "status", "operator": "in", "value": ["inactive", "churn_risk"]}}]

    Translate this request: "{prompt_query}"
    
    Return a JSON array of criteria:
    """

    suggested_rules = []
    
    from backend.utils.llm import is_llm_enabled, get_llm_client_and_model

    if is_llm_enabled():
        try:
            client, model = get_llm_client_and_model()
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a database segment criteria compiler. You output strictly JSON array without markdown code blocks."},
                    {"role": "user", "content": prompt}
                ]
            )
            clean_content = response.choices[0].message.content.strip()
            if clean_content.startswith("```"):
                clean_content = clean_content.split("\n", 1)[1].rsplit("\n", 1)[0].strip()
            suggested_rules = json.loads(clean_content)
            logs.append(f"[Segment Analyzer] Synthesized criteria: {suggested_rules}")
        except Exception as e:
            logs.append(f"[Segment Analyzer] LLM compiled failed: {e}. Running fallback rule compiler.")
            suggested_rules = _fallback_rules(prompt_query)
    else:
        logs.append("[Segment Analyzer] LLM engine Key missing. Running rule-based compiler.")
        suggested_rules = _fallback_rules(prompt_query)
        
    state["action_logs"] = logs
    state["suggested_segment_rules"] = suggested_rules
    state["proposed_content"] = f"Segment rules parsed successfully: {json.dumps(suggested_rules)}"
    state["next_node"] = "end"
    return state

def _fallback_rules(prompt: str) -> list:
    """
    Fallback parser based on regex keyword match.
    """
    rules = []
    p_lower = prompt.lower()
    
    if "inactive" in p_lower and "churn" in p_lower:
        rules.append({"field": "status", "operator": "in", "value": ["inactive", "churn_risk"]})
    elif "active" in p_lower:
        rules.append({"field": "status", "operator": "eq", "value": "active"})
    elif "inactive" in p_lower:
        rules.append({"field": "status", "operator": "eq", "value": "inactive"})
    elif "churn" in p_lower:
        rules.append({"field": "status", "operator": "eq", "value": "churn_risk"})
    elif "lead" in p_lower:
        rules.append({"field": "status", "operator": "eq", "value": "lead"})

    if "score" in p_lower:
        if "over" in p_lower or "above" in p_lower or "gte" in p_lower or "greater" in p_lower or ">" in p_lower:
            rules.append({"field": "lead_score", "operator": "gte", "value": 80})
        elif "under" in p_lower or "below" in p_lower or "less" in p_lower or "<" in p_lower:
            rules.append({"field": "lead_score", "operator": "lte", "value": 40})
            
    if not rules:
        rules.append({"field": "status", "operator": "eq", "value": "active"})
        
    return rules
