from typing import TypedDict, List, Dict, Any, Optional

class CampaignStudioState(TypedDict):
    # Inputs
    marketing_goal: str
    action_logs: List[str]
    current_agent: str
    
    # Customer Intelligence Spoke
    customer_intelligence: Optional[List[Dict[str, Any]]] # churn/CLV profiles
    
    # Segmentation Spoke
    generated_segment_rules: Optional[List[Dict[str, Any]]]
    generated_segment_name: Optional[str]
    generated_segment_description: Optional[str]
    audience_size: int
    expected_impact: Optional[str]
    target_customers: Optional[List[Dict[str, Any]]]
    
    # Content & Personalization Spoke
    campaign_message: Optional[str] # Main chosen variant text
    content_variants: Optional[Dict[str, str]] # variantA, variantB, variantC
    personalization_explanation: Optional[str]
    
    # Channel Selection Spoke
    recommended_channel: Optional[str]
    channel_confidence: Optional[float]
    channel_scores: Optional[Dict[str, float]]
    
    # Pre-Flight Simulation Spoke
    predicted_outcomes: Optional[Dict[str, Any]]
    roi_score: Optional[float]
    is_roi_approved: bool
    revision_count: int
    
    # Execution Spoke
    campaign_id: Optional[str]
    communication_count: Optional[int]
    execution_status: Optional[str]
    
    # Callback Event Processing Spoke
    callback_events_processed: int
    
    # Analytics & Explainability Spoke
    analytics_metrics: Optional[Dict[str, Any]]
    analytics_insights: Optional[List[str]]
    analytics_summary: Optional[str]
    
    # Fallback and Recovery Spoke
    degraded_mode: bool
    failed_agents: List[str]
    fallback_actions: List[str]
    
    # Routing controls
    next_node: str
    retry_count: int
    current_attempt: int

    # Agent retry/error controls
    agent_error: Optional[str]
    error_message: Optional[str]
    agent_retries: Optional[Dict[str, int]]
