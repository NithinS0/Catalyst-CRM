import random

def should_fail_send() -> bool:
    """
    Returns True if the message sending simulation fails (5% probability).
    """
    return random.random() < 0.05

def should_fail_delivery() -> bool:
    """
    Returns True if the delivery simulation fails (5% probability).
    """
    return random.random() < 0.05

def should_open() -> bool:
    """
    Returns True if the recipient opens the message (70% probability).
    """
    return random.random() <= 0.70

def should_read() -> bool:
    """
    Returns True if the recipient reads the message (85% probability).
    """
    return random.random() <= 0.85

def should_click() -> bool:
    """
    Returns True if the recipient clicks a link in the message (40% probability).
    """
    return random.random() <= 0.40

def should_convert() -> bool:
    """
    Returns True if the recipient converts (25% probability).
    """
    return random.random() <= 0.25
