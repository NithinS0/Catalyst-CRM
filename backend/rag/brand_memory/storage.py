from typing import Dict, Any
from backend.database.repositories.memory_repository import MemoryRepository

def store_brand_guideline(content: str, metadata: dict = None) -> Dict[str, Any]:
    return MemoryRepository.store_document(collection="Brand Memory", content=content, metadata=metadata)
