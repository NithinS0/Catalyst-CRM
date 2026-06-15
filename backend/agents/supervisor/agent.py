import openai
from typing import Dict, Any, List
from backend.config import settings

def run_supervisor(state: Dict[str, Any]) -> Dict[str, Any]:
    state["current_agent"] = "supervisor"
    
    # Initialize retry control
    if "retry_count" not in state:
        state["retry_count"] = 0
        state["current_attempt"] = 1
        state["failed_agents"] = []
        state["fallback_actions"] = []
        state["degraded_mode"] = False
        state["revision_count"] = 0
        state["agent_retries"] = {}
        
    if "agent_retries" not in state:
        state["agent_retries"] = {}
        
    logs = state.get("action_logs", [])
    
    # Check for agent errors to handle retries
    agent_error = state.get("agent_error")
    if agent_error:
        retries = state.get("agent_retries", {})
        err_msg = state.get("error_message", "Unknown error")
        current_retries = retries.get(agent_error, 0)
        
        if current_retries < 1:
            retries[agent_error] = current_retries + 1
            state["agent_retries"] = retries
            logs.append(f"[Supervisor] Spoke Agent '{agent_error}' failed on attempt {current_retries + 1}/2. Error: {err_msg}. Retrying once...")
            state["next_node"] = agent_error
            # Clear error keys
            state["agent_error"] = None
            state["error_message"] = None
            state["action_logs"] = logs
            return state
        else:
            logs.append(f"[Supervisor] Spoke Agent '{agent_error}' failed persistently after retry. Routing to Fallback Agent...")
            state["failed_agents"].append(agent_error)
            state["next_node"] = "fallback"
            # Clear error keys
            state["agent_error"] = None
            state["error_message"] = None
            state["action_logs"] = logs
            return state
            
    # Planning routing sequence
    next_step = state.get("next_node", "customer_intelligence")
    logs.append(f"[Supervisor] Routing workflow to Spoke Agent: '{next_step}'.")
    state["action_logs"] = logs
    return state

def run_orchestrator(state: dict) -> dict:
    """
    Orchestrator Node.
    Analyzes prompt context and determines which specialist agent to call next.
    """
    logs = state.get("action_logs", [])
    logs.append("[Orchestrator] Reviewing user input request...")
    
    messages = state.get("messages", [])
    if not messages:
        logs.append("[Orchestrator] No messages found. Routing to end.")
        state["next_node"] = "end"
        state["action_logs"] = logs
        return state
        
    latest_msg = messages[-1]["content"].lower()
    
    prompt = f"""
    You are the Orchestrator for Catalyst CRM multi-agent system.
    Based on the following user request, determine the next node to execute.

    User request: "{latest_msg}"

    Choose from:
    1. 'copywriter' (if requesting an email/SMS copy, outreach template, or write-up)
    2. 'lead_scorer' (if requesting to score/evaluate a lead, find hot leads, check client logs)
    3. 'segment_analyzer' (if requesting to filter, create a segment, group customers, or define rules)
    4. 'end' (if it's a general question that does not need a specialist)

    Respond with just one word, the node name.
    """

    next_node = "end"

    from backend.utils.llm import is_llm_enabled, get_llm_client_and_model

    if is_llm_enabled():
        try:
            client, model = get_llm_client_and_model()
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a routing agent. Output only the lowercase node name."},
                    {"role": "user", "content": prompt}
                ]
            )
            raw_choice = response.choices[0].message.content.strip().lower()
            if raw_choice in ["copywriter", "lead_scorer", "segment_analyzer", "end"]:
                next_node = raw_choice
            else:
                next_node = _fallback_routing(latest_msg)
        except Exception as e:
            logs.append(f"[Orchestrator] Routing LLM call failed: {e}. Falling back to rule-based routing.")
            next_node = _fallback_routing(latest_msg)
    else:
        logs.append("[Orchestrator] LLM engine key missing. Routing via rule-based classifier.")
        next_node = _fallback_routing(latest_msg)
        
    logs.append(f"[Orchestrator] Routing user request to: {next_node}")
    state["action_logs"] = logs
    state["next_node"] = next_node
    return state

def _fallback_routing(prompt: str) -> str:
    """
    Keyword router for fallback.
    """
    if any(k in prompt for k in ["write", "email", "sms", "whatsapp", "copy", "draft", "outreach", "campaign"]):
        return "copywriter"
    elif any(k in prompt for k in ["score", "lead", "hot", "cold", "value", "evaluate", "timeline"]):
        return "lead_scorer"
    elif any(k in prompt for k in ["segment", "filter", "group", "inactive", "active", "rule"]):
        return "segment_analyzer"
    return "end"
