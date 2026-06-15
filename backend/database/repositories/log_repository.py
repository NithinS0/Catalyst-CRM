import json
from typing import Optional, Dict, Any
from backend.database.supabase import execute_query, execute_insert

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
        query = """
            INSERT INTO public.agent_logs (agent_name, customer_id, task_description, status, input_data, output_data)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *;
        """
        params = (
            agent_name,
            customer_id,
            task_description,
            status,
            json.dumps(input_data or {}),
            json.dumps(output_data or {})
        )
        return execute_insert(query, params)
