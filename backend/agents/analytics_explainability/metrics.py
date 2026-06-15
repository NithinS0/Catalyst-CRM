from typing import Dict, Any
from backend.database.supabase import execute_query

def calculate_campaign_metrics(campaign_id: str) -> Dict[str, Any]:
    # Fetch stats
    sent_res = execute_query(
        "SELECT COUNT(*) as count FROM public.campaign_deliveries WHERE campaign_id = %s;", (campaign_id,)
    )
    opened_res = execute_query(
        "SELECT COUNT(*) as count FROM public.campaign_deliveries WHERE campaign_id = %s AND status = 'opened';", (campaign_id,)
    )
    clicked_res = execute_query(
        "SELECT COUNT(*) as count FROM public.campaign_deliveries WHERE campaign_id = %s AND status = 'clicked';", (campaign_id,)
    )
    
    sent = sent_res[0]["count"] if sent_res else 0
    opened = opened_res[0]["count"] if opened_res else 0
    clicked = clicked_res[0]["count"] if clicked_res else 0
    
    # Attributed revenue
    rev_res = execute_query(
        """
        SELECT COALESCE(SUM(o.total_amount), 0) as total
        FROM public.orders o
        JOIN public.campaign_deliveries cd ON o.customer_id = cd.customer_id
        WHERE cd.campaign_id = %s AND o.status = 'completed' AND o.created_at >= cd.created_at;
        """,
        (campaign_id,)
    )
    revenue = float(rev_res[0]["total"]) if rev_res else 0.0
    
    return {
        "sent": sent,
        "opened": opened,
        "clicked": clicked,
        "revenue": revenue,
        "open_rate": round((opened / sent * 100) if sent > 0 else 0.0, 1),
        "click_rate": round((clicked / opened * 100) if opened > 0 else 0.0, 1)
    }
