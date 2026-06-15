"""
Multi-agent orchestration workflow built with LangGraph StateGraph.
LLM calls use ChatGroq (via langchain-groq) backed by the Groq API.
Falls back to sequential pure-Python execution if LangGraph import fails.
"""
from typing import TypedDict, List, Dict, Any, Optional
from backend.graph.state import CampaignStudioState
from backend.agents.supervisor.state import create_initial_state

# ── Agent runners ─────────────────────────────────────────────────────────────
from backend.agents.supervisor.agent import run_supervisor, run_orchestrator
from backend.agents.customer_intelligence.agent import (
    run_customer_intelligence, run_lead_scorer,
)
from backend.agents.segmentation.agent import run_segmentation, run_segment_analyzer
from backend.agents.content_personalization.agent import (
    run_content_personalization, run_copywriter,
)
from backend.agents.channel_selection.agent import run_channel_selection
from backend.agents.simulation.agent import run_simulation
from backend.agents.execution.agent import run_execution
from backend.agents.callback_processor.agent import run_callback_processor
from backend.agents.analytics_explainability.agent import run_analytics_explainability
from backend.agents.fallback.agent import run_fallback

# ── Node wrappers (imported for convenience; also used in nodes.py) ───────────
from backend.graph.nodes import (
    supervisor_node,
    customer_intelligence_node,
    segmentation_node,
    content_node,
    channel_node,
    simulation_node,
    execution_node,
    callback_processor_node,
    analytics_node,
    fallback_node,
)
from backend.graph.edges import route_next

# ── Output helper ─────────────────────────────────────────────────────────────

