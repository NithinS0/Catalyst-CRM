from typing import Dict, Any
from backend.utils.llm import call_llm_for_campaign
from backend.database.repositories.order_repository import OrderRepository
from backend.agents.simulation.predictor import predict_revenue

def run_simulation(state: Dict[str, Any]) -> Dict[str, Any]:
    state["current_agent"] = "simulation"
    logs = state.get("action_logs", [])
    logs.append("[Simulation Agent] Executing campaign pre-flight outcomes simulation...")
    
    try:
        data = call_llm_for_campaign(state["marketing_goal"])
        deliv = data.get("predicted_delivery_rate", 0.98)
        ope = data.get("predicted_open_rate", 0.45)
        cli = data.get("predicted_click_rate", 0.15)
        conv = data.get("predicted_conversion_rate", 0.05)
        roi = data.get("estimated_roi", 210.0)
        
        # Calculate dynamic revenue using average order value
        size = state.get("audience_size", 0)
        aov = OrderRepository.get_average_order_value()
        revenue = predict_revenue(size, conv, aov)
        
        outcomes = {
            "predictedDeliveryRate": deliv,
            "predictedOpenRate": ope,
            "predictedClickRate": cli,
            "predictedConversionRate": conv,
            "predictedRevenue": revenue,
            "roiScore": roi,
            "confidence": 0.88
        }
        
        state["predicted_outcomes"] = outcomes
        state["roi_score"] = roi
        
        # Check ROI threshold for revision loops
        if roi < 150.0 and state.get("revision_count", 0) < 2:
            state["is_roi_approved"] = False
            state["revision_count"] = state.get("revision_count", 0) + 1
            logs.append(f"[Simulation Agent] Predicted ROI ({roi}%) below threshold (150%). Triggering Content Agent revision...")
            state["next_node"] = "content"
        else:
            state["is_roi_approved"] = True
            logs.append(f"[Simulation Agent] Simulation approved. ROI: {roi}%. Revenue: ${revenue:,.2f}.")
            state["next_node"] = "end"
            
        state["agent_error"] = None
        state["error_message"] = None
        
    except Exception as e:
        logs.append(f"[Simulation Agent] Error encountered: {str(e)}")
        state["agent_error"] = "simulation"
        state["error_message"] = str(e)
        
    state["action_logs"] = logs
    return state
