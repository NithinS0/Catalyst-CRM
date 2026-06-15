from typing import Dict

def score_channels(goal: str) -> Dict[str, float]:
    # Heuristic scoring based on campaign goals
    g_lower = goal.lower()
    if "vip" in g_lower or "high value" in g_lower:
        return {"email": 0.90, "whatsapp": 0.85, "sms": 0.50, "rcs": 0.35}
    elif "discount" in g_lower or "promo" in g_lower:
        return {"email": 0.70, "whatsapp": 0.95, "sms": 0.80, "rcs": 0.45}
    return {"email": 0.85, "whatsapp": 0.92, "sms": 0.65, "rcs": 0.40}
