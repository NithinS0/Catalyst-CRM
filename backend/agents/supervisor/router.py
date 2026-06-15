from typing import Dict, Any

def route_next_agent(state: Dict[str, Any]) -> str:
    # Router decides next edge based on supervisor's next_node field
    next_node = state.get("next_node", "end")
    if next_node in ["customer_intelligence", "segmentation", "content", "channel", "simulation", "execution", "callback_processor", "analytics", "fallback"]:
        return next_node
    return "__end__"
