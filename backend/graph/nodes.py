"""
LangGraph node wrapper functions for the Campaign Studio StateGraph.
Each node wraps an agent runner and operates on CampaignStudioState.
"""
from backend.graph.state import CampaignStudioState

from backend.agents.supervisor.agent import run_supervisor
from backend.agents.customer_intelligence.agent import run_customer_intelligence
from backend.agents.segmentation.agent import run_segmentation
from backend.agents.content_personalization.agent import run_content_personalization
from backend.agents.channel_selection.agent import run_channel_selection
from backend.agents.simulation.agent import run_simulation
from backend.agents.execution.agent import run_execution
from backend.agents.callback_processor.agent import run_callback_processor
from backend.agents.analytics_explainability.agent import run_analytics_explainability
from backend.agents.fallback.agent import run_fallback


def supervisor_node(state: CampaignStudioState) -> CampaignStudioState:
    return run_supervisor(state)

def customer_intelligence_node(state: CampaignStudioState) -> CampaignStudioState:
    return run_customer_intelligence(state)

def segmentation_node(state: CampaignStudioState) -> CampaignStudioState:
    return run_segmentation(state)

def content_node(state: CampaignStudioState) -> CampaignStudioState:
    return run_content_personalization(state)

def channel_node(state: CampaignStudioState) -> CampaignStudioState:
    return run_channel_selection(state)

def simulation_node(state: CampaignStudioState) -> CampaignStudioState:
    return run_simulation(state)

def execution_node(state: CampaignStudioState) -> CampaignStudioState:
    return run_execution(state)

def callback_processor_node(state: CampaignStudioState) -> CampaignStudioState:
    return run_callback_processor(state)

def analytics_node(state: CampaignStudioState) -> CampaignStudioState:
    return run_analytics_explainability(state)

def fallback_node(state: CampaignStudioState) -> CampaignStudioState:
    return run_fallback(state)
