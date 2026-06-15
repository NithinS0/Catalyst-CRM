from typing import List, Dict, Any
from backend.database.repositories.memory_repository import MemoryRepository

def retrieve_campaign_history(limit: int = 10) -> List[Dict[str, Any]]:
    return MemoryRepository.retrieve_documents(collection="Campaign Memory", limit=limit)

def search_campaign_history(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    return MemoryRepository.semantic_search(collection="Campaign Memory", query=query, limit=limit)
