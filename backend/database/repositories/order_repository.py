from typing import List, Dict, Any, Optional
from backend.database.supabase import execute_query

class OrderRepository:
    @staticmethod
    def get_rfm_profiles(limit: int = 200) -> List[Dict[str, Any]]:
        query = """
            SELECT c.id, c.first_name, c.last_name, c.status, c.lead_score,
                   COALESCE(SUM(o.total_amount), 0) as monetary,
                   COUNT(o.id) as frequency,
                   EXTRACT(DAY FROM NOW() - MAX(o.created_at)) as recency
            FROM public.customers c
            LEFT JOIN public.orders o ON c.id = o.customer_id AND o.status = 'completed'
            GROUP BY c.id, c.first_name, c.last_name, c.status, c.lead_score
            LIMIT %s;
        """
        return execute_query(query, (limit,)) or []

    @staticmethod
    def get_average_order_value() -> float:
        res = execute_query("SELECT AVG(total_amount) as avg_amount FROM public.orders WHERE status = 'completed';")
        if res and res[0]["avg_amount"] is not None:
            return float(res[0]["avg_amount"])
        return 145.50
