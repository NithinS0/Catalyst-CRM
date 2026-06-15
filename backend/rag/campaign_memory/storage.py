from typing import Dict, Any
from backend.database.repositories.memory_repository import MemoryRepository

def store_campaign_log(content: str, metadata: dict = None) -> Dict[str, Any]:
    return MemoryRepository.store_document(collection="Campaign Memory", content=content, metadata=metadata)
