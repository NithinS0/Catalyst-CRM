"""
Customer Digital Twin Agent
Generates comprehensive AI behavioral profiles for individual customers.

Produces:
- Behavioral summary (natural language)
- Purchase frequency & patterns
- Preferred categories & channel
- Churn risk score & label
- Lifetime value
- Predicted next purchase date
- Recommended action
"""
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List

from backend.database.supabase import get_supabase
from backend.database.repositories.customer_repository import CustomerRepository
from backend.database.repositories.order_repository import OrderRepository
from backend.utils.llm import is_llm_enabled, get_llm_client_and_model


# ─── helpers ─────────────────────────────────────────────────────────────────

def _days_ago(iso_str: str) -> float:
    """Return number of days since an ISO timestamp."""
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - dt).total_seconds() / 86400
    except Exception:
        return 365.0


def _churn_label(score: int) -> str:
    if score >= 75:
        return "critical"
    if score >= 50:
        return "high"
    if score >= 25:
        return "medium"
    return "low"


def _predict_next_purchase(avg_gap_days: Optional[float], last_order_date: Optional[str]) -> Optional[str]:
    """Predict next purchase date based on average purchase gap."""
    if not avg_gap_days or not last_order_date:
        return None
    try:
        last_dt = datetime.fromisoformat(last_order_date.replace("Z", "+00:00"))
        predicted = last_dt + timedelta(days=avg_gap_days)
        return predicted.date().isoformat()
    except Exception:
        return None


# ─── rule-based fallback ──────────────────────────────────────────────────────

def _rule_based_twin(customer: dict, orders: list, interactions: list) -> dict:
    """Deterministic twin when LLM is unavailable."""
    from collections import Counter

    now = datetime.now(timezone.utc)

    # Purchase metrics
    completed_orders = [o for o in orders if o.get("status") == "completed"]
    total_ltv = sum(float(o.get("total_amount") or 0) for o in completed_orders)
    avg_order_value = total_ltv / len(completed_orders) if completed_orders else 0.0

    # Purchase frequency
    if len(completed_orders) >= 2:
        dates = sorted([o["created_at"] for o in completed_orders])
        gaps = []
        for i in range(1, len(dates)):
            try:
                d1 = datetime.fromisoformat(dates[i - 1].replace("Z", "+00:00"))
                d2 = datetime.fromisoformat(dates[i].replace("Z", "+00:00"))
                gaps.append((d2 - d1).days)
            except Exception:
                pass
        avg_gap = int(sum(gaps) / len(gaps)) if gaps else 30
    else:
        avg_gap = None

    # Last order date
    last_order_date = None
    if completed_orders:
        last_order_date = max(o["created_at"] for o in completed_orders)

    # Recency
    recency_days = _days_ago(last_order_date) if last_order_date else 365.0

    # Churn risk
    if recency_days > 180:
        churn_score = 80
    elif recency_days > 90:
        churn_score = 55
    elif recency_days > 45:
        churn_score = 30
    else:
        churn_score = 10

    # Categories from product names (naive)
    categories = []
    for o in completed_orders:
        prod = (o.get("product_name") or o.get("items") or "")
        if isinstance(prod, list):
            for item in prod:
                if isinstance(item, dict):
                    categories.append(item.get("category", "General"))
        elif isinstance(prod, str) and prod:
            categories.append("General")

    top_categories = [k for k, _ in Counter(categories).most_common(3)] or ["General"]

    # Channel preference from interactions
    channel_count: Dict[str, int] = {}
    for i in interactions:
        t = i.get("type", "")
        if t in ("email", "whatsapp", "sms", "push"):
            channel_count[t] = channel_count.get(t, 0) + 1
    preferred_channel = max(channel_count, key=channel_count.get) if channel_count else "email"

    # Recommended action
    if churn_score >= 75:
        action = "Send a personalized win-back offer with a significant discount."
        product = "Best-seller bundle"
    elif avg_order_value and avg_order_value > 2000:
        action = "Introduce premium loyalty tier and exclusive early access."
        product = "Premium collection"
    elif len(completed_orders) == 0:
        action = "Send a first-purchase incentive to convert this lead."
        product = "Starter pack"
    else:
        action = "Send a timely replenishment reminder based on purchase cycle."
        product = "Previous favorites"

    # Behavioral summary
    name = f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip()
    summary_parts = [f"{name} is a {'high-value' if total_ltv > 5000 else 'regular'} customer"]
    if completed_orders:
        summary_parts.append(f"with {len(completed_orders)} completed orders")
        summary_parts.append(f"and a lifetime spend of ₹{total_ltv:,.0f}")
    if avg_gap:
        summary_parts.append(f"purchasing every ~{avg_gap} days on average")
    if preferred_channel:
        summary_parts.append(f"preferring {preferred_channel} for communication")
    behavioral_summary = ". ".join(summary_parts) + "."

    next_purchase = _predict_next_purchase(avg_gap, last_order_date)

    return {
        "behavioral_summary": behavioral_summary,
        "purchase_frequency_days": avg_gap,
        "preferred_categories": top_categories,
        "avg_order_value": round(avg_order_value, 2),
        "total_lifetime_value": round(total_ltv, 2),
        "preferred_channel": preferred_channel,
        "churn_risk_score": churn_score,
        "churn_risk_label": _churn_label(churn_score),
        "predicted_next_purchase_date": next_purchase,
        "recommended_action": action,
        "recommended_product": product,
    }


