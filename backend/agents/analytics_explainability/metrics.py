from typing import Dict, Any
from backend.database.supabase import get_supabase

def calculate_campaign_metrics(campaign_id: str) -> Dict[str, Any]:
    sb = get_supabase()
    deliveries = sb.table("campaign_deliveries").select("id, status, created_at, customer_id").eq("campaign_id", campaign_id).execute()
    rows = deliveries.data or []

    sent = len(rows)
    opened = sum(1 for r in rows if r.get("status") == "opened")
    clicked = sum(1 for r in rows if r.get("status") == "clicked")

    # Attributed revenue: orders placed by delivered customers after campaign delivery
    revenue = 0.0
    try:
        customer_ids = list({r["customer_id"] for r in rows if r.get("customer_id")})
        if customer_ids:
            orders_res = sb.table("orders").select("customer_id, total_amount").eq("status", "completed").in_("customer_id", customer_ids).execute()
            revenue = sum(float(o.get("total_amount") or 0) for o in (orders_res.data or []))
    except Exception as e:
        print(f"[Metrics] Revenue calculation failed: {e}")

    return {
        "sent": sent,
        "opened": opened,
        "clicked": clicked,
        "revenue": revenue,
        "open_rate": round((opened / sent * 100) if sent > 0 else 0.0, 1),
        "click_rate": round((clicked / opened * 100) if opened > 0 else 0.0, 1)
    }
