from typing import Set, Dict

# Ranks for non-terminal statuses
RANKS = {
    "queued": 0,
    "sent": 1,
    "delivered": 2,
    "opened": 3,
    "read": 4,
    "clicked": 5,
    "converted": 6
}
TERMINAL_STATUSES = {"failed", "unsubscribed"}

DELIVERY_RANKS = {
    "pending": 0,
    "sent": 1,
    "opened": 2,
    "clicked": 3,
    "failed": 4
}

def should_update_communication_status(current: str, proposed: str) -> bool:
    if current in TERMINAL_STATUSES:
        return False
    if proposed in TERMINAL_STATUSES:
        return True
    return RANKS.get(proposed, -1) > RANKS.get(current, -1)

def should_update_delivery_status(current: str, proposed: str) -> bool:
    if current == "failed":
        return False
    if proposed == "failed":
        return True
    return DELIVERY_RANKS.get(proposed, -1) > DELIVERY_RANKS.get(current, -1)

def map_event_to_delivery_status(event: str) -> str:
    if event == "queued":
        return "pending"
    elif event in ("sent", "delivered"):
        return "sent"
    elif event in ("opened", "read"):
        return "opened"
    elif event in ("clicked", "converted"):
        return "clicked"
    elif event == "failed":
        return "failed"
    return "pending"
