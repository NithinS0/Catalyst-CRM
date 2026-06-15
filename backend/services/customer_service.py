import json
from typing import Dict, Any, List, Optional
from backend.database.repositories.customer_repository import CustomerRepository
from backend.database.repositories.campaign_repository import CampaignRepository
from backend.database.repositories.memory_repository import MemoryRepository

class CustomerService:
    @staticmethod
    def list_customers() -> List[Dict[str, Any]]:
        return CustomerRepository.list_all()

    @staticmethod
    def create_customer(
        first_name: str,
        last_name: str,
        email: str,
        phone: Optional[str],
        company: Optional[str],
        status: str,
        lead_score: int,
        custom_attributes: Dict[str, Any]
    ) -> Dict[str, Any]:
        res = CustomerRepository.create(
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            company=company,
            status=status,
            lead_score=lead_score,
            custom_attributes=custom_attributes
        )
        # Create initial interaction embedding context
        intro_text = f"Customer profile created: {res['first_name']} {res['last_name']} works at {res['company'] or 'None'} as {res['status']}."
        MemoryRepository.save_interaction_embedding(str(res['id']), intro_text, {"type": "system_init"})
        return res

    @staticmethod
    def get_customer_detail(customer_id: str, search_query: Optional[str] = None) -> Dict[str, Any]:
        customer = CustomerRepository.get_by_id(customer_id)
        if not customer:
            raise ValueError("Customer not found")
            
        interactions = CustomerRepository.list_interactions(customer_id)
        
        similar_memories = []
        if search_query:
            similar_memories = MemoryRepository.search_similar_interactions(customer_id, search_query, limit=3)
            similar_memories = [dict(m) for m in similar_memories]
            
        return {
            "customer": customer,
            "timeline": interactions or [],
            "relevant_memories": similar_memories
        }

    @staticmethod
    def update_customer(customer_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        res = CustomerRepository.update(customer_id, updates)
        if not res:
            raise ValueError("Customer not found")
        return res

    @staticmethod
    def add_interaction(customer_id: str, type_str: str, summary: str, details: Optional[str]) -> Dict[str, Any]:
        customer = CustomerRepository.get_by_id(customer_id)
        if not customer:
            raise ValueError("Customer not found")
            
        res = CustomerRepository.add_interaction(customer_id, type_str, summary, details)
        
        # Ingest into vector embeddings memory for RAG search
        embedding_text = f"[{type_str.upper()}] Summary: {summary}. Details: {details or ''}"
        MemoryRepository.save_interaction_embedding(customer_id, embedding_text, {"interaction_id": res["id"], "type": type_str})
        return res

    @staticmethod
    def list_segments() -> List[Dict[str, Any]]:
        return CampaignRepository.list_segments()

    @staticmethod
    def create_segment(name: str, description: Optional[str], definition: List[Dict[str, Any]]) -> Dict[str, Any]:
        seg_id = CampaignRepository.create_segment(name, description or "", definition)
        return CampaignRepository.get_segment_by_id(seg_id)

    @staticmethod
    def evaluate_segment(segment_id: str) -> Dict[str, Any]:
        segment = CampaignRepository.get_segment_by_id(segment_id)
        if not segment:
            raise ValueError("Segment not found")
            
        definition = segment["definition"]
        if isinstance(definition, str):
            definition = json.loads(definition)
            
        matching_customers = CustomerRepository.evaluate_segment_rules(definition)
        return {
            "segment_id": segment_id,
            "segment_name": segment["name"],
            "count": len(matching_customers) if matching_customers else 0,
            "customers": matching_customers or []
        }

    @staticmethod
    def delete_customer(customer_id: str) -> Dict[str, Any]:
        customer = CustomerRepository.get_by_id(customer_id)
        if not customer:
            raise ValueError("Customer not found")
        CustomerRepository.delete(customer_id)
        return {"message": "Customer deleted successfully", "id": customer_id}

    @staticmethod
    def get_customer_orders(customer_id: str) -> List[Dict[str, Any]]:
        customer = CustomerRepository.get_by_id(customer_id)
        if not customer:
            raise ValueError("Customer not found")
        return CustomerRepository.list_orders(customer_id)