def _extract_output(state: Dict[str, Any]) -> Dict[str, Any]:
    out = state.get("predicted_outcomes") or {}
    return {
        "marketing_goal": state.get("marketing_goal"),
        "action_logs": state.get("action_logs", []),
        "current_agent": state.get("current_agent"),
        "generated_segment_rules": state.get("generated_segment_rules"),
        "generated_segment_name": state.get("generated_segment_name"),
        "audience_size": state.get("audience_size", 0),
        "campaign_message": state.get("campaign_message"),
        "recommended_channel": state.get("recommended_channel"),
        "predicted_outcomes": {
            "delivery_rate": round((out.get("predictedDeliveryRate", 0.98)) * 100, 1),
            "open_rate": round((out.get("predictedOpenRate", 0.45)) * 100, 1),
            "click_rate": round((out.get("predictedClickRate", 0.15)) * 100, 1),
            "conversion_rate": round((out.get("predictedConversionRate", 0.05)) * 100, 1),
            "expected_conversions": int(
                state.get("audience_size", 0)
                * out.get("predictedConversionRate", 0.05)
            ),
            "projected_revenue": round(out.get("predictedRevenue", 0.0), 2),
            "estimated_roi": round(state.get("roi_score") or 210.0, 1),
        },
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 1.  Compile Campaign Studio Graph  (10-Agent LangGraph StateGraph)
# ═══════════════════════════════════════════════════════════════════════════════

try:
    from langgraph.graph import StateGraph, START, END  # modern langgraph ≥ 0.2

    campaign_builder = StateGraph(CampaignStudioState)

    campaign_builder.add_node("supervisor", supervisor_node)
    campaign_builder.add_node("customer_intelligence_node", customer_intelligence_node)
    campaign_builder.add_node("segmentation", segmentation_node)
    campaign_builder.add_node("content", content_node)
    campaign_builder.add_node("channel", channel_node)
    campaign_builder.add_node("simulation", simulation_node)
    campaign_builder.add_node("execution", execution_node)
    campaign_builder.add_node("callback_processor", callback_processor_node)
    campaign_builder.add_node("analytics", analytics_node)
    campaign_builder.add_node("fallback", fallback_node)

    campaign_builder.set_entry_point("supervisor")

    campaign_builder.add_conditional_edges(
        "supervisor",
        route_next,
        {
            "customer_intelligence": "customer_intelligence_node",
            "segmentation": "segmentation",
            "content": "content",
            "channel": "channel",
            "simulation": "simulation",
            "execution": "execution",
            "callback_processor": "callback_processor",
            "analytics": "analytics",
            "fallback": "fallback",
            "__end__": END,
        },
    )

    campaign_builder.add_edge("customer_intelligence_node", "supervisor")
    campaign_builder.add_edge("segmentation", "supervisor")
    campaign_builder.add_edge("content", "supervisor")
    campaign_builder.add_edge("channel", "supervisor")
    campaign_builder.add_edge("simulation", "supervisor")
    campaign_builder.add_edge("execution", "supervisor")
    campaign_builder.add_edge("callback_processor", "supervisor")
    campaign_builder.add_edge("analytics", "supervisor")
    campaign_builder.add_edge("fallback", "supervisor")

    campaign_studio_graph = campaign_builder.compile()
    _LANGGRAPH_AVAILABLE = True

except ImportError:
    campaign_studio_graph = None
    _LANGGRAPH_AVAILABLE = False
    print("[Catalyst] Warning: langgraph not installed — using pure-Python fallback orchestration.")


# ═══════════════════════════════════════════════════════════════════════════════
# 2.  Compile Chat Graph  (4-Agent LangGraph StateGraph)
# ═══════════════════════════════════════════════════════════════════════════════

class AgentState(TypedDict):
    messages: List[Dict[str, Any]]
    customer_id: Optional[str]
    campaign_id: Optional[str]
    action_logs: List[str]
    proposed_content: Optional[str]
    suggested_score: Optional[int]
    suggested_segment_rules: Optional[List[Dict[str, Any]]]
    next_node: Optional[str]


try:
    from langgraph.graph import StateGraph as _SG, END as _END

    chat_builder = _SG(AgentState)

    chat_builder.add_node("orchestrator", run_orchestrator)
    chat_builder.add_node("lead_scorer", run_lead_scorer)
    chat_builder.add_node("copywriter", run_copywriter)
    chat_builder.add_node("segment_analyzer", run_segment_analyzer)

    chat_builder.set_entry_point("orchestrator")

    def _route_chat(state: AgentState) -> str:
        next_n = state.get("next_node")
        if next_n in ("lead_scorer", "copywriter", "segment_analyzer"):
            return next_n
        return _END

    chat_builder.add_conditional_edges(
        "orchestrator",
        _route_chat,
        {
            "lead_scorer": "lead_scorer",
            "copywriter": "copywriter",
            "segment_analyzer": "segment_analyzer",
            "__end__": _END,
        },
    )

    chat_builder.add_edge("lead_scorer", _END)
    chat_builder.add_edge("copywriter", _END)
    chat_builder.add_edge("segment_analyzer", _END)

    chat_compiled_graph = chat_builder.compile()
    _CHAT_LANGGRAPH = True

except ImportError:
    chat_compiled_graph = None
    _CHAT_LANGGRAPH = False


# ── Pure-Python fallback spoke-agent dispatch ─────────────────────────────────

_SPOKE_AGENTS: Dict[str, Any] = {
    "customer_intelligence": run_customer_intelligence,
    "segmentation": run_segmentation,
    "content": run_content_personalization,
    "channel": run_channel_selection,
    "simulation": run_simulation,
    "execution": run_execution,
    "callback_processor": run_callback_processor,
    "analytics": run_analytics_explainability,
    "fallback": run_fallback,
}

_CHAT_AGENTS: Dict[str, Any] = {
    "lead_scorer": run_lead_scorer,
    "copywriter": run_copywriter,
    "segment_analyzer": run_segment_analyzer,
}


def _run_fallback_studio(state: Dict[str, Any]) -> Dict[str, Any]:
    """Pure-Python supervisor ↔ spoke loop — used when LangGraph is unavailable."""
    MAX_ITER = 30
    for _ in range(MAX_ITER):
        state = run_supervisor(state)
        next_node = state.get("next_node", "")
        if not next_node or next_node in ("__end__", "end"):
            state["action_logs"].append("[System] Workflow complete.")
            break
        agent_fn = _SPOKE_AGENTS.get(next_node)
        if not agent_fn:
            state["action_logs"].append(f"[System] Unknown node '{next_node}'. Stopping.")
            break
        try:
            state = agent_fn(state)
        except Exception as exc:
            state["agent_error"] = next_node
            state["error_message"] = str(exc)
            state["action_logs"].append(f"[System] Agent '{next_node}' error: {exc}")
    return state


# ═══════════════════════════════════════════════════════════════════════════════
# 3.  Public Entry Points
# ═══════════════════════════════════════════════════════════════════════════════

def run_campaign_studio_workflow(marketing_goal: str) -> dict:
    """
    Triggers the 10-Agent Campaign Studio planning phase via LangGraph StateGraph.
    Falls back to pure-Python loop if LangGraph is not installed.
    """
    initial_state = create_initial_state(marketing_goal)

    if _LANGGRAPH_AVAILABLE and campaign_studio_graph is not None:
        try:
            res = campaign_studio_graph.invoke(initial_state)
            return _extract_output(res)
        except Exception as e:
            print(f"[Catalyst] LangGraph invocation error: {e}. Switching to fallback.")

    # Pure-Python fallback
    state = _run_fallback_studio(initial_state.copy())
    return _extract_output(state)


def run_campaign_execution_workflow(campaign_id: str) -> dict:
    """
    Triggers the Execution → Analytics spoke sequence for an approved campaign.
    """
    initial_state = create_initial_state("Campaign Execution and Analytics Sync")
    initial_state["campaign_id"] = campaign_id
    initial_state["is_roi_approved"] = True
    initial_state["next_node"] = "execution"

    if _LANGGRAPH_AVAILABLE and campaign_studio_graph is not None:
        try:
            res = campaign_studio_graph.invoke(initial_state)
            return res
        except Exception as e:
            print(f"[Catalyst] LangGraph execution error: {e}. Running fallback.")

    # Fallback: sequential
    state = initial_state.copy()
    for step in ("execution", "analytics"):
        try:
            state = _SPOKE_AGENTS[step](state)
            state["action_logs"].append(f"[System] '{step}' completed.")
        except Exception as exc:
            state["action_logs"].append(f"[System] '{step}' failed: {exc}.")
    return state


def run_agent_workflow(prompt: str, customer_id: Optional[str] = None) -> dict:
    """
    Executes the multi-agent chat workflow (Orchestrator → Specialist).
    Uses LangGraph chat graph when available, otherwise pure-Python routing.
    """
    initial_state: Dict[str, Any] = {
        "messages": [{"role": "user", "content": prompt}],
        "customer_id": customer_id,
        "campaign_id": None,
        "action_logs": ["[System] Initiating multi-agent workflow..."],
        "proposed_content": None,
        "suggested_score": None,
        "suggested_segment_rules": None,
        "next_node": None,
    }

    if _CHAT_LANGGRAPH and chat_compiled_graph is not None:
        try:
            res = chat_compiled_graph.invoke(initial_state)
            return res
        except Exception as e:
            print(f"[Catalyst] LangGraph chat error: {e}. Running fallback.")

    # Pure-Python fallback
    state = initial_state.copy()
    state = run_orchestrator(state)
    next_n = state.get("next_node")
    specialist_fn = _CHAT_AGENTS.get(next_n)

    if specialist_fn:
        try:
            state = specialist_fn(state)
        except Exception as exc:
            import traceback
            tb = traceback.format_exc()
            print(f"[Catalyst] Specialist '{next_n}' raised exception:\n{tb}")
            state["action_logs"].append(f"[System] Specialist '{next_n}' failed: {exc}")
            state["proposed_content"] = f"Agent error ({type(exc).__name__}): {exc}"
    else:
        state["action_logs"].append("[Orchestrator] Handled directly.")
        if not state.get("proposed_content"):
            state["proposed_content"] = (
                "I parsed your request but didn't find a specialized action. "
                "How can I help you with Customers, Campaigns or Segments?"
            )

    state["action_logs"].append("[System] Workflow complete.")
    return state
