from typing import List, Dict, Any
from backend.database.supabase import execute_query

class AnalyticsRepository:
    @staticmethod
    def get_events_count() -> int:
        res = execute_query("SELECT COUNT(*) as count FROM public.communication_events;")
        return res[0]["count"] if res else 0

    @staticmethod
    def get_campaigns_count() -> int:
        res = execute_query("SELECT COUNT(*) as count FROM public.campaigns;")
        return res[0]["count"] if res else 0

    @staticmethod
    def get_total_revenue() -> float:
        res = execute_query("SELECT COALESCE(SUM(total_amount), 0) as total FROM public.orders WHERE status = 'completed';")
        return float(res[0]["total"]) if res else 0.0

    @staticmethod
    def get_event_type_counts() -> List[Dict[str, Any]]:
        query = "SELECT event_type, COUNT(*) as count FROM public.communication_events GROUP BY event_type;"
        return execute_query(query) or []

    @staticmethod
    def get_daily_performance(days: int = 7) -> List[Dict[str, Any]]:
        query = """
            SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date,
                   COUNT(CASE WHEN event_type = 'sent' THEN 1 END) as sent,
                   COUNT(CASE WHEN event_type = 'delivered' THEN 1 END) as delivered,
                   COUNT(CASE WHEN event_type = 'opened' THEN 1 END) as opened,
                   COUNT(CASE WHEN event_type = 'clicked' THEN 1 END) as clicked,
                   COUNT(CASE WHEN event_type = 'converted' THEN 1 END) as converted
            FROM public.communication_events
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY date
            ORDER BY date ASC;
        """
        return execute_query(query) or []

    @staticmethod
    def get_channel_comparison() -> List[Dict[str, Any]]:
        query = """
            SELECT c.channel,
                   COUNT(CASE WHEN ce.event_type = 'sent' THEN 1 END) as sent,
                   COUNT(CASE WHEN ce.event_type = 'delivered' THEN 1 END) as delivered,
                   COUNT(CASE WHEN ce.event_type = 'opened' THEN 1 END) as opened,
                   COUNT(CASE WHEN ce.event_type = 'clicked' THEN 1 END) as clicked,
                   COUNT(CASE WHEN ce.event_type = 'converted' THEN 1 END) as converted
            FROM public.communication_events ce
            JOIN public.communications c ON ce.communication_id = c.id
            GROUP BY c.channel;
        """
        return execute_query(query) or []

    @staticmethod
    def get_campaign_comparison(limit: int = 10) -> List[Dict[str, Any]]:
        query = """
            SELECT camp.name, camp.type as channel,
                   COUNT(CASE WHEN ce.event_type = 'sent' THEN 1 END) as sent,
                   COUNT(CASE WHEN ce.event_type = 'delivered' THEN 1 END) as delivered,
                   COUNT(CASE WHEN ce.event_type = 'opened' THEN 1 END) as opened,
                   COUNT(CASE WHEN ce.event_type = 'clicked' THEN 1 END) as clicked,
                   COUNT(CASE WHEN ce.event_type = 'converted' THEN 1 END) as converted
            FROM public.communication_events ce
            JOIN public.communications c ON ce.communication_id = c.id
            JOIN public.campaigns camp ON c.campaign_id = camp.id
            GROUP BY camp.id, camp.name, camp.type
            LIMIT %s;
        """
        return execute_query(query, (limit,)) or []

    @staticmethod
    def get_realtime_events(limit: int = 20) -> List[Dict[str, Any]]:
        query = """
            SELECT ce.id, ce.event_type, ce.metadata, ce.created_at,
                   c.channel, c.subject,
                   cust.first_name, cust.last_name, cust.email
            FROM public.communication_events ce
            JOIN public.communications c ON ce.communication_id = c.id
            JOIN public.customers cust ON c.customer_id = cust.id
            ORDER BY ce.created_at DESC
            LIMIT %s;
        """
        return execute_query(query, (limit,)) or []
