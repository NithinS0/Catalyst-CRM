from typing import Dict, Any
from backend.agents.execution.dispatcher import dispatch_campaign

def run_execution(state: Dict[str, Any]) -> Dict[str, Any]:
    state["current_agent"] = "execution"
    logs = state.get("action_logs", [])
    logs.append("[Execution Agent] Initiating approved campaign execution dispatch...")
    
    campaign_id = state.get("campaign_id")
    if not campaign_id:
        logs.append("[Execution Agent] Error: No campaign_id context. Skip.")
        state["next_node"] = "end"
        state["agent_error"] = "execution"
        state["error_message"] = "Missing campaign_id context"
        return state
        
    try:
        sent_count = dispatch_campaign(str(campaign_id))
        
        state["communication_count"] = sent_count
        state["execution_status"] = "dispatched"
        logs.append(f"[Execution Agent] Successfully dispatched campaign {campaign_id} to Channel Service ({sent_count} communications).")
        
        # Route execution to Callback Event Processor
        state["next_node"] = "callback_processor"
        state["agent_error"] = None
        state["error_message"] = None
        
    except Exception as e:
        logs.append(f"[Execution Agent] Error encountered: {str(e)}")
        state["agent_error"] = "execution"
        state["error_message"] = str(e)
        
    state["action_logs"] = logs
    return state
