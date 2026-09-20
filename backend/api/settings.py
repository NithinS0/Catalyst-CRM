from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from backend.database.supabase import get_supabase
from backend.utils.auth import has_permission, has_role, Permission, Role, normalize_role
from backend.utils.tenant import get_current_company_id
from backend.services.email.factory import get_email_provider
from backend.config import settings

router = APIRouter(prefix="/api/settings", tags=["settings"])

# ── Pydantic Request Schemas ──────────────────────────────────────────────────
class TeammateCreate(BaseModel):
    name: str
    email: EmailStr
    password: Optional[str] = None
    role: str = "marketer" # owner, admin, marketer, analyst

class TeammateUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None

class CompanyBrandingUpdate(BaseModel):
    name: str
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    industry: Optional[str] = None
    timezone: Optional[str] = "UTC"
    currency: Optional[str] = "USD"
    logo_url: Optional[str] = None
    primary_color: Optional[str] = "#2B2B2B"
    secondary_color: Optional[str] = "#B3B3B3"
    brand_voice: Optional[str] = "Direct, intelligent, and concise"
    email_footer: Optional[str] = ""
    campaign_tone: Optional[str] = "Professional"
    email_sender_name: Optional[str] = None
    email_sender_address: Optional[str] = None
    email_reply_to: Optional[str] = None

class EmailSettingsUpdate(BaseModel):
    provider: str = "resend" # resend, smtp
    api_key: Optional[str] = None
    from_email: Optional[str] = None
    sender_name: Optional[str] = None
    reply_to: Optional[str] = None
    # SMTP fields
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: Optional[bool] = True

class TestEmailSettingsRequest(BaseModel):
    recipient_email: EmailStr

class SubscriptionUpdate(BaseModel):
    plan: str # free, pro, enterprise

# ── Teammate User Directory Endpoints ──────────────────────────────────────────
@router.get("/users")
def list_teammates(request: Request, _=Depends(has_permission(Permission.MANAGE_USERS))):
    """List all team members and profiles in the company."""
    supabase = get_supabase()
    company_id = get_current_company_id()
    try:
        res = supabase.table("profiles").select("*").eq("company_id", company_id).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load teammates: {str(e)}")

@router.post("/users")
def invite_teammate(req: TeammateCreate, request: Request, _=Depends(has_permission(Permission.MANAGE_USERS))):
    """Invite and create a new teammate under the company."""
    supabase = get_supabase()
    company_id = get_current_company_id()
    try:
        # Check duplicate email
        chk = supabase.table("profiles").select("id").eq("email", req.email).execute()
        if chk.data:
            raise HTTPException(status_code=400, detail="A user with this email is already registered.")

        # Default password if not provided for invitation
        import uuid
        temp_password = req.password or f"Catalyst_{uuid.uuid4().hex[:8]}"

        auth_res = supabase.auth.admin.create_user({
            "email": req.email,
            "password": temp_password,
            "email_confirm": True,
            "user_metadata": {
                "name": req.name
            }
        })
        user_id = auth_res.user.id

        # Insert profile
        norm_role = normalize_role(req.role)
        res = supabase.table("profiles").insert({
            "id": user_id,
            "name": req.name,
            "email": req.email,
            "role": norm_role,
            "company_id": company_id
        }).execute()

        # Insert company_members
        supabase.table("company_members").insert({
            "company_id": company_id,
            "user_id": user_id,
            "email": req.email,
            "name": req.name,
            "role": norm_role,
            "status": "active"
        }).execute()

        # Log audit
        try:
            supabase.table("audit_logs").insert({
                "company_id": company_id,
                "user_id": str(request.state.user.id),
                "user_name": getattr(request.state.user, "name", "Admin"),
                "action": "teammate_invited",
                "resource_type": "team",
                "resource_id": user_id,
                "details": {"email": req.email, "role": norm_role}
            }).execute()
        except Exception:
            pass

        return res.data[0] if res.data else {}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create teammate: {str(e)}")

@router.put("/users/{user_id}")
def update_teammate(user_id: str, req: TeammateUpdate, request: Request, _=Depends(has_permission(Permission.MANAGE_USERS))):
    """Update teammate role or name details."""
    supabase = get_supabase()
    company_id = get_current_company_id()
    try:
        chk = supabase.table("profiles").select("company_id, role").eq("id", user_id).single().execute()
        if not chk.data or str(chk.data["company_id"]) != str(company_id):
            raise HTTPException(status_code=404, detail="Teammate profile not found in your company.")

        updates = {}
        if req.name is not None:
            updates["name"] = req.name
        if req.role is not None:
            updates["role"] = normalize_role(req.role)

        res = supabase.table("profiles").update(updates).eq("id", user_id).execute()
        if "role" in updates:
            supabase.table("company_members").update({"role": updates["role"]}).eq("user_id", user_id).execute()
        return res.data[0] if res.data else {}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update teammate: {str(e)}")

