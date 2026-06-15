import json
from typing import List, Optional, Dict, Any
from backend.database.supabase import execute_query, execute_insert, get_db_cursor

class CustomerRepository:
    @staticmethod
    def list_all() -> List[Dict[str, Any]]:
        query = "SELECT * FROM public.customers ORDER BY created_at DESC;"
        return execute_query(query) or []

    @staticmethod
    def get_by_id(customer_id: str) -> Optional[Dict[str, Any]]:
        res = execute_query("SELECT * FROM public.customers WHERE id = %s;", (customer_id,))
        return res[0] if res else None

    @staticmethod
    def create(
        first_name: str,
        last_name: str,
        email: str,
        phone: Optional[str],
        company: Optional[str],
        status: str,
        lead_score: int,
        custom_attributes: Dict[str, Any]
    ) -> Dict[str, Any]:
        query = """
            INSERT INTO public.customers (first_name, last_name, email, phone, company, status, lead_score, custom_attributes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *;
        """
        params = (
            first_name,
            last_name,
            email,
            phone,
            company,
            status,
            lead_score,
            json.dumps(custom_attributes)
        )
        return execute_insert(query, params)

    @staticmethod
    def update(customer_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        # Fetch existing record first
        existing = CustomerRepository.get_by_id(customer_id)
        if not existing:
            return None

        # Build update query dynamically or statically
        first_name = updates.get("first_name", existing["first_name"])
        last_name = updates.get("last_name", existing["last_name"])
        email = updates.get("email", existing["email"])
        phone = updates.get("phone", existing["phone"])
        company = updates.get("company", existing["company"])
        status = updates.get("status", existing["status"])
        lead_score = updates.get("lead_score", existing["lead_score"])
        
        custom_attrs = updates.get("custom_attributes")
        if custom_attrs is not None:
            custom_attributes = json.dumps(custom_attrs)
        else:
            custom_attributes = json.dumps(existing["custom_attributes"])

        query = """
            UPDATE public.customers
            SET first_name = %s, last_name = %s, email = %s, phone = %s, company = %s, status = %s, lead_score = %s, custom_attributes = %s, updated_at = now()
            WHERE id = %s
            RETURNING *;
        """
        params = (first_name, last_name, email, phone, company, status, lead_score, custom_attributes, customer_id)
        return execute_insert(query, params)

    @staticmethod
    def increment_lead_score(customer_id: str, amount: int) -> Optional[int]:
        query = """
            UPDATE public.customers
            SET lead_score = lead_score + %s, updated_at = NOW()
            WHERE id = %s
            RETURNING lead_score;
        """
        res = execute_query(query, (amount, customer_id))
        return res[0]["lead_score"] if res else None

    @staticmethod
    def list_interactions(customer_id: str) -> List[Dict[str, Any]]:
        query = "SELECT * FROM public.interactions WHERE customer_id = %s ORDER BY created_at DESC;"
        return execute_query(query, (customer_id,)) or []

    @staticmethod
    def add_interaction(customer_id: str, type_str: str, summary: str, details: Optional[str]) -> Dict[str, Any]:
        query = """
            INSERT INTO public.interactions (customer_id, type, summary, details)
            VALUES (%s, %s, %s, %s)
            RETURNING *;
        """
        params = (customer_id, type_str, summary, details)
        return execute_insert(query, params)

    @staticmethod
    def evaluate_segment_rules(definition: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        ALLOWED_FIELDS = {
            "status", "lead_score", "company", "first_name", "last_name", "email", "phone",
            "days_since_last_activity", "last_active"
        }
        OPERATOR_MAP = {
            "eq": "=",
            "neq": "!=",
            "gt": ">",
            "gte": ">=",
            "lt": "<",
            "lte": "<=",
            "contains": "ILIKE"
        }
        
        sql_clauses = []
        sql_params = []
        
        for rule in definition:
            field = rule.get("field")
            op = rule.get("operator")
            val = rule.get("value")
            
            if field not in ALLOWED_FIELDS:
                raise ValueError(f"Invalid query field: {field}")
                
            if field in ("days_since_last_activity", "last_active"):
                import re
                days = 0
                if isinstance(val, (int, float)):
                    days = int(val)
                else:
                    match = re.search(r'(\d+)', str(val))
                    if match:
                        days = int(match.group(1))
                
                sql_op = OPERATOR_MAP.get(op, "=")
                if field == "days_since_last_activity":
                    sql_clauses.append(f"EXTRACT(DAY FROM NOW() - COALESCE(customers.updated_at, customers.created_at)) {sql_op} CAST(%s AS INTEGER)")
                    sql_params.append(days)
                else:
                    sql_clauses.append(f"COALESCE(customers.updated_at, customers.created_at) {sql_op} NOW() - CAST(%s AS INTEGER) * INTERVAL '1 day'")
                    sql_params.append(days)
            elif op == "in":
                if not isinstance(val, list):
                    raise ValueError("Operator 'in' requires a list value")
                placeholders = ", ".join(["%s"] * len(val))
                sql_clauses.append(f"customers.{field} IN ({placeholders})")
                sql_params.extend(val)
            elif op in OPERATOR_MAP:
                sql_op = OPERATOR_MAP[op]
                if op == "contains":
                    sql_clauses.append(f"customers.{field} ILIKE %s")
                    sql_params.append(f"%{val}%")
                else:
                    sql_clauses.append(f"customers.{field} {sql_op} %s")
                    sql_params.append(val)
            else:
                raise ValueError(f"Unsupported operator: {op}")
                
        base_query = "SELECT * FROM public.customers"
        if sql_clauses:
            base_query += " WHERE " + " AND ".join(sql_clauses)
        base_query += ";"
        
        return execute_query(base_query, tuple(sql_params)) or []

    @staticmethod
    def delete(customer_id: str) -> bool:
        execute_query("DELETE FROM public.customers WHERE id = %s;", (customer_id,))
        return True

    @staticmethod
    def list_orders(customer_id: str) -> List[Dict[str, Any]]:
        query = "SELECT * FROM public.orders WHERE customer_id = %s ORDER BY created_at DESC;"
        return execute_query(query, (customer_id,)) or []
