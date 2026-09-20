import json
import openai
from typing import Optional, Tuple, Any
from backend.config import settings


# ── LangChain / LangGraph LLM helper ─────────────────────────────────────────

def get_langchain_llm(temperature: float = 0.2) -> Any:
    """
    Returns a LangChain BaseChatModel ready for use in LangGraph nodes.
    Priority: Groq (ChatGroq) as MAIN API.
    Raises ValueError if no API key is configured.
    """
    if settings.GROQ_API_KEY and settings.GROQ_API_KEY not in ["your-groq-api-key", "mock-key", ""]:
        try:
            from langchain_groq import ChatGroq
            return ChatGroq(
                api_key=settings.GROQ_API_KEY,
                model=settings.GROQ_MODEL or "groq/compound-mini",
                temperature=temperature,
            )
        except ImportError:
            pass

    if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY not in ["your-openai-api-key", "mock-key", ""]:
        try:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                api_key=settings.OPENAI_API_KEY,
                model=settings.OPENAI_MODEL or "gpt-4o-mini",
                temperature=temperature,
            )
        except ImportError:
            pass

    raise ValueError("No valid LLM API key configured or no langchain provider installed.")

def get_llm_client_and_model() -> Tuple[openai.OpenAI, str]:
    """
    Returns (client, model) with Groq as the MAIN API.
    Raises ValueError if neither is enabled or key is missing.
    """
    if settings.GROQ_API_KEY and settings.GROQ_API_KEY not in ["your-groq-api-key", "mock-key", ""]:
        client = openai.OpenAI(
            api_key=settings.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1"
        )
        model = settings.GROQ_MODEL or "groq/compound-mini"
        return client, model
        
    if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY not in ["your-openai-api-key", "mock-key", ""]:
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        model = settings.OPENAI_MODEL or "gpt-4o-mini"
        return client, model
        
    raise ValueError("No valid LLM API key configured.")

def is_llm_enabled() -> bool:
    try:
        get_llm_client_and_model()
        return True
    except Exception:
        return False

