from typing import List, Dict, Any, Optional
from backend.database.repositories.memory_repository import MemoryRepository

def retrieve_customer_timeline(customer_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    return MemoryRepository.retrieve_documents(collection="Customer Memory", customer_id=customer_id, limit=limit)

def search_customer_timeline(customer_id: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
    return MemoryRepository.semantic_search(collection="Customer Memory", query=query, customer_id=customer_id, limit=limit)
