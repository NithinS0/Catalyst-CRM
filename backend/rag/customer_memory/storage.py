from typing import Dict, Any, Optional
from backend.database.repositories.memory_repository import MemoryRepository

def store_customer_note(customer_id: str, content: str, metadata: dict = None) -> Dict[str, Any]:
    return MemoryRepository.store_document(collection="Customer Memory", content=content, metadata=metadata, customer_id=customer_id)
