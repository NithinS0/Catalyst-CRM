from typing import List, Dict, Any
from backend.database.repositories.memory_repository import MemoryRepository

def retrieve_brand_guidelines(limit: int = 10) -> List[Dict[str, Any]]:
    return MemoryRepository.retrieve_documents(collection="Brand Memory", limit=limit)

def search_brand_guidelines(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    return MemoryRepository.semantic_search(collection="Brand Memory", query=query, limit=limit)
