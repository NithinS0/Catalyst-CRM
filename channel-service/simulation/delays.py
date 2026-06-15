import random
import time

def get_simulation_delay(min_delay: float = 0.5, max_delay: float = 1.5) -> float:
    """
    Returns a random delay duration in seconds.
    """
    return random.uniform(min_delay, max_delay)

def wait_simulation_delay(min_delay: float = 0.5, max_delay: float = 1.5):
    """
    Suspends execution for a random delay duration.
    """
    time.sleep(get_simulation_delay(min_delay, max_delay))
