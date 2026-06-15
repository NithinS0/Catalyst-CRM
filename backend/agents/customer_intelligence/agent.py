import json
import openai
from typing import Dict, Any
from backend.config import settings
from backend.database.repositories.order_repository import OrderRepository
from backend.database.supabase import execute_query, get_db_cursor
from backend.agents.customer_intelligence.scoring import (
    calculate_churn_score,
    calculate_health_score,
    calculate_clv_score,
    determine_lifecycle_stage
)

def run_customer_intelligence(state: Dict[str, Any]) -> Dict[str, Any]:
    state["current_agent"] = "customer_intelligence"
    logs = state.get("action_logs", [])
    logs.append("[Customer Intelligence] Initiating customer valuation metrics analysis...")
    
    try:
        # Query DB to perform customer RFM rankings
        cust_res = OrderRepository.get_rfm_profiles(limit=200)
        
        intelligence_profiles = []
        for row in (cust_res or []):
            rec = float(row["recency"]) if row["recency"] is not None else 365.0
            freq = int(row["frequency"])
            mon = float(row["monetary"])
            
            churn_score = calculate_churn_score(rec)
            health_score = calculate_health_score(churn_score, freq)
            clv_score = calculate_clv_score(mon)
            lifecycle = determine_lifecycle_stage(clv_score, churn_score)
            
            intelligence_profiles.append({
                "customerId": str(row["id"]),
                "name": f"{row['first_name']} {row['last_name']}",
                "churnScore": churn_score,
                "clvScore": clv_score,
                "healthScore": health_score,
                "lifecycleStage": lifecycle
            })
            
        state["customer_intelligence"] = intelligence_profiles
        logs.append(f"[Customer Intelligence] Successfully computed RFM/CLV metrics for {len(intelligence_profiles)} customer profiles.")
        state["next_node"] = "segmentation"
        state["agent_error"] = None
        state["error_message"] = None
        
    except Exception as e:
        logs.append(f"[Customer Intelligence] Error encountered: {str(e)}")
        state["agent_error"] = "customer_intelligence"
        state["error_message"] = str(e)
        
    state["action_logs"] = logs
    return state

def run_lead_scorer(state: dict) -> dict:
    """
    Lead Scorer Node.
    Analyzes customer interactions and computes an appropriate lead score (0-100).
    """
    logs = state.get("action_logs", [])
    logs.append("[Lead Scorer] Starting lead evaluation...")
    
    customer_id = state.get("customer_id")
    if not customer_id:
        res = execute_query("SELECT id FROM public.customers LIMIT 1;")
        if res:
            customer_id = str(res[0]["id"])
            logs.append(f"[Lead Scorer] No customer_id provided, resolved to: {customer_id}")
        else:
            state["action_logs"] = logs
            state["next_node"] = "end"
            return state

    # Fetch customer and timeline
    cust_res = execute_query("SELECT * FROM public.customers WHERE id = %s;", (customer_id,))
    interactions = execute_query("SELECT * FROM public.interactions WHERE customer_id = %s ORDER BY created_at DESC;", (customer_id,))
    
    if not cust_res:
        logs.append(f"[Lead Scorer] Customer {customer_id} not found.")
        state["action_logs"] = logs
        state["next_node"] = "end"
        return state
        
    customer = cust_res[0]
    timeline_str = "\n".join([
        f"- {i['type'].upper()} ({i['created_at'].strftime('%Y-%m-%d')}): {i['summary']}. details: {i['details'] or ''}"
        for i in (interactions or [])
    ])
    
    prompt = f"""
    Analyze the following customer profile and interaction history to calculate a lead score between 0 and 100.
    A score of 80+ indicates high intent / hot lead (e.g. requested pricing, demo, pilot).
    A score of 40-79 indicates medium intent (e.g. standard product questions, open emails).
    A score of <40 indicates cold/inactive or churn risk (e.g. complained about pricing, double charges, inactive, unresponsive).

    Customer:
    Name: {customer['first_name']} {customer['last_name']}
    Company: {customer['company']}
    Status: {customer['status']}
    Current Score: {customer['lead_score']}

    Timeline:
    {timeline_str}

    Return a JSON object containing:
    {{
      "new_score": <int 0-100>,
      "explanation": "<short explanation under 3 sentences>"
    }}
    """
    
    new_score = customer['lead_score']
    explanation = "No new timeline interactions found to adjust score."

    from backend.utils.llm import is_llm_enabled, get_llm_client_and_model

    if is_llm_enabled():
        try:
            client, model = get_llm_client_and_model()
            kwargs = {
                "model": model,
                "messages": [
                    {"role": "system", "content": "You are a professional CRM Lead Scorer. You output strictly JSON."},
                    {"role": "user", "content": prompt}
                ]
            }
            if "gpt" in model.lower() or "llama-3" in model.lower() or "llama3" in model.lower():
                kwargs["response_format"] = {"type": "json_object"}
                
            response = client.chat.completions.create(**kwargs)
            result = json.loads(response.choices[0].message.content)
            new_score = int(result.get("new_score", new_score))
            explanation = result.get("explanation", explanation)
        except Exception as e:
            logs.append(f"[Lead Scorer] LLM call failed: {e}. Running rule-based fallback.")
            new_score, explanation = _fallback_scoring(customer, interactions)
    else:
        logs.append("[Lead Scorer] LLM engine Key missing. Running rule-based fallback scoring.")
        new_score, explanation = _fallback_scoring(customer, interactions)
        
    # Update customer lead score in Database
    with get_db_cursor() as cur:
        cur.execute(
            "UPDATE public.customers SET lead_score = %s WHERE id = %s;",
            (new_score, customer_id)
        )
        logs.append(f"[Lead Scorer] Updated customer {customer['first_name']} lead score from {customer['lead_score']} to {new_score}.")
    
    # Save the analysis as a system note in interactions table
    with get_db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO public.interactions (customer_id, type, summary, details)
            VALUES (%s, 'note', %s, %s);
            """,
            (customer_id, f"AI Lead Score Evaluation: {new_score}", explanation)
        )
        logs.append("[Lead Scorer] Logged scoring explanation to customer timeline.")
        
    state["action_logs"] = logs
    state["suggested_score"] = new_score
    state["proposed_content"] = f"Lead Scorer completed successfully. Customer {customer['first_name']} {customer['last_name']} updated to score {new_score}.\nExplanation: {explanation}"
    state["next_node"] = "end"
    return state

def _fallback_scoring(customer: dict, interactions: list) -> tuple:
    """
    Rule-based lead scoring logic as fallback.
    """
    score = 50
    reasons = []
    
    if not interactions:
        return score, "No interaction history available. Defaulted score to 50."
        
    for i in interactions:
        summary = i["summary"].lower()
        details = (i["details"] or "").lower()
        
        if "pricing" in summary or "pricing" in details or "demo" in summary or "pilot" in summary:
            score += 25
            reasons.append("Interested in pricing/demo")
        if "complain" in summary or "refund" in summary or "double charge" in summary or "unhappy" in summary:
            score -= 30
            reasons.append("Support issues or pricing complaints")
        if "documentation" in summary or "webhook" in summary:
            score += 15
            reasons.append("Technical discovery interaction")
            
    score = max(0, min(100, score))
    explanation = f"Evaluated based on timeline checks. Adjusted due to: {', '.join(reasons) if reasons else 'neutral engagement history'}."
    return score, explanation
