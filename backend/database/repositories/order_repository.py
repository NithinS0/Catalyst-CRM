from typing import List, Dict, Any
from backend.database.supabase import get_supabase

class OrderRepository:
    @staticmethod
    def get_rfm_profiles(limit: int = 200) -> List[Dict[str, Any]]:
        sb = get_supabase()
        customers = sb.table("customers").select("id, first_name, last_name, status, lead_score").limit(limit).execute()
        orders = sb.table("orders").select("customer_id, total_amount, created_at").eq("status", "completed").execute()

        order_map: Dict[str, list] = {}
        for o in (orders.data or []):
            order_map.setdefault(o["customer_id"], []).append(o)

        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        results = []
        for c in (customers.data or []):
            cid = c["id"]
            cust_orders = order_map.get(cid, [])
            monetary = sum(float(o.get("total_amount") or 0) for o in cust_orders)
            frequency = len(cust_orders)
            if cust_orders:
                latest = max(o["created_at"] for o in cust_orders)
                try:
                    dt = datetime.fromisoformat(latest.replace("Z", "+00:00"))
                    recency = (now - dt).days
                except Exception:
                    recency = 365.0
            else:
                recency = 365.0
            results.append({**c, "monetary": monetary, "frequency": frequency, "recency": recency})
        return results

    @staticmethod
    def get_average_order_value() -> float:
        res = get_supabase().table("orders").select("total_amount").eq("status", "completed").execute()
        amounts = [float(r["total_amount"]) for r in (res.data or []) if r.get("total_amount")]
        return round(sum(amounts) / len(amounts), 2) if amounts else 145.50
