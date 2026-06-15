from typing import Dict, Any

def run_callback_processor(state: Dict[str, Any]) -> Dict[str, Any]:
    state["current_agent"] = "callback_processor"
    logs = state.get("action_logs", [])
    logs.append("[Callback Processor] Syncing realtime events...")
    
    # Track metrics
    state["callback_events_processed"] = state.get("callback_events_processed", 0) + 1
    state["next_node"] = "analytics"
    state["agent_error"] = None
    state["error_message"] = None
    
    state["action_logs"] = logs
    return state
