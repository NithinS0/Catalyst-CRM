from typing import Dict, Any
from backend.agents.analytics_explainability.metrics import calculate_campaign_metrics
from backend.agents.analytics_explainability.insights import generate_campaign_insights, generate_campaign_summary

def run_analytics_explainability(state: Dict[str, Any]) -> Dict[str, Any]:
    state["current_agent"] = "analytics"
    logs = state.get("action_logs", [])
    logs.append("[Analytics Agent] Fetching campaign metrics from DB and generating explainability insights...")
    
    campaign_id = state.get("campaign_id")
    if not campaign_id:
        state["next_node"] = "end"
        state["agent_error"] = "analytics"
        state["error_message"] = "Missing campaign_id context"
        return state
        
    try:
        # Fetch stats using helper
        metrics = calculate_campaign_metrics(str(campaign_id))
        
        state["analytics_metrics"] = metrics
        state["analytics_insights"] = generate_campaign_insights(metrics)
        state["analytics_summary"] = generate_campaign_summary(metrics)
        
        logs.append("[Analytics Agent] Campaign outcomes insights processed and stored successfully.")
        state["next_node"] = "end"
        state["agent_error"] = None
        state["error_message"] = None
        
    except Exception as e:
        logs.append(f"[Analytics Agent] Error encountered: {str(e)}")
        state["agent_error"] = "analytics"
        state["error_message"] = str(e)
        
    state["action_logs"] = logs
    return state
