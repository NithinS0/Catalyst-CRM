from typing import List, Dict, Any

def get_fallback_customer_intelligence() -> List[Dict[str, Any]]:
    return [
        {"customerId": "a0000000-0000-0000-0000-000000000001", "name": "Alice Vance", "churnScore": 30, "clvScore": 950, "healthScore": 85, "lifecycleStage": "VIP"}
    ]

def get_fallback_segment_rules() -> List[Dict[str, Any]]:
    return [{"field": "status", "operator": "in", "value": ["active"]}]

def get_fallback_content_variants() -> Dict[str, str]:
    return {
        "variantA": "Subject: Special update\n\nHi {{first_name}}, check out our premium services.",
        "variantB": "Subject: Special update\n\nHi {{first_name}}, unlock your custom RAG modules.",
        "variantC": "Subject: Special update\n\nHi {{first_name}}, review your CRM timeline."
    }
