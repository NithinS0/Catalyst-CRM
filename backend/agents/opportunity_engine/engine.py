"""
AI Opportunity Engine
Scans customer, order, and engagement data to surface proactive growth opportunities.

Opportunity Types:
  - win_back          : Win-Back Campaign (dormant buyers)
  - vip_loyalty       : VIP Loyalty Campaign (top spenders)
  - upsell            : Upsell Opportunity (frequent mid-value buyers)
  - cross_sell        : Cross-Sell Opportunity (single-category buyers)
  - festival_campaign : Festival / Seasonal Campaign (time-based)

Each opportunity returns:
  - id, type, title, description
  - audience_size, potential_revenue
  - confidence_score (0-100)
  - suggested_action
  - segment_rules  (ready to plug into campaign creation)
  - campaign_template (draft subject + body for one-click launch)
"""
import json
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any

from backend.database.supabase import get_supabase
from backend.utils.llm import is_llm_enabled, get_llm_client_and_model

# ─── helpers ──────────────────────────────────────────────────────────────────

OPPORTUNITY_ICONS = {
    "win_back":          "🔄",
    "vip_loyalty":       "👑",
    "upsell":            "📈",
    "cross_sell":        "🛒",
    "festival_campaign": "🎉",
}

OPPORTUNITY_COLORS = {
    "win_back":          "orange",
    "vip_loyalty":       "amber",
    "upsell":            "emerald",
    "cross_sell":        "blue",
    "festival_campaign": "violet",
}

def _days_since(iso_str: str) -> float:
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - dt).total_seconds() / 86400
    except Exception:
        return 999.0

def _fmt_revenue(amount: float) -> str:
    if amount >= 100000:
        return f"₹{amount/100000:.1f}L"
    if amount >= 1000:
        return f"₹{amount/1000:.1f}K"
    return f"₹{amount:.0f}"


# ─── opportunity detectors ────────────────────────────────────────────────────

