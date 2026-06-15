from backend.graph.state import CampaignStudioState
from backend.agents.supervisor.router import route_next_agent

def route_next(state: CampaignStudioState) -> str:
    return route_next_agent(state)
