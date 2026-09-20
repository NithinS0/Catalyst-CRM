from typing import Optional, Dict, Any
from backend.services.email.base import EmailProvider
from backend.services.email.resend_provider import ResendProvider
from backend.services.email.smtp_provider import SMTPProvider
from backend.config import settings
from backend.database.supabase import get_supabase
from backend.utils.tenant import get_current_company_id

def get_email_provider(company_id: Optional[str] = None) -> EmailProvider:
    """
    Factory that resolves the appropriate email provider:
    1. Checks company-level integrations in the database
    2. Falls back to global backend settings (Resend or SMTP)
    """
    cid = company_id or get_current_company_id()
    if cid:
        try:
            supabase = get_supabase()
            integ = supabase.table("integrations").select("*").eq("company_id", cid).eq("category", "email").eq("status", "connected").limit(1).execute()
            if integ.data:
                row = integ.data[0]
                provider_type = row.get("provider", "resend").lower()
                cfg = row.get("config", {}) or {}
                if provider_type == "resend":
                    return ResendProvider(
                        api_key=cfg.get("api_key"),
                        default_from=cfg.get("from_email"),
                        default_reply_to=cfg.get("reply_to")
                    )
                elif provider_type == "smtp":
                    return SMTPProvider(
                        host=cfg.get("host"),
                        port=cfg.get("port"),
                        username=cfg.get("username"),
                        password=cfg.get("password"),
                        use_tls=cfg.get("use_tls", True),
                        default_from=cfg.get("from_email")
                    )
        except Exception as e:
            print(f"[EmailProviderFactory] Error resolving company integration: {e}")

    # Fallback to system environment configuration
    provider_type = settings.EMAIL_PROVIDER.lower()
    if provider_type == "smtp":
        return SMTPProvider()
    return ResendProvider()