@router.delete("/users/{user_id}")
def delete_teammate(user_id: str, request: Request, _=Depends(has_permission(Permission.MANAGE_USERS))):
    """Delete teammate auth user and profile."""
    supabase = get_supabase()
    company_id = get_current_company_id()
    try:
        current_user_id = str(request.state.user.id)
        if current_user_id == user_id:
            raise HTTPException(status_code=400, detail="Cannot delete your own administrator profile.")

        chk = supabase.table("profiles").select("company_id").eq("id", user_id).single().execute()
        if not chk.data or str(chk.data["company_id"]) != str(company_id):
            raise HTTPException(status_code=404, detail="Teammate profile not found in your company.")

        supabase.table("company_members").delete().eq("user_id", user_id).execute()
        supabase.table("profiles").delete().eq("id", user_id).execute()
        try:
            supabase.auth.admin.delete_user(user_id)
        except Exception:
            pass

        return {"status": "success", "message": "Teammate deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete teammate: {str(e)}")


# ── Company Style & Branding Endpoints ──────────────────────────────────────────
@router.get("/company")
def get_company_branding(request: Request, _=Depends(has_permission(Permission.MANAGE_SETTINGS))):
    """Fetch company brand and workspace metadata."""
    supabase = get_supabase()
    company_id = get_current_company_id()
    try:
        res = supabase.table("companies").select("*").eq("id", company_id).single().execute()
        return res.data or {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load company branding: {str(e)}")

@router.put("/company")
def update_company_branding(req: CompanyBrandingUpdate, request: Request, _=Depends(has_permission(Permission.MANAGE_SETTINGS))):
    """Modify company brand metadata."""
    supabase = get_supabase()
    company_id = get_current_company_id()
    try:
        updates = {
            "name": req.name,
            "website": req.website,
            "phone": req.phone,
            "address": req.address,
            "industry": req.industry,
            "timezone": req.timezone or "UTC",
            "currency": req.currency or "USD",
            "logo_url": req.logo_url,
            "primary_color": req.primary_color or "#2B2B2B",
            "secondary_color": req.secondary_color or "#B3B3B3",
            "brand_voice": req.brand_voice or "Direct, intelligent, and concise",
            "email_footer": req.email_footer,
            "campaign_tone": req.campaign_tone or "Professional",
            "email_sender_name": req.email_sender_name,
            "email_sender_address": req.email_sender_address,
            "email_reply_to": req.email_reply_to
        }
        res = supabase.table("companies").update(updates).eq("id", company_id).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update company branding: {str(e)}")


# ── Email Integration & Channel Settings Endpoints ─────────────────────────────
@router.get("/email")
def get_email_settings(request: Request, _=Depends(has_permission(Permission.MANAGE_SETTINGS))):
    """Retrieve current email provider and configuration status."""
    supabase = get_supabase()
    company_id = get_current_company_id()
    
    # 1. Check company integrations table
    integ = supabase.table("integrations").select("*").eq("company_id", company_id).eq("category", "email").limit(1).execute()
    if integ.data:
        row = integ.data[0]
        cfg = row.get("config", {}) or {}
        return {
            "provider": row.get("provider", "resend"),
            "status": row.get("status", "connected"),
            "sender_name": cfg.get("sender_name") or "",
            "sender_email": cfg.get("from_email") or "",
            "reply_to": cfg.get("reply_to") or "",
            "has_api_key": bool(cfg.get("api_key")),
            "last_tested_at": row.get("last_tested_at"),
            "is_company_override": True
        }

    # 2. Check global environment fallback
    has_resend = bool(settings.RESEND_API_KEY and settings.RESEND_API_KEY.strip())
    has_smtp = bool(settings.SMTP_HOST and settings.SMTP_HOST.strip())
    global_provider = settings.EMAIL_PROVIDER.lower()
    is_connected = (global_provider == "resend" and has_resend) or (global_provider == "smtp" and has_smtp)

    return {
        "provider": global_provider,
        "status": "connected" if is_connected else "configuration_required",
        "sender_name": "Catalyst CRM",
        "sender_email": settings.EMAIL_FROM,
        "reply_to": settings.EMAIL_REPLY_TO or "",
        "has_api_key": has_resend or has_smtp,
        "is_company_override": False
    }

@router.post("/email")
def update_email_settings(req: EmailSettingsUpdate, request: Request, _=Depends(has_permission(Permission.MANAGE_SETTINGS))):
    """Save or update company email integration configuration."""
    supabase = get_supabase()
    company_id = get_current_company_id()
    try:
        config_payload = {
            "from_email": req.from_email or settings.EMAIL_FROM,
            "sender_name": req.sender_name or "Catalyst",
            "reply_to": req.reply_to or "",
        }
        if req.provider == "resend":
            if req.api_key:
                config_payload["api_key"] = req.api_key
        elif req.provider == "smtp":
            config_payload.update({
                "host": req.smtp_host,
                "port": req.smtp_port,
                "username": req.smtp_username,
                "password": req.smtp_password,
                "use_tls": req.smtp_use_tls
            })

        # Upsert integration
        existing = supabase.table("integrations").select("id").eq("company_id", company_id).eq("category", "email").execute()
        if existing.data:
            integ_id = existing.data[0]["id"]
            res = supabase.table("integrations").update({
                "provider": req.provider,
                "config": config_payload,
                "status": "connected"
            }).eq("id", integ_id).execute()
        else:
            res = supabase.table("integrations").insert({
                "company_id": company_id,
                "category": "email",
                "provider": req.provider,
                "config": config_payload,
                "status": "connected"
            }).execute()

        # Update company defaults
        supabase.table("companies").update({
            "email_sender_name": req.sender_name,
            "email_sender_address": req.from_email,
            "email_reply_to": req.reply_to
        }).eq("id", company_id).execute()

        return {"status": "success", "message": "Email settings updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update email settings: {str(e)}")

@router.post("/email/test")
def test_email_configuration(req: TestEmailSettingsRequest, request: Request, _=Depends(has_permission(Permission.MANAGE_SETTINGS))):
    """Send an immediate test email to verify provider connectivity."""
    company_id = get_current_company_id()
    try:
        provider = get_email_provider(company_id)
        result = provider.send_test_email(
            to_email=req.recipient_email,
            subject="Catalyst: Email Configuration Verified",
            body="Congratulations! Your email provider settings in Catalyst CRM are active and functioning correctly."
        )
        if result.success:
            return {
                "status": "success",
                "message": f"Test email sent successfully to {req.recipient_email}",
                "provider_message_id": result.provider_message_id
            }
        else:
            raise HTTPException(status_code=400, detail=result.error_message or "Email dispatch test failed.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test email failed: {str(e)}")

@router.get("/channels")
def list_channel_statuses():
    """Return the activation status and capabilities of all Catalyst channels."""
    return [
        {
            "id": "email",
            "name": "Email",
            "status": "active",
            "badge": "Active",
            "description": "Full real-time execution, tracking, and A/B variant testing.",
            "supported": True
        },
        {
            "id": "sms",
            "name": "SMS",
            "status": "coming_soon",
            "badge": "Coming Soon",
            "description": "Direct mobile text outreach via Twilio / Sinch.",
            "supported": False
        },
        {
            "id": "whatsapp",
            "name": "WhatsApp Business",
            "status": "coming_soon",
            "badge": "Coming Soon",
            "description": "Rich conversational messaging via Meta Cloud API.",
            "supported": False
        },
        {
            "id": "phone",
            "name": "Phone / Voice AI",
            "status": "coming_soon",
            "badge": "Coming Soon",
            "description": "Automated voice assistance and follow-up calling.",
            "supported": False
        },
        {
            "id": "rcs",
            "name": "RCS Messaging",
            "status": "coming_soon",
            "badge": "Coming Soon",
            "description": "Rich Communication Services for Android devices.",
            "supported": False
        },
        {
            "id": "push",
            "name": "Push Notifications",
            "status": "coming_soon",
            "badge": "Coming Soon",
            "description": "Web and mobile app push re-engagement campaigns.",
            "supported": False
        }
    ]

@router.get("/audit-logs")
def get_audit_logs(request: Request, limit: int = 50, _=Depends(has_permission(Permission.MANAGE_SETTINGS))):
    """Retrieve company audit trail."""
    supabase = get_supabase()
    company_id = get_current_company_id()
    try:
        res = supabase.table("audit_logs").select("*").eq("company_id", company_id).order("created_at", desc=True).limit(limit).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit logs: {str(e)}")


# ── Super Admin Global Endpoints ────────────────────────────────────────────────
@router.get("/super/companies")
def super_list_companies(request: Request, _=Depends(has_role([Role.SUPER_ADMIN]))):
    """Global admin listing of all company tenants."""
    supabase = get_supabase()
    try:
        res = supabase.table("companies").select("*").order("created_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load global companies: {str(e)}")

@router.put("/super/companies/{target_company_id}/subscription")
def super_update_subscription(target_company_id: str, req: SubscriptionUpdate, request: Request, _=Depends(has_role([Role.SUPER_ADMIN]))):
    """Update subscription plan for any company tenant."""
    supabase = get_supabase()
    try:
        res = supabase.table("companies").update({"plan": req.plan}).eq("id", target_company_id).execute()
        return res.data[0] if res.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update company plan: {str(e)}")

@router.get("/super/analytics")
def super_get_global_analytics(request: Request, _=Depends(has_role([Role.SUPER_ADMIN]))):
    """Global system-wide diagnostics metrics."""
    supabase = get_supabase()
    try:
        companies = len(supabase.table("companies").select("id").execute().data or [])
        customers = len(supabase.table("customers").select("id").execute().data or [])
        orders = len(supabase.table("orders").select("id").execute().data or [])
        comms = len(supabase.table("communications").select("id").execute().data or [])
        
        return {
            "companies_count": companies,
            "customers_count": customers,
            "orders_count": orders,
            "communications_count": comms
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compile global metrics: {str(e)}")
