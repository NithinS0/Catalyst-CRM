from typing import List, Dict, Any

def estimate_segment_impact(audience_size: int, goal: str) -> str:
    if audience_size == 0:
        return "No audience matched. Impact is zero."
    elif audience_size < 50:
        return "Small targeted segment. High personalized conversion expected."
    elif audience_size < 1000:
        return "Medium-sized segment. Represents a significant percentage of at-risk users."
    else:
        return "Large broadcast audience. High volume, average conversion."
