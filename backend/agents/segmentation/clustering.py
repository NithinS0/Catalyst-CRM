from backend.database.supabase import execute_query

def count_customers_for_rules(rules: list) -> int:
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
    
    for rule in rules:
        field = rule.get("field")
        op = rule.get("operator")
        val = rule.get("value")
        
        if field not in ALLOWED_FIELDS:
            continue
            
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
                continue
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
                
    base_query = "SELECT COUNT(*) as count FROM public.customers"
    if sql_clauses:
        base_query += " WHERE " + " AND ".join(sql_clauses)
    base_query += ";"
    
    try:
        res = execute_query(base_query, tuple(sql_params))
        if res:
            return res[0]["count"]
    except Exception as e:
        print(f"Error executing count query: {e}")
    return 0
