from backend.database.supabase import get_supabase
from backend.database.repositories.customer_repository import CustomerRepository

def count_customers_for_rules(rules: list) -> int:
    """Count customers matching segment rules using Python-side filtering (Supabase REST compatible)."""
    try:
        matching = CustomerRepository.evaluate_segment_rules(rules)
        return len(matching)
    except Exception as e:
        print(f"[Clustering] count_customers_for_rules failed: {e}")
        return 0
