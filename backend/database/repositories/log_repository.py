import json
from typing import Optional, Dict, Any
from backend.database.supabase import get_supabase

class LogRepository:
    @staticmethod
    def insert_log(
        agent_name: str,
        customer_id: Optional[str],
        task_description: str,
        status: str,
        input_data: Optional[Dict[str, Any]],
        output_data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        try:
            res = get_supabase().table("agent_logs").insert({
                "agent_name": agent_name,
                "customer_id": customer_id,
                "task_description": task_description,
                "status": status,
                "input_data": input_data or {},
                "output_data": output_data or {}
            }).execute()
            return res.data[0] if res.data else {}
        except Exception as e:
            print(f"[LogRepository] Failed to insert log: {e}")
            return {}
