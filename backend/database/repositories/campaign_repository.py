import json
from typing import List, Optional, Dict, Any
from backend.database.supabase import execute_query, execute_insert, get_db_cursor

class CampaignRepository:
    @staticmethod
    def list_all() -> List[Dict[str, Any]]:
        query = """
            SELECT c.*, 
                   s.name as segment_name,
                   COUNT(d.id) as total_sent,
                   SUM(CASE WHEN d.status = 'opened' THEN 1 ELSE 0 END) as total_opened,
                   SUM(CASE WHEN d.status = 'clicked' THEN 1 ELSE 0 END) as total_clicked,
                   SUM(CASE WHEN d.status = 'failed' THEN 1 ELSE 0 END) as total_failed
            FROM public.campaigns c
            LEFT JOIN public.segments s ON c.segment_id = s.id
            LEFT JOIN public.campaign_deliveries d ON c.id = d.campaign_id
            GROUP BY c.id, s.name
            ORDER BY c.created_at DESC;
        """
        return execute_query(query) or []

    @staticmethod
    def get_by_id(campaign_id: str) -> Optional[Dict[str, Any]]:
        res = execute_query("SELECT * FROM public.campaigns WHERE id = %s;", (campaign_id,))
        return res[0] if res else None

    @staticmethod
    def get_by_id_with_stats(campaign_id: str) -> Optional[Dict[str, Any]]:
        """Get a campaign with aggregated delivery stats."""
        query = """
            SELECT c.*,
                   s.name as segment_name,
                   COUNT(d.id) as total_sent,
                   SUM(CASE WHEN d.status IN ('opened', 'read') THEN 1 ELSE 0 END) as total_opened,
                   SUM(CASE WHEN d.status = 'clicked' THEN 1 ELSE 0 END) as total_clicked,
                   SUM(CASE WHEN d.status = 'failed' THEN 1 ELSE 0 END) as total_failed
            FROM public.campaigns c
            LEFT JOIN public.segments s ON c.segment_id = s.id
            LEFT JOIN public.campaign_deliveries d ON c.id = d.campaign_id
            WHERE c.id = %s
            GROUP BY c.id, s.name;
        """
        res = execute_query(query, (campaign_id,))
        return res[0] if res else None


    @staticmethod
    def create(
        name: str,
        description: Optional[str],
        type_str: str,
        segment_id: Optional[str],
        content_template: str,
        status: str = "draft"
    ) -> Dict[str, Any]:
        query = """
            INSERT INTO public.campaigns (name, description, type, segment_id, content_template, status)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *;
        """
        params = (name, description, type_str, segment_id, content_template, status)
        return execute_insert(query, params)

    @staticmethod
    def update_status(campaign_id: str, status: str) -> bool:
        query = "UPDATE public.campaigns SET status = %s WHERE id = %s;"
        execute_query(query, (status, campaign_id))
        return True

    @staticmethod
    def create_communication(
        customer_id: str,
        campaign_id: Optional[str],
        channel: str,
        subject: str,
        body: str,
        status: str = "queued"
    ) -> str:
        query = """
            INSERT INTO public.communications (customer_id, campaign_id, channel, direction, subject, body, status)
            VALUES (%s, %s, %s, 'outbound', %s, %s, %s)
            RETURNING id;
        """
        params = (customer_id, campaign_id, channel, subject, body, status)
        res = execute_insert(query, params)
        return str(res["id"]) if res else None

    @staticmethod
    def create_delivery(campaign_id: str, customer_id: str, status: str = "pending") -> bool:
        query = """
            INSERT INTO public.campaign_deliveries (campaign_id, customer_id, status)
            VALUES (%s, %s, %s)
            ON CONFLICT DO NOTHING;
        """
        execute_query(query, (campaign_id, customer_id, status))
        return True

    @staticmethod
    def get_communication_by_id(comm_id: str) -> Optional[Dict[str, Any]]:
        res = execute_query("SELECT status, customer_id, campaign_id FROM public.communications WHERE id = %s;", (comm_id,))
        return res[0] if res else None

    @staticmethod
    def update_communication_status(comm_id: str, status: str) -> bool:
        query = "UPDATE public.communications SET status = %s, updated_at = NOW() WHERE id = %s;"
        execute_query(query, (status, comm_id))
        return True

    @staticmethod
    def check_event_exists(comm_id: str, event_type: str) -> bool:
        query = "SELECT 1 FROM public.communication_events WHERE communication_id = %s AND event_type = %s LIMIT 1;"
        res = execute_query(query, (comm_id, event_type))
        return bool(res)

    @staticmethod
    def insert_communication_event(comm_id: str, event_type: str, metadata: Dict[str, Any]) -> bool:
        query = """
            INSERT INTO public.communication_events (communication_id, event_type, metadata)
            VALUES (%s, %s, %s);
        """
        execute_query(query, (comm_id, event_type, json.dumps(metadata)))
        return True

    @staticmethod
    def get_delivery_status(campaign_id: str, customer_id: str) -> Optional[str]:
        query = "SELECT status FROM public.campaign_deliveries WHERE campaign_id = %s AND customer_id = %s;"
        res = execute_query(query, (campaign_id, customer_id))
        return res[0]["status"] if res else None

    @staticmethod
    def update_delivery(campaign_id: str, customer_id: str, updates: Dict[str, Any]) -> bool:
        fields = []
        params = []
        for key, val in updates.items():
            if key == "status":
                fields.append("status = %s")
                params.append(val)
            elif key == "sent_at":
                fields.append("sent_at = NOW()")
            elif key == "opened_at":
                fields.append("opened_at = NOW()")
            elif key == "clicked_at":
                fields.append("clicked_at = NOW()")
            elif key == "error_message":
                fields.append("error_message = %s")
                params.append(val)
        
        if not fields:
            return False
            
        query = f"""
            UPDATE public.campaign_deliveries 
            SET {", ".join(fields)}
            WHERE campaign_id = %s AND customer_id = %s;
        """
        params.extend([campaign_id, customer_id])
        execute_query(query, tuple(params))
        return True

    @staticmethod
    def list_segments() -> List[Dict[str, Any]]:
        query = "SELECT * FROM public.segments ORDER BY created_at DESC;"
        return execute_query(query) or []

    @staticmethod
    def get_segment_by_id(segment_id: str) -> Optional[Dict[str, Any]]:
        res = execute_query("SELECT * FROM public.segments WHERE id = %s;", (segment_id,))
        return res[0] if res else None

    @staticmethod
    def create_segment(name: str, description: str, definition: List[Dict[str, Any]]) -> str:
        query = """
            INSERT INTO public.segments (name, description, definition)
            VALUES (%s, %s, %s)
            RETURNING id;
        """
        res = execute_insert(query, (name, description, json.dumps(definition)))
        return str(res["id"]) if res else None

    # Verification cleanups
    @staticmethod
    def delete_campaign_deliveries_by_campaign(campaign_id: str):
        execute_query("DELETE FROM public.campaign_deliveries WHERE campaign_id = %s;", (campaign_id,))

    @staticmethod
    def delete_communications_by_campaign(campaign_id: str):
        execute_query("DELETE FROM public.communications WHERE campaign_id = %s;", (campaign_id,))

    @staticmethod
    def delete_campaign(campaign_id: str):
        execute_query("DELETE FROM public.campaigns WHERE id = %s;", (campaign_id,))

    @staticmethod
    def delete_segment(segment_id: str):
        execute_query("DELETE FROM public.segments WHERE id = %s;", (segment_id,))