def call_llm_for_campaign(
    goal: str,
    revision_feedback: Optional[str] = None,
    brand_name: Optional[str] = None,
    brand_voice: Optional[str] = None,
    email_footer: Optional[str] = None,
    campaign_tone: Optional[str] = None
) -> dict:
    """
    Calls configured LLM (Groq or OpenAI) to parse the marketer goal and generate RAG campaign planning models.
    """
    if not is_llm_enabled():
        return get_fallback_data(goal, brand_name, email_footer, campaign_tone)
        
    try:
        client, model = get_llm_client_and_model()
        system_prompt = (
            "You are an expert CRM Campaign strategist. Analyze the user's marketing goal and return a JSON object with:\n"
            "1. 'segment_name': Short descriptive segment name.\n"
            "2. 'segment_description': Brief narrative of the segment context.\n"
            "3. 'segment_rules': Array of filtering criteria targeting the public.customers table. "
            "Fields: 'status' (values: 'lead', 'contact_ready', 'active', 'churn_risk', 'inactive'), 'lead_score' (0-100). "
            "Operators: 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in'. "
            "Example rules: [{\"field\": \"status\", \"operator\": \"in\", \"value\": [\"churn_risk\", \"inactive\"]}, {\"field\": \"lead_score\", \"operator\": \"gte\", \"value\": 75}].\n"
            "4. 'subject': Message subject line.\n"
            "5. 'variant_a': Personalized message body copy (use {{first_name}} and {{company}} placeholders).\n"
            "6. 'variant_b': Promotional message body variation.\n"
            "7. 'variant_c': Direct call-to-action message variation.\n"
            "8. 'recommended_channel': One of 'email', 'sms', 'whatsapp', 'rcs'.\n"
            "9. 'predicted_delivery_rate': Float (0.95 to 0.999).\n"
            "10. 'predicted_open_rate': Float (0.20 to 0.75).\n"
            "11. 'predicted_click_rate': Float (0.05 to 0.35).\n"
            "12. 'predicted_conversion_rate': Float (0.01 to 0.15).\n"
            "13. 'estimated_roi': Float percentage (e.g. 210.0 for 210%).\n"
            "14. 'expected_impact': Explanation of predicted ROI.\n"
            "Return ONLY JSON, no markdown codeblocks."
        )
        
        if brand_name or brand_voice or campaign_tone or email_footer:
            branding_instructions = "\n\nYou MUST respect the following brand identity details of the company during copywriting generation:\n"
            if brand_name:
                branding_instructions += f"- Company/Brand Name: {brand_name}\n"
            if brand_voice:
                branding_instructions += f"- Brand Voice Guideline: {brand_voice}\n"
            if campaign_tone:
                branding_instructions += f"- Campaign Tone/Style: {campaign_tone}\n"
            if email_footer:
                branding_instructions += f"- Required Email Footer: {email_footer}\n"
            branding_instructions += "\nApply this tone and voice strictly. When drafting the variant copy, the signatures/footers should use the provided company name and respect the branding."
            system_prompt += branding_instructions
        
        user_message = f"Marketing Goal: {goal}"
        if revision_feedback:
            user_message += f"\nRevision Request: {revision_feedback}"
            
        models_to_try = [model, "groq/compound-mini", "qwen/qwen3.8-27b", "groq/compound"]
        seen = set()
        last_err = None
        for m in models_to_try:
            if m in seen:
                continue
            seen.add(m)
            try:
                response = client.chat.completions.create(
                    model=m,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    temperature=0.3
                )
                text = response.choices[0].message.content.strip()
                if text.startswith("```"):
                    text = text.split("```")[1]
                    if text.startswith("json"):
                        text = text[4:]
                return json.loads(text.strip())
            except Exception as exc:
                last_err = exc
                continue

        print(f"Error calling Groq API: {last_err}. Falling back.")
        return get_fallback_data(goal, brand_name, email_footer, campaign_tone)
    except Exception as e:
        print(f"Error calling Groq API: {e}. Falling back.")
        return get_fallback_data(goal, brand_name, email_footer, campaign_tone)

def get_fallback_data(goal: str, brand_name: Optional[str] = None, email_footer: Optional[str] = None, campaign_tone: Optional[str] = None) -> dict:
    g_lower = goal.lower()
    b_name = brand_name or "Catalyst"
    footer_text = f"\n\n{email_footer}" if email_footer else f"\n\nBest,\n{b_name} Team"
    tone_desc = f" ({campaign_tone} style)" if campaign_tone else ""
    
    if "win back" in g_lower or "churn" in g_lower or "inactive" in g_lower:
        return {
            "segment_name": "Churn Risks & Inactive VIPs",
            "segment_description": f"High-value customers inactive for 60+ days or displaying churn characteristics for {b_name}.",
            "segment_rules": [
                {"field": "status", "operator": "in", "value": ["churn_risk", "inactive"]},
                {"field": "lead_score", "operator": "gte", "value": 60}
            ],
            "subject": "We want to make things right",
            "variant_a": f"Hi {{{{first_name}}}},\n\nWe noticed you haven't been active on your {b_name} account lately{tone_desc}. We value {{{{company}}}}'s partnership. Here is an exclusive code for 20% off your next invoice: WINBACK20.{footer_text}",
            "variant_b": f"Hey {{{{first_name}}}},\n\nWe miss you at {{{{company}}}}! We've made massive upgrades to the CRM dashboard. Log in today to check out your RAG memories.{footer_text}",
            "variant_c": f"Hi {{{{first_name}}}}, let's schedule a 10-minute CEO roundtable to discuss custom pricing for {{{{company}}}}.{footer_text}",
            "recommended_channel": "email",
            "predicted_delivery_rate": 0.982,
            "predicted_open_rate": 0.428,
            "predicted_click_rate": 0.154,
            "predicted_conversion_rate": 0.065,
            "estimated_roi": 310.0,
            "expected_impact": "Recalls dormant high-value customers back into active billing lifecycle."
        }
    else:
        return {
            "segment_name": "Active Lead Directory",
            "segment_description": f"Regular active users ready for product feature upsells from {b_name}.",
            "segment_rules": [
                {"field": "status", "operator": "in", "value": ["active", "contact_ready"]}
            ],
            "subject": "Unlock new AI features in Catalyst Studio",
            "variant_a": f"Hi {{{{first_name}}}},\n\nWe just launched our new Campaign Studio multi-agent graphs to accelerate outreach operations for {{{{company}}}}{tone_desc}.\n\nCheck out the AI tab to run a simulation today!{footer_text}",
            "variant_b": f"Hi {{{{first_name}}}},\n\nDid you see the new pgvector RAG memory system in {b_name} CRM? Supercharge your SaaS campaigns with automatic lead scorers.{footer_text}",
            "variant_c": f"Hello {{{{first_name}}}}, activate the Campaign Studio features in your settings to save 15 hours of copy-drafting this week.{footer_text}",
            "recommended_channel": "whatsapp",
            "predicted_delivery_rate": 0.995,
            "predicted_open_rate": 0.742,
            "predicted_click_rate": 0.321,
            "predicted_conversion_rate": 0.145,
            "estimated_roi": 195.0,
            "expected_impact": "Drives engagement across newly launched AI and vector storage features."
        }

