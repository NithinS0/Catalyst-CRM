from typing import List

# Retry backoff delays: 1s, 2s, 4s, 8s, 16s
RETRY_DELAYS: List[float] = [1.0, 2.0, 4.0, 8.0, 16.0]

def get_retry_delay(attempt: int) -> float:
    """
    Returns the retry backoff delay in seconds for the given 0-indexed attempt number.
    """
    if attempt < len(RETRY_DELAYS):
        return RETRY_DELAYS[attempt]
    return RETRY_DELAYS[-1]