# ─── LLM-powered twin ─────────────────────────────────────────────────────────

def _llm_twin(customer: dict, orders: list, interactions: list, rule_data: dict) -> dict:
    """Enhance rule-based data with a rich AI narrative."""
    name = f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip()
    orders_summary = "\n".join([
        f"- {o.get('created_at', '')[:10]} | ₹{o.get('total_amount', 0)} | {o.get('status', 'unknown')}"
        for o in orders[-10:]
    ]) or "No orders on record."

    interaction_summary = "\n".join([
        f"- [{i.get('type', '').upper()}] {i.get('summary', '')} ({i.get('created_at', '')[:10]})"
        for i in interactions[-8:]
    ]) or "No interactions logged."

    prompt = f"""
You are a Customer Intelligence AI for a CRM platform. Generate a comprehensive Digital Twin profile for the following customer.

Customer:
  Name: {name}
  Status: {customer.get('status', 'unknown')}
  Lead Score: {customer.get('lead_score', 0)}

Recent Orders (last 10):
{orders_summary}

Recent Interactions (last 8):
{interaction_summary}

Current Rule-Based Analysis:
  - Total Lifetime Value: ₹{rule_data.get('total_lifetime_value', 0):,.2f}
  - Avg Order Value: ₹{rule_data.get('avg_order_value', 0):,.2f}
  - Purchase Frequency: {rule_data.get('purchase_frequency_days', 'unknown')} days
  - Churn Risk Score: {rule_data.get('churn_risk_score', 0)}/100
  - Preferred Channel: {rule_data.get('preferred_channel', 'email')}

Return ONLY a valid JSON object with these fields:
{{
  "behavioral_summary": "<rich 2-3 sentence human-readable profile description>",
  "preferred_categories": ["<cat1>", "<cat2>"],
  "recommended_action": "<specific marketing/CRM action to take now>",
  "recommended_product": "<specific product or product category to recommend>",
  "predicted_next_purchase_date": "<YYYY-MM-DD or null>",
  "preferred_channel": "<email|whatsapp|sms|push>"
}}
"""
    try:
        client, model = get_llm_client_and_model()
        kwargs = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a Customer Intelligence AI. Output strictly valid JSON."},
                {"role": "user", "content": prompt}
            ],
        }
        if "gpt" in model.lower() or "llama-3" in model.lower():
            kwargs["response_format"] = {"type": "json_object"}

        response = client.chat.completions.create(**kwargs)
        content = response.choices[0].message.content
        parsed = json.loads(content)

        # Merge LLM insights into rule_data
        for key in ("behavioral_summary", "preferred_categories", "recommended_action",
                    "recommended_product", "predicted_next_purchase_date", "preferred_channel"):
            if key in parsed and parsed[key]:
                rule_data[key] = parsed[key]
    except Exception as e:
        # Silently fall back to rule-based values
        pass

    return rule_data


# ─── main entry point ─────────────────────────────────────────────────────────

def generate_digital_twin(customer_id: str) -> Dict[str, Any]:
    """
    Generate or refresh a Customer Digital Twin.
    Returns the twin profile dict.
    """
    sb = get_supabase()

    # Load customer
    customer = CustomerRepository.get_by_id(customer_id)
    if not customer:
        raise ValueError(f"Customer {customer_id} not found")

    # Load orders
    orders_res = sb.table("orders").select("*").eq("customer_id", customer_id).order("created_at", desc=True).execute()
    orders = orders_res.data or []

    # Load interactions
    interactions_res = sb.table("interactions").select("*").eq("customer_id", customer_id).order("created_at", desc=True).execute()
    interactions = interactions_res.data or []

    # Rule-based analysis (always runs)
    twin_data = _rule_based_twin(customer, orders, interactions)

    # LLM enhancement (if available)
    if is_llm_enabled():
        twin_data = _llm_twin(customer, orders, interactions, twin_data)

    # Persist to database (upsert)
    record = {
        "customer_id": customer_id,
        "company_id": customer.get("company_id"),
        "behavioral_summary": twin_data.get("behavioral_summary"),
        "purchase_frequency_days": twin_data.get("purchase_frequency_days"),
        "preferred_categories": twin_data.get("preferred_categories", []),
        "avg_order_value": twin_data.get("avg_order_value"),
        "total_lifetime_value": twin_data.get("total_lifetime_value"),
        "preferred_channel": twin_data.get("preferred_channel"),
        "churn_risk_score": twin_data.get("churn_risk_score"),
        "churn_risk_label": twin_data.get("churn_risk_label"),
        "predicted_next_purchase_date": twin_data.get("predicted_next_purchase_date"),
        "recommended_action": twin_data.get("recommended_action"),
        "recommended_product": twin_data.get("recommended_product"),
        "ai_profile": twin_data,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

    # Upsert using customer_id as the conflict key
    upsert_res = sb.table("customer_digital_twins").upsert(
        record,
        on_conflict="customer_id"
    ).execute()

    saved = upsert_res.data[0] if upsert_res.data else record
    return saved


def get_digital_twin(customer_id: str) -> Optional[Dict[str, Any]]:
    """Fetch existing digital twin for a customer. Returns None if not yet generated."""
    sb = get_supabase()
    try:
        res = sb.table("customer_digital_twins").select("*").eq("customer_id", customer_id).limit(1).execute()
        return res.data[0] if (res and res.data) else None
    except Exception:
        return None
