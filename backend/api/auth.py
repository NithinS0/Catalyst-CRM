from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from backend.database.supabase import get_supabase

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
def register(req: RegisterRequest):
    supabase = get_supabase()
    try:
        # 1. Create the user using Admin API (which bypasses email verification)
        auth_res = supabase.auth.admin.create_user({
            "email": req.email,
            "password": req.password,
            "email_confirm": True,
            "user_metadata": {
                "name": req.name
            }
        })
        user_id = auth_res.user.id
        
        # 2. Insert into the public.profiles table manually
        supabase.table("profiles").insert({
            "id": user_id,
            "name": req.name,
            "email": req.email,
            "role": "admin"
        }).execute()
        
        return {
            "status": "success",
            "message": "User registered successfully",
            "user": {
                "id": user_id,
                "name": req.name,
                "email": req.email,
                "role": "admin"
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
    from supabase import create_client
    from backend.config import settings
    # Initialize a local client for login to prevent modifying the global client's session
    local_supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    supabase = get_supabase()
    try:
        # 1. Perform sign in using credentials on the local client
        auth_res = local_supabase.auth.sign_in_with_password(credentials={
            "email": req.email,
            "password": req.password
        })
        
        if not auth_res.session:
            raise HTTPException(status_code=401, detail="Authentication failed (no session returned).")
            
        user_id = auth_res.user.id
        
        # 2. Fetch user profile from public.profiles
        profile_res = supabase.table("profiles").select("*").eq("id", user_id).execute()
        if not profile_res.data:
            # Fallback if profile doesn't exist for some reason
            name = auth_res.user.user_metadata.get("name", req.email.split("@")[0])
            supabase.table("profiles").insert({
                "id": user_id,
                "name": name,
                "email": req.email,
                "role": "admin"
            }).execute()
            profile = {
                "id": user_id,
                "name": name,
                "email": req.email,
                "role": "admin"
            }
        else:
            profile = profile_res.data[0]
            
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
