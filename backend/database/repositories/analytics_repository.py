from typing import List, Dict, Any
from backend.database.supabase import get_supabase

class AnalyticsRepository:
    @staticmethod
    def get_events_count() -> int:
        res = get_supabase().table("communication_events").select("id", count="exact").execute()
        return res.count or 0

    @staticmethod
    def get_campaigns_count() -> int:
        res = get_supabase().table("campaigns").select("id", count="exact").execute()
        return res.count or 0

    @staticmethod
    def get_total_revenue() -> float:
        res = get_supabase().table("orders").select("total_amount").eq("status", "completed").execute()
        return sum(float(r.get("total_amount") or 0) for r in (res.data or []))

    @staticmethod
    def get_event_type_counts() -> List[Dict[str, Any]]:
        res = get_supabase().table("communication_events").select("event_type").execute()
        counts: Dict[str, int] = {}
        for row in (res.data or []):
            et = row["event_type"]
            counts[et] = counts.get(et, 0) + 1
        return [{"event_type": k, "count": v} for k, v in counts.items()]

    @staticmethod
    def get_daily_performance(days: int = 7) -> List[Dict[str, Any]]:
        from datetime import datetime, timedelta
        cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
        res = get_supabase().table("communication_events").select("event_type, created_at").gte("created_at", cutoff).execute()
        
        daily: Dict[str, Dict] = {}
        for row in (res.data or []):
            date = row["created_at"][:10]
            if date not in daily:
                daily[date] = {"date": date, "sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "converted": 0}
            et = row["event_type"]
            if et in daily[date]:
                daily[date][et] += 1
        return sorted(daily.values(), key=lambda x: x["date"])

    @staticmethod
    def get_channel_comparison() -> List[Dict[str, Any]]:
        res = get_supabase().table("communications").select("id, channel").execute()
        comm_channels = {r["id"]: r["channel"] for r in (res.data or [])}
        
        evs = get_supabase().table("communication_events").select("communication_id, event_type").execute()
        
        channels: Dict[str, Dict] = {}
        for row in (evs.data or []):
            ch = comm_channels.get(row["communication_id"], "unknown")
            if ch not in channels:
                channels[ch] = {"channel": ch, "sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "converted": 0}
            et = row["event_type"]
            if et in channels[ch]:
                channels[ch][et] += 1
        return list(channels.values())

    @staticmethod
    def get_campaign_comparison(limit: int = 10) -> List[Dict[str, Any]]:
        res = get_supabase().table("campaigns").select("id, name, type").limit(limit).execute()
        camp_map = {r["id"]: {"name": r["name"], "channel": r["type"]} for r in (res.data or [])}
        
        comms = get_supabase().table("communications").select("id, campaign_id").execute()
        comm_camp = {r["id"]: r["campaign_id"] for r in (comms.data or [])}
        
        evs = get_supabase().table("communication_events").select("communication_id, event_type").execute()
        
        campaigns: Dict[str, Dict] = {}
        for row in (evs.data or []):
            camp_id = comm_camp.get(row["communication_id"])
            if not camp_id or camp_id not in camp_map:
                continue
            if camp_id not in campaigns:
                campaigns[camp_id] = {**camp_map[camp_id], "sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "converted": 0}
            et = row["event_type"]
            if et in campaigns[camp_id]:
                campaigns[camp_id][et] += 1
        return list(campaigns.values())

    @staticmethod
    def get_realtime_events(limit: int = 20) -> List[Dict[str, Any]]:
        res = get_supabase().table("communication_events").select(
            "id, event_type, metadata, created_at, communications(channel, subject, customers(first_name, last_name, email))"
        ).order("created_at", desc=True).limit(limit).execute()
        
        results = []
        for row in (res.data or []):
            comm = row.get("communications") or {}
            cust = comm.get("customers") or {}
            results.append({
                "id": str(row["id"]),
                "event_type": row["event_type"],
                "created_at": row["created_at"],
                "channel": comm.get("channel", ""),
                "subject": comm.get("subject", ""),
                "recipient_name": f"{cust.get('first_name', '')} {cust.get('last_name', '')}".strip(),
                "recipient_email": cust.get("email", ""),
                "details": row.get("metadata") or {}
            })
        return results
