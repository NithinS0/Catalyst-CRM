from typing import Dict, Any
from backend.agents.fallback.recovery import (
    get_fallback_customer_intelligence,
    get_fallback_segment_rules,
    get_fallback_content_variants
)

def run_fallback(state: Dict[str, Any]) -> Dict[str, Any]:
    state["current_agent"] = "fallback"
    logs = state.get("action_logs", [])
    
    last_failed = state["failed_agents"][-1] if state["failed_agents"] else "unknown"
    logs.append(f"[Fallback Agent] Alert: Agent '{last_failed}' failed. Intervening to restore state using fallback recovery values...")
    
    state["degraded_mode"] = True
    
    if last_failed == "customer_intelligence":
        state["customer_intelligence"] = get_fallback_customer_intelligence()
        state["fallback_actions"].append("Load default customer intelligence scores")
        state["next_node"] = "segmentation"
        
    elif last_failed == "segmentation":
        state["generated_segment_rules"] = get_fallback_segment_rules()
        state["generated_segment_name"] = "Fallback Segment Directory"
        state["audience_size"] = 100
        state["fallback_actions"].append("Load default customer active status rules")
        state["next_node"] = "content"
        
    elif last_failed == "content":
        state["content_variants"] = get_fallback_content_variants()
        state["campaign_message"] = state["content_variants"]["variantA"]
        state["fallback_actions"].append("Load pre-approved static email templates")
        state["next_node"] = "channel"
        
    elif last_failed == "channel":
        state["recommended_channel"] = "email"
        state["fallback_actions"].append("Default channel to EMAIL")
        state["next_node"] = "simulation"
        
    elif last_failed == "simulation":
        state["predicted_outcomes"] = {
            "predictedDeliveryRate": 0.98,
            "predictedOpenRate": 0.35,
            "predictedClickRate": 0.10,
            "predictedConversionRate": 0.03,
            "predictedRevenue": 500.0,
            "roiScore": 120.0,
            "confidence": 0.50
        }
        state["roi_score"] = 120.0
        state["is_roi_approved"] = True
        state["fallback_actions"].append("Skip outcome validation constraints")
        state["next_node"] = "end"
        
    elif last_failed == "execution":
        state["execution_status"] = "queued_manual"
        state["fallback_actions"].append("Queue communications for manual approval send")
        state["next_node"] = "end"
        
    elif last_failed == "analytics":
        state["analytics_metrics"] = {"sent": 0, "opened": 0, "clicked": 0, "revenue": 0.0}
        state["analytics_insights"] = ["Failed to calculate campaign metrics. Switched to raw values mode."]
        state["fallback_actions"].append("Render empty raw metrics reports")
        state["next_node"] = "end"
        
    else:
        state["next_node"] = "end"
        
    logs.append(f"[Fallback Agent] Restored workflow. Continuing to next step: '{state['next_node']}'.")
    state["action_logs"] = logs
    return state
