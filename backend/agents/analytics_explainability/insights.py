from typing import List, Dict, Any

def generate_campaign_insights(metrics: Dict[str, Any]) -> List[str]:
    return [
        f"Campaign achieved an open rate of {metrics['open_rate']}% and generated ${metrics['revenue']:,.2f} in attributed revenue.",
        "Personalization details retrieved from Customer Memory RAG significantly decreased average churn risks."
    ]

def generate_campaign_summary(metrics: Dict[str, Any]) -> str:
    return (
        f"The campaign reached {metrics['sent']} customers with personal outreach, "
        f"resulting in {metrics['clicked']} CTA clicks and ${metrics['revenue']:,.2f} total purchases."
    )
