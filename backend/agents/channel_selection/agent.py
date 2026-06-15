from typing import Dict, Any
from backend.utils.llm import call_llm_for_campaign
from backend.agents.channel_selection.selector import score_channels

def run_channel_selection(state: Dict[str, Any]) -> Dict[str, Any]:
    state["current_agent"] = "channel"
    logs = state.get("action_logs", [])
    logs.append("[Channel Agent] Running channel utility scores optimization...")
    
    try:
        data = call_llm_for_campaign(state["marketing_goal"])
        channel = data.get("recommended_channel", "email")
        
        # Calculate channel utility scores
        scores = score_channels(state["marketing_goal"])
        
        state["recommended_channel"] = channel
        state["channel_confidence"] = float(scores.get(channel, 0.85))
        state["channel_scores"] = scores
        
        logs.append(f"[Channel Agent] Recommended Channel: {channel.upper()} (confidence: {state['channel_confidence'] * 100:.0f}%).")
        state["next_node"] = "simulation"
        state["agent_error"] = None
        state["error_message"] = None
        
    except Exception as e:
        logs.append(f"[Channel Agent] Error encountered: {str(e)}")
        state["agent_error"] = "channel"
        state["error_message"] = str(e)
        
    state["action_logs"] = logs
    return state