def generate_campaign_report(campaign: dict) -> str:
    """
    Calls configured LLM to generate a professional markdown report for a given campaign.
    """
    if not is_llm_enabled():
        return f"# Campaign Report: {campaign.get('name', 'Unknown')}\n\n*LLM not configured. This is a fallback report.*\n\n**Status:** {campaign.get('status')}\n**Channel:** {campaign.get('type')}\n\n### Delivery Stats\n- **Sent:** {campaign.get('total_sent', 0)}\n- **Read:** {campaign.get('total_opened', 0)}\n- **Clicked:** {campaign.get('total_clicked', 0)}\n\n*The campaign performed as expected.*"
        
    try:
        client, model = get_llm_client_and_model()
        system_prompt = (
            "You are an expert CRM Campaign Data Analyst. Write a concise, professional executive summary report in Markdown format for the provided marketing campaign. "
            "Include the following sections:\n"
            "1. **Executive Summary** (1 paragraph)\n"
            "2. **Performance Metrics** (Bullet points based on the provided data)\n"
            "3. **Key Insights & Learnings** (2-3 bullet points of qualitative analysis)\n"
            "4. **Next Step Recommendations** (2 actionable suggestions for future campaigns)\n"
            "Keep it strictly professional and highly analytical."
        )
        
        user_message = f"Campaign Data:\n{json.dumps(campaign, indent=2)}"
            
        models_to_try = [model, "groq/compound-mini", "qwen/qwen3.8-27b", "groq/compound"]
        seen = set()
        last_err = None
        for m in models_to_try:
            if m in seen:
                continue
            seen.add(m)
            try:
                response = client.chat.completions.create(
                    model=m,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    temperature=0.3
                )
                return response.choices[0].message.content.strip()
            except Exception as exc:
                last_err = exc
                continue

        print(f"Error generating report with Groq: {last_err}")
        return f"# Campaign Report: {campaign.get('name', 'Unknown')}\n\n*Error generating AI report. Falling back to basic stats.*\n\n**Status:** {campaign.get('status')}\n**Channel:** {campaign.get('type')}\n\n### Delivery Stats\n- **Sent:** {campaign.get('total_sent', 0)}\n- **Read:** {campaign.get('total_opened', 0)}\n- **Clicked:** {campaign.get('total_clicked', 0)}"
    except Exception as e:
        print(f"Error generating report with Groq: {e}")
        return f"# Campaign Report: {campaign.get('name', 'Unknown')}\n\n*Error generating AI report. Falling back to basic stats.*\n\n**Status:** {campaign.get('status')}\n**Channel:** {campaign.get('type')}\n\n### Delivery Stats\n- **Sent:** {campaign.get('total_sent', 0)}\n- **Read:** {campaign.get('total_opened', 0)}\n- **Clicked:** {campaign.get('total_clicked', 0)}"
