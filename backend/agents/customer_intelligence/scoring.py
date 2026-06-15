def calculate_churn_score(recency_days: float) -> int:
    return min(max(int((recency_days / 180) * 100), 5), 98)

def calculate_health_score(churn_score: int, frequency: int) -> int:
    return min(max(int(100 - churn_score + (frequency * 5)), 10), 100)

def calculate_clv_score(monetary: float) -> int:
    return int(monetary * 0.1)

def determine_lifecycle_stage(clv_score: int, churn_score: int) -> str:
    if clv_score > 500:
        return "VIP"
    elif churn_score < 40:
        return "Active"
    return "At-Risk"
