from typing import Dict, Any
from backend.agents.callback_processor.event_handler import process_callback_event

class WebhookService:
    @staticmethod
    def process_channel_event(payload: Dict[str, Any]) -> Dict[str, Any]:
        return process_callback_event(payload)
    
