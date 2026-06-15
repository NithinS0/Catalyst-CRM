import json
from typing import List, Optional, Dict, Any
from backend.database.supabase import get_supabase, execute_query, execute_insert

class CampaignRepository:
    @staticmethod
    def list_all() -> List[Dict[str, Any]]:
        res = get_supabase().table("campaigns").select("*, segments(name), campaign_deliveries(id, status)").order("created_at", desc=True).execute()
        campaigns = []
        for c in (res.data or []):
            deliveries = c.pop("campaign_deliveries", []) or []
            segment = c.pop("segments", None)
            c["segment_name"] = segment["name"] if segment else None
            c["total_sent"] = len(deliveries)
            c["total_opened"] = sum(1 for d in deliveries if d["status"] == "opened")
            c["total_clicked"] = sum(1 for d in deliveries if d["status"] == "clicked")
            c["total_failed"] = sum(1 for d in deliveries if d["status"] == "failed")
            campaigns.append(c)
        return campaigns

    @staticmethod
    def get_by_id(campaign_id: str) -> Optional[Dict[str, Any]]:
        res = get_supabase().table("campaigns").select("*").eq("id", campaign_id).single().execute()
        return res.data if res.data else None

    @staticmethod
    def get_by_id_with_stats(campaign_id: str) -> Optional[Dict[str, Any]]:
        return CampaignRepository.get_by_id(campaign_id)

    @staticmethod
    def create(name, description, type_str, segment_id, content_template, status="draft") -> Dict[str, Any]:
        res = get_supabase().table("campaigns").insert({
            "name": name, "description": description, "type": type_str,
            "segment_id": segment_id, "content_template": content_template, "status": status
        }).execute()
        return res.data[0] if res.data else {}

    @staticmethod
    def update_status(campaign_id: str, status: str) -> bool:
        get_supabase().table("campaigns").update({"status": status}).eq("id", campaign_id).execute()
        return True

    @staticmethod
    def create_communication(customer_id, campaign_id, channel, subject, body, status="queued") -> str:
        res = get_supabase().table("communications").insert({
            "customer_id": customer_id, "campaign_id": campaign_id,
            "channel": channel, "direction": "outbound",
            "subject": subject, "body": body, "status": status
        }).execute()
        return str(res.data[0]["id"]) if res.data else None

    @staticmethod
    def create_delivery(campaign_id: str, customer_id: str, status: str = "pending") -> bool:
        try:
            get_supabase().table("campaign_deliveries").insert({
                "campaign_id": campaign_id, "customer_id": customer_id, "status": status
            }).execute()
        except Exception:
            pass
        return True

    @staticmethod
    def get_communication_by_id(comm_id: str) -> Optional[Dict[str, Any]]:
        res = get_supabase().table("communications").select("status, customer_id, campaign_id").eq("id", comm_id).single().execute()
        return res.data if res.data else None

    @staticmethod
    def update_communication_status(comm_id: str, status: str) -> bool:
        get_supabase().table("communications").update({"status": status}).eq("id", comm_id).execute()
        return True

    @staticmethod
    def check_event_exists(comm_id: str, event_type: str) -> bool:
        res = get_supabase().table("communication_events").select("id").eq("communication_id", comm_id).eq("event_type", event_type).limit(1).execute()
        return bool(res.data)

    @staticmethod
    def insert_communication_event(comm_id: str, event_type: str, metadata: Dict[str, Any]) -> bool:
        get_supabase().table("communication_events").insert({
            "communication_id": comm_id, "event_type": event_type, "metadata": json.dumps(metadata)
        }).execute()
        return True

    @staticmethod
    def get_delivery_status(campaign_id: str, customer_id: str) -> Optional[str]:
        res = get_supabase().table("campaign_deliveries").select("status").eq("campaign_id", campaign_id).eq("customer_id", customer_id).single().execute()
        return res.data["status"] if res.data else None

    @staticmethod
    def update_delivery(campaign_id: str, customer_id: str, updates: Dict[str, Any]) -> bool:
        get_supabase().table("campaign_deliveries").update(updates).eq("campaign_id", campaign_id).eq("customer_id", customer_id).execute()
        return True

    @staticmethod
    def list_segments() -> List[Dict[str, Any]]:
        res = get_supabase().table("segments").select("*").order("created_at", desc=True).execute()
        return res.data or []

    @staticmethod
    def get_segment_by_id(segment_id: str) -> Optional[Dict[str, Any]]:
        res = get_supabase().table("segments").select("*").eq("id", segment_id).single().execute()
        return res.data if res.data else None

    @staticmethod
    def create_segment(name: str, description: str, definition: List[Dict[str, Any]]) -> str:
        res = get_supabase().table("segments").insert({
            "name": name, "description": description, "definition": definition
        }).execute()
        return str(res.data[0]["id"]) if res.data else None

    @staticmethod
    def delete_campaign_deliveries_by_campaign(campaign_id: str):
        get_supabase().table("campaign_deliveries").delete().eq("campaign_id", campaign_id).execute()

    @staticmethod
    def delete_communications_by_campaign(campaign_id: str):
        get_supabase().table("communications").delete().eq("campaign_id", campaign_id).execute()

    @staticmethod
    def delete_campaign(campaign_id: str):
        get_supabase().table("campaigns").delete().eq("id", campaign_id).execute()

    @staticmethod
    def delete_segment(segment_id: str):
        get_supabase().table("segments").delete().eq("id", segment_id).execute()
