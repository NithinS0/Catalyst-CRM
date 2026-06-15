from typing import List, Optional, Dict, Any
from backend.database.supabase import get_supabase

class CustomerRepository:
    @staticmethod
    def list_all() -> List[Dict[str, Any]]:
        res = get_supabase().table("customers").select("*").order("created_at", desc=True).execute()
        return res.data or []

    @staticmethod
    def get_by_id(customer_id: str) -> Optional[Dict[str, Any]]:
        res = get_supabase().table("customers").select("*").eq("id", customer_id).single().execute()
        return res.data if res.data else None

    @staticmethod
    def create(first_name, last_name, email, phone, company, status, lead_score, custom_attributes) -> Dict[str, Any]:
        res = get_supabase().table("customers").insert({
            "first_name": first_name, "last_name": last_name, "email": email,
            "phone": phone, "company": company, "status": status,
            "lead_score": lead_score, "custom_attributes": custom_attributes
        }).execute()
        return res.data[0] if res.data else {}

    @staticmethod
    def update(customer_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        res = get_supabase().table("customers").update(updates).eq("id", customer_id).execute()
        return res.data[0] if res.data else None

    @staticmethod
    def delete(customer_id: str) -> bool:
        get_supabase().table("customers").delete().eq("id", customer_id).execute()
        return True

    @staticmethod
    def increment_lead_score(customer_id: str, amount: int) -> Optional[int]:
        existing = CustomerRepository.get_by_id(customer_id)
        if not existing:
            return None
        new_score = (existing.get("lead_score") or 0) + amount
        res = get_supabase().table("customers").update({"lead_score": new_score}).eq("id", customer_id).execute()
        return res.data[0]["lead_score"] if res.data else None

    @staticmethod
    def list_interactions(customer_id: str) -> List[Dict[str, Any]]:
        res = get_supabase().table("interactions").select("*").eq("customer_id", customer_id).order("created_at", desc=True).execute()
        return res.data or []

    @staticmethod
    def add_interaction(customer_id: str, type_str: str, summary: str, details: Optional[str]) -> Dict[str, Any]:
        res = get_supabase().table("interactions").insert({
            "customer_id": customer_id, "type": type_str, "summary": summary, "details": details
        }).execute()
        return res.data[0] if res.data else {}

    @staticmethod
    def list_orders(customer_id: str) -> List[Dict[str, Any]]:
        res = get_supabase().table("orders").select("*").eq("customer_id", customer_id).order("created_at", desc=True).execute()
        return res.data or []

    @staticmethod
    def evaluate_segment_rules(definition: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Fallback: fetch all customers and filter in Python for PgBouncer compatibility."""
        all_customers = CustomerRepository.list_all()
        results = []
        OPERATOR_MAP = {
            "eq": lambda a, b: str(a).lower() == str(b).lower(),
            "neq": lambda a, b: str(a).lower() != str(b).lower(),
            "gt": lambda a, b: float(a or 0) > float(b),
            "gte": lambda a, b: float(a or 0) >= float(b),
            "lt": lambda a, b: float(a or 0) < float(b),
            "lte": lambda a, b: float(a or 0) <= float(b),
            "contains": lambda a, b: str(b).lower() in str(a or "").lower(),
        }
        for customer in all_customers:
            match = True
            for rule in definition:
                field = rule.get("field")
                op = rule.get("operator")
                val = rule.get("value")
                customer_val = customer.get(field)
                op_fn = OPERATOR_MAP.get(op)
                if op_fn:
                    try:
                        if not op_fn(customer_val, val):
                            match = False
                            break
                    except Exception:
                        match = False
                        break
            if match:
                results.append(customer)
        return results
