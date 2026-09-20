import os
import uuid
import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from backend.database.supabase import get_supabase

router = APIRouter(prefix="/api/contact-sales", tags=["contact-sales"])

class ContactSalesRequest(BaseModel):
    name: str = Field(..., min_length=3)
    email: EmailStr
    job_title: str
    company_name: str
    industry: str
    company_size: str
    expected_customers: Optional[str] = None
    campaign_volume: Optional[str] = None
    current_crm: Optional[str] = None
    use_cases: List[str] = Field(default_factory=list)
    message: str = Field(..., min_length=20)

@router.post("")
def submit_contact_sales(req: ContactSalesRequest):
    # Business email validation (check if domain is a free provider)
    email_domain = req.email.split("@")[1].lower()
    free_domains = {
        "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com",
        "icloud.com", "mail.com", "zoho.com", "protonmail.com", "proton.me",
        "yandex.com", "gmx.com", "mail.ru", "live.com"
    }
    if email_domain in free_domains:
        raise HTTPException(
            status_code=400,
            detail="Please use a valid business email address, not a free email provider."
        )

    lead_id = None
    created_at = None
    saved_to_db = False

    # Try inserting via Supabase REST API (Port 443 HTTPS)
    try:
        supabase = get_supabase()
        res = supabase.table("enterprise_leads").insert({
            "name": req.name,
            "email": req.email,
            "job_title": req.job_title,
            "company_name": req.company_name,
            "industry": req.industry,
            "company_size": req.company_size,
            "expected_customers": req.expected_customers,
            "campaign_volume": req.campaign_volume,
            "current_crm": req.current_crm,
            "use_cases": req.use_cases,
            "message": req.message,
            "status": "new"
        }).execute()

        if res.data and len(res.data) > 0:
            lead_id = res.data[0].get("id")
            created_at = res.data[0].get("created_at")
            saved_to_db = True
    except Exception as db_err:
        print(f"[Warning] Supabase direct insert failed: {str(db_err)}. Falling back to local JSON logging.")

    # Fallback to local JSON logging if DB is not migrated/reachable
    if not saved_to_db:
        lead_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        fallback_file = "d:\\XENO\\backend\\enterprise_leads.json"
        
        lead_data = {
            "id": lead_id,
            "name": req.name,
            "email": req.email,
            "job_title": req.job_title,
            "company_name": req.company_name,
            "industry": req.industry,
            "company_size": req.company_size,
            "expected_customers": req.expected_customers,
            "campaign_volume": req.campaign_volume,
            "current_crm": req.current_crm,
            "use_cases": req.use_cases,
            "message": req.message,
            "status": "new",
            "created_at": created_at,
            "is_local_fallback": True
        }

        try:
            leads = []
            if os.path.exists(fallback_file):
                with open(fallback_file, "r", encoding="utf-8") as f:
                    try:
                        leads = json.load(f)
                    except Exception:
                        leads = []
            leads.append(lead_data)
            with open(fallback_file, "w", encoding="utf-8") as f:
                json.dump(leads, f, indent=2)
            print(f"Lead saved locally to: {fallback_file}")
        except Exception as file_err:
            print(f"[Error] Failed to write lead to local file: {str(file_err)}")

    # Email notification (mock/console output)
    print("----------------------------------------------------------------------")
    print("NOTIFICATION: New Enterprise Lead Submitted!")
    print("To: sales@catalystcrm.ai")
    print(f"Subject: New Enterprise Lead - {req.company_name}")
    print("Body:")
    print(f"  Name: {req.name}")
    print(f"  Email: {req.email}")
    print(f"  Job Title: {req.job_title}")
    print(f"  Company Name: {req.company_name}")
    print(f"  Company Size: {req.company_size}")
    print(f"  Industry: {req.industry}")
    print(f"  Expected Customers: {req.expected_customers}")
    print(f"  Campaign Volume: {req.campaign_volume}")
    print(f"  Current CRM: {req.current_crm}")
    print(f"  Use Cases: {', '.join(req.use_cases)}")
    print(f"  Message: {req.message}")
    print(f"  Lead Saved: {'Database' if saved_to_db else 'Local JSON Fallback'}")
    print("----------------------------------------------------------------------")

    return {
        "status": "success",
        "lead_id": lead_id,
        "created_at": created_at,
        "saved_to_db": saved_to_db
    }