def _detect_win_back(customers: list, orders: list, avg_order_value: float) -> Dict | None:
    """Customers who bought before but haven't in 60+ days."""
    order_map: Dict[str, list] = {}
    for o in orders:
        if o.get("status") == "completed":
            order_map.setdefault(o["customer_id"], []).append(o)

    dormant = []
    for c in customers:
        cid = c["id"]
        cust_orders = order_map.get(cid, [])
        if not cust_orders:
            continue
        last_date = max(o["created_at"] for o in cust_orders)
        if _days_since(last_date) >= 60:
            dormant.append(c)

    if len(dormant) < 3:
        return None

    avg_rev = avg_order_value or 1200
    potential = len(dormant) * avg_rev * 0.25  # assume 25% win-back rate
    confidence = min(95, 60 + len(dormant) // 2)

    return {
        "id": "opp_win_back",
        "type": "win_back",
        "icon": OPPORTUNITY_ICONS["win_back"],
        "color": OPPORTUNITY_COLORS["win_back"],
        "title": "Win Back Dormant Buyers",
        "description": f"{len(dormant)} customers haven't bought in 60+ days. A targeted re-engagement offer can recover lost revenue.",
        "audience_size": len(dormant),
        "potential_revenue": round(potential, 2),
        "potential_revenue_formatted": _fmt_revenue(potential),
        "confidence_score": confidence,
        "suggested_action": "Send a personalized 'We miss you' offer with a 10–15% discount on their most purchased category.",
        "segment_rules": [{"field": "status", "operator": "eq", "value": "churn_risk"}],
        "campaign_template": {
            "name": "Win-Back: Dormant Buyers",
            "type": "email",
            "description": "Re-engagement campaign for customers inactive 60+ days",
            "content_template": "We miss you! It's been a while since your last order. Here's an exclusive 15% off just for you — use code COMEBACK15 at checkout.",
            "marketing_goal": "win_back",
            "segment_name": "Dormant Buyers (60d+)",
        }
    }


def _detect_vip_loyalty(customers: list, orders: list) -> Dict | None:
    """Top 10% spenders who haven't received a VIP campaign."""
    order_map: Dict[str, float] = {}
    for o in orders:
        if o.get("status") == "completed":
            cid = o["customer_id"]
            order_map[cid] = order_map.get(cid, 0) + float(o.get("total_amount") or 0)

    if not order_map:
        return None

    sorted_vals = sorted(order_map.values(), reverse=True)
    vip_threshold = sorted_vals[max(0, len(sorted_vals) // 10)]  # top 10%
    vip_customers = [c for c in customers if order_map.get(c["id"], 0) >= vip_threshold]

    if len(vip_customers) < 2:
        return None

    avg_vip_spend = sum(order_map.get(c["id"], 0) for c in vip_customers) / len(vip_customers)
    potential = len(vip_customers) * avg_vip_spend * 0.20  # 20% incremental lift
    confidence = min(92, 70 + len(vip_customers) // 3)

    return {
        "id": "opp_vip_loyalty",
        "type": "vip_loyalty",
        "icon": OPPORTUNITY_ICONS["vip_loyalty"],
        "color": OPPORTUNITY_COLORS["vip_loyalty"],
        "title": "Reward Your VIP Customers",
        "description": f"Your top {len(vip_customers)} spenders average ₹{avg_vip_spend:,.0f} per customer. A loyalty program will retain and grow this segment.",
        "audience_size": len(vip_customers),
        "potential_revenue": round(potential, 2),
        "potential_revenue_formatted": _fmt_revenue(potential),
        "confidence_score": confidence,
        "suggested_action": "Launch an exclusive VIP loyalty tier with early access, free shipping, and birthday rewards.",
        "segment_rules": [{"field": "lead_score", "operator": "gte", "value": "80"}],
        "campaign_template": {
            "name": "VIP Loyalty Rewards",
            "type": "email",
            "description": "Exclusive loyalty program for top-value customers",
            "content_template": "You're one of our most valued customers! As a VIP member, you get exclusive early access to our new collection, complimentary gift wrapping, and a special birthday surprise.",
            "marketing_goal": "vip_loyalty",
            "segment_name": "VIP Customers (Top 10%)",
        }
    }


def _detect_upsell(customers: list, orders: list, avg_order_value: float) -> Dict | None:
    """Regular buyers spending below avg — ripe for upsell."""
    order_map: Dict[str, Dict] = {}
    for o in orders:
        if o.get("status") == "completed":
            cid = o["customer_id"]
            if cid not in order_map:
                order_map[cid] = {"count": 0, "total": 0.0}
            order_map[cid]["count"] += 1
            order_map[cid]["total"] += float(o.get("total_amount") or 0)

    upsell_targets = [
        c for c in customers
        if order_map.get(c["id"], {}).get("count", 0) >= 2
        and (order_map[c["id"]]["total"] / order_map[c["id"]]["count"]) < (avg_order_value * 0.8)
    ]

    if len(upsell_targets) < 3:
        return None

    lift_per_customer = avg_order_value * 0.30
    potential = len(upsell_targets) * lift_per_customer
    confidence = min(88, 55 + len(upsell_targets) // 4)

    return {
        "id": "opp_upsell",
        "type": "upsell",
        "icon": OPPORTUNITY_ICONS["upsell"],
        "color": OPPORTUNITY_COLORS["upsell"],
        "title": "Upsell Repeat Buyers",
        "description": f"{len(upsell_targets)} repeat customers are spending below average. Recommend premium alternatives to grow basket size.",
        "audience_size": len(upsell_targets),
        "potential_revenue": round(potential, 2),
        "potential_revenue_formatted": _fmt_revenue(potential),
        "confidence_score": confidence,
        "suggested_action": "Recommend premium or bundle alternatives to frequent mid-value buyers with a 'You might also love…' campaign.",
        "segment_rules": [{"field": "status", "operator": "eq", "value": "active"}],
        "campaign_template": {
            "name": "Upsell: Premium Alternatives",
            "type": "email",
            "description": "Upsell campaign targeting repeat mid-value buyers",
            "content_template": "Based on what you love, we think you'll adore our premium collection! Upgrade your experience with our bestseller bundles — customers like you save 20% when they bundle.",
            "marketing_goal": "upsell",
            "segment_name": "Repeat Mid-Value Buyers",
        }
    }


def _detect_cross_sell(customers: list, orders: list) -> Dict | None:
    """Buyers with only 1 purchase — ripe for cross-sell."""
    order_count: Dict[str, int] = {}
    for o in orders:
        if o.get("status") == "completed":
            cid = o["customer_id"]
            order_count[cid] = order_count.get(cid, 0) + 1

    single_buyers = [c for c in customers if order_count.get(c["id"], 0) == 1]

    if len(single_buyers) < 5:
        return None

    # Assume avg cross-sell value is 60% of first purchase value
    from backend.database.repositories.order_repository import OrderRepository
    aov = OrderRepository.get_average_order_value()
    potential = len(single_buyers) * aov * 0.60 * 0.30  # 30% uptake
    confidence = min(85, 50 + len(single_buyers) // 10)

    return {
        "id": "opp_cross_sell",
        "type": "cross_sell",
        "icon": OPPORTUNITY_ICONS["cross_sell"],
        "color": OPPORTUNITY_COLORS["cross_sell"],
        "title": "Cross-Sell First-Time Buyers",
        "description": f"{len(single_buyers)} customers made only one purchase. Introduce complementary products to grow repeat rate.",
        "audience_size": len(single_buyers),
        "potential_revenue": round(potential, 2),
        "potential_revenue_formatted": _fmt_revenue(potential),
        "confidence_score": confidence,
        "suggested_action": "Send a 'Complete Your Look / Kit' email with 3 complementary product recommendations within 14 days of first purchase.",
        "segment_rules": [{"field": "status", "operator": "eq", "value": "active"}],
        "campaign_template": {
            "name": "Cross-Sell: Complete Your Experience",
            "type": "email",
            "description": "Cross-sell campaign for first-time buyers",
            "content_template": "Thank you for your recent purchase! Customers who bought what you did also love these complementary products. Complete your experience and get 10% off your next order.",
            "marketing_goal": "cross_sell",
            "segment_name": "Single-Purchase Customers",
        }
    }


def _detect_festival_campaign(customers: list, total_customers: int) -> Dict | None:
    """Seasonal / festival campaign based on current month."""
    now = datetime.now(timezone.utc)
    month = now.month
    day = now.day

    festival_map = {
        1:  ("New Year Sale", "Start the year with a bang — offer New Year bundle deals to your entire list."),
        2:  ("Valentine's Day Campaign", "Tap into the gifting season with curated Valentine's bundles for couples."),
        3:  ("Holi Celebration", "Celebrate colors of joy — launch a festive Holi offer for your audience."),
        4:  ("Summer Kickoff", "Season change = wardrobe refresh. Target summer collection deals."),
        5:  ("Mother's Day Campaign", "Gift ideas for mothers — one of the highest conversion seasonal campaigns."),
        6:  ("Mid-Year Sale", "Half-year clearance and refresh — strong conversion period."),
        7:  ("Monsoon Deals", "Monsoon season campaign with relevant product categories."),
        8:  ("Independence Day", "Patriotic sale campaign — high engagement August window."),
        9:  ("Navratri / Festive Pre-Season", "Kickstart the festive season with early-access preview deals."),
        10: ("Dussehra / Diwali Pre-Sale", "India's biggest shopping season is here — launch festive offers now."),
        11: ("Diwali Grand Sale", "Peak festive season — highest revenue opportunity of the year."),
        12: ("Year-End Clearance", "Christmas and New Year combo — clear inventory and hit annual targets."),
    }

    festival_name, festival_desc = festival_map.get(month, ("Seasonal Campaign", "Timely seasonal offer for your audience."))

    # Exclude if we are past the 20th (festival window closing)
    days_remaining = 30 - day
    if days_remaining < 5:
        return None

    audience = total_customers
    potential = audience * 800 * 0.12  # 12% conversion at avg ₹800
    confidence = min(90, 65 + (days_remaining // 3))

    return {
        "id": "opp_festival",
        "type": "festival_campaign",
        "icon": OPPORTUNITY_ICONS["festival_campaign"],
        "color": OPPORTUNITY_COLORS["festival_campaign"],
        "title": festival_name,
        "description": festival_desc,
        "audience_size": audience,
        "potential_revenue": round(potential, 2),
        "potential_revenue_formatted": _fmt_revenue(potential),
        "confidence_score": confidence,
        "suggested_action": f"Launch a time-limited {festival_name} offer to all active customers. Use urgency messaging — ends in {days_remaining} days.",
        "segment_rules": [{"field": "status", "operator": "neq", "value": "inactive"}],
        "campaign_template": {
            "name": festival_name,
            "type": "email",
            "description": f"Seasonal campaign: {festival_name}",
            "content_template": f"🎉 {festival_name} Special! Celebrate with exclusive limited-time deals curated just for you. Shop now before time runs out — offers valid for {days_remaining} days only.",
            "marketing_goal": "festival_campaign",
            "segment_name": "All Active Customers",
        }
    }


# ─── LLM enrichment ───────────────────────────────────────────────────────────

def _enrich_with_llm(opportunities: List[Dict], context: Dict) -> List[Dict]:
    """Optionally improve opportunity descriptions and actions with LLM."""
    if not is_llm_enabled() or not opportunities:
        return opportunities

    try:
        client, model = get_llm_client_and_model()
        opp_summary = [
            {"type": o["type"], "title": o["title"], "audience_size": o["audience_size"],
             "confidence_score": o["confidence_score"]}
            for o in opportunities
        ]
        prompt = f"""
You are a senior CRM growth strategist. Review these {len(opportunities)} growth opportunities for a brand:
{json.dumps(opp_summary, indent=2)}

Business context:
- Total customers: {context.get('total_customers', 0)}
- Total revenue: ₹{context.get('total_revenue', 0):,.0f}
- Avg order value: ₹{context.get('avg_order_value', 0):,.0f}

For each opportunity, return an improved 1-sentence "suggested_action" that is specific, compelling, and actionable.
Return ONLY a JSON array in the same order as input, each item with: {{"type": "<type>", "suggested_action": "<improved action>"}}
"""
        kwargs = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a CRM growth expert. Return only valid JSON arrays."},
                {"role": "user", "content": prompt}
            ]
        }
        if "gpt" in model.lower() or "llama-3" in model.lower():
            kwargs["response_format"] = {"type": "json_object"}

        response = client.chat.completions.create(**kwargs)
        content = response.choices[0].message.content

        # Try to parse — handle both array and wrapped object
        parsed = json.loads(content)
        if isinstance(parsed, dict):
            parsed = list(parsed.values())[0] if parsed else []

        if isinstance(parsed, list):
            for enriched in parsed:
                for opp in opportunities:
                    if opp["type"] == enriched.get("type") and enriched.get("suggested_action"):
                        opp["suggested_action"] = enriched["suggested_action"]
    except Exception as e:
        pass  # Silently fall back to rule-based

    return opportunities


# ─── main scanner ─────────────────────────────────────────────────────────────

def scan_opportunities() -> List[Dict[str, Any]]:
    """
    Main entry point. Scans all customer + order data and returns ranked opportunities.
    Returns list sorted by potential_revenue descending.
    """
    sb = get_supabase()

    # Fetch raw data
    customers_res = sb.table("customers").select("id, first_name, last_name, status, lead_score, created_at").execute()
    customers = customers_res.data or []

    orders_res = sb.table("orders").select("id, customer_id, total_amount, status, created_at").execute()
    orders = orders_res.data or []

    if not customers:
        return []

    # Compute context metrics
    completed_orders = [o for o in orders if o.get("status") == "completed"]
    total_revenue = sum(float(o.get("total_amount") or 0) for o in completed_orders)
    avg_order_value = total_revenue / len(completed_orders) if completed_orders else 1200.0

    context = {
        "total_customers": len(customers),
        "total_revenue": total_revenue,
        "avg_order_value": avg_order_value,
    }

    # Run all detectors
    opportunities: List[Dict] = []

    detectors = [
        lambda: _detect_win_back(customers, orders, avg_order_value),
        lambda: _detect_vip_loyalty(customers, orders),
        lambda: _detect_upsell(customers, orders, avg_order_value),
        lambda: _detect_cross_sell(customers, orders),
        lambda: _detect_festival_campaign(customers, len(customers)),
    ]

    for detect in detectors:
        try:
            result = detect()
            if result:
                opportunities.append(result)
        except Exception as e:
            print(f"[OpportunityEngine] Detector error: {e}")

    # LLM enrichment
    opportunities = _enrich_with_llm(opportunities, context)

    # Sort by potential revenue descending
    opportunities.sort(key=lambda x: x.get("potential_revenue", 0), reverse=True)

    return opportunities
