import re
import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from supabase import create_client
from backend.database.supabase import get_supabase
from backend.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    company_name: str
    company_email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    number_of_users: Optional[str] = "1-10"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
def register(req: RegisterRequest):
    supabase = get_supabase()
    try:
        # 1. Create company record
        slug = re.sub(r'[^a-zA-Z0-9]', '-', req.company_name.lower())
        slug = re.sub(r'-+', '-', slug).strip('-')
        if not slug:
            slug = "workspace"
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        comp_res = supabase.table("companies").insert({
            "name": req.company_name,
            "slug": slug,
            "primary_color": "#2B2B2B",
            "secondary_color": "#B3B3B3",
            "plan": "free",
            "status": "active",
            "phone": req.phone_number,
            "number_of_users": req.number_of_users,
            "email_sender_name": req.company_name,
            "email_sender_address": req.company_email or req.email
        }).execute()

        if not comp_res.data:
            raise Exception("Failed to create company record.")
        company_data = comp_res.data[0]
        company_id = company_data["id"]

        # 2. Create the user using Supabase Admin API
        auth_res = supabase.auth.admin.create_user({
            "email": req.email,
            "password": req.password,
            "email_confirm": True,
            "user_metadata": {
                "name": req.name
            }
        })
        user_id = auth_res.user.id

        # 3. Insert into profiles with OWNER role
        supabase.table("profiles").insert({
            "id": user_id,
            "name": req.name,
            "email": req.email,
            "role": "owner",
            "company_id": company_id
        }).execute()

        # 4. Insert into company_members
        supabase.table("company_members").insert({
            "company_id": company_id,
            "user_id": user_id,
            "email": req.email,
            "name": req.name,
            "role": "owner",
            "status": "active"
        }).execute()

        # 5. Log audit event
        try:
            supabase.table("audit_logs").insert({
                "company_id": company_id,
                "user_id": user_id,
                "user_name": req.name,
                "user_email": req.email,
                "action": "workspace_created",
                "resource_type": "company",
                "resource_id": company_id,
                "details": {"company_name": req.company_name, "role": "owner"}
            }).execute()
        except Exception:
            pass

        # 6. Auto-login session creation
        local_supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        auth_session = local_supabase.auth.sign_in_with_password(credentials={
            "email": req.email,
            "password": req.password
        })

        session_data = None
        if auth_session and auth_session.session:
            session_data = {
                "access_token": auth_session.session.access_token,
                "refresh_token": auth_session.session.refresh_token,
                "expires_at": auth_session.session.expires_at
            }

        return {
            "status": "success",
            "message": "Catalyst workspace created successfully.",
            "session": session_data,
            "user": {
                "id": user_id,
                "name": req.name,
                "email": req.email,
                "role": "owner",
                "company_id": company_id,
                "company": company_data
            }
        }
    except Exception as e:
        err_msg = str(e)
        is_duplicate = (
            "already exists" in err_msg.lower() or
            "unique constraint" in err_msg.lower() or
            "already registered" in err_msg.lower() or
            "already been registered" in err_msg.lower() or
            ("already" in err_msg.lower() and "registered" in err_msg.lower())
        )
        if is_duplicate:
            raise HTTPException(status_code=400, detail="A user with this email is already registered.")
        raise HTTPException(status_code=500, detail=f"Registration failed: {err_msg}")

@router.post("/login")
def login(req: LoginRequest):
    local_supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    supabase = get_supabase()
    try:
        auth_res = local_supabase.auth.sign_in_with_password(credentials={
            "email": req.email,
            "password": req.password
        })
        
        if not auth_res.session:
            raise HTTPException(status_code=401, detail="Authentication failed (no session returned).")
            
        user_id = auth_res.user.id
        
        profile_res = supabase.table("profiles").select("*, companies(*)").eq("id", user_id).execute()
        if not profile_res.data:
            name = auth_res.user.user_metadata.get("name", req.email.split("@")[0])
            default_company_id = 'c1111111-1111-1111-1111-111111111111'
            supabase.table("profiles").insert({
                "id": user_id,
                "name": name,
                "email": req.email,
                "role": "owner",
                "company_id": default_company_id
            }).execute()
            
            comp_res = supabase.table("companies").select("*").eq("id", default_company_id).single().execute()
            profile = {
                "id": user_id,
                "name": name,
                "email": req.email,
                "role": "owner",
                "company_id": default_company_id,
                "company": comp_res.data if comp_res.data else None
            }
        else:
            profile = profile_res.data[0]
            company = profile.pop("companies", None)
            profile["company"] = company
            
        if company and company.get("status") == "suspended" and profile.get("role") != "super_admin":
            raise HTTPException(status_code=403, detail="Your company workspace has been suspended. Please contact support.")

        # Log audit
        try:
            supabase.table("audit_logs").insert({
                "company_id": profile.get("company_id"),
                "user_id": user_id,
                "user_name": profile.get("name"),
                "user_email": req.email,
                "action": "user_login",
                "resource_type": "auth",
                "resource_id": user_id
            }).execute()
        except Exception:
            pass

        return {
            "status": "success",
            "session": {
                "access_token": auth_res.session.access_token,
                "refresh_token": auth_res.session.refresh_token,
                "expires_at": auth_res.session.expires_at
            },
            "user": profile
        }
    except Exception as e:
        err_msg = str(e)
        if "invalid login credentials" in err_msg.lower() or "invalid credentials" in err_msg.lower():
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        raise HTTPException(status_code=500, detail=f"Login failed: {err_msg}")

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/refresh")
def refresh_session(req: RefreshRequest):
    """Exchange a valid refresh_token for a fresh access_token and refresh_token."""
    local_supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    try:
        auth_res = local_supabase.auth.refresh_session(req.refresh_token)
        if not auth_res or not auth_res.session:
            raise HTTPException(status_code=401, detail="Session refresh failed: invalid or expired refresh token.")
        return {
            "status": "success",
            "session": {
                "access_token": auth_res.session.access_token,
                "refresh_token": auth_res.session.refresh_token,
                "expires_at": auth_res.session.expires_at
            }
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Session refresh failed: {str(e)}")
