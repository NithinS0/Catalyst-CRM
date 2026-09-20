from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from collections import Counter
import re
import uuid
import datetime

from backend.database.supabase import get_supabase, execute_query, reset_supabase_client
from backend.utils.auth import has_role, Role
from backend.utils.tenant import get_super_admin_override_active

router = APIRouter(prefix="/api/super", tags=["super_admin"])

# ── Request Schemas ──────────────────────────────────────────────────────────
class CompanyCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    industry: Optional[str] = "Technology"
    logo_url: Optional[str] = None
    primary_color: Optional[str] = "#4f46e5"
    plan: Optional[str] = "free"
    status: Optional[str] = "active"

class CompanyStatusUpdate(BaseModel):
    status: str # active, suspended

# ── Helper to execute counts bypassing tenant filter ─────────────────────────
def get_exact_count(table_name: str) -> int:
    supabase = get_supabase()
    try:
        # Note: Select count="exact" is fast when combined with limit(0)
        res = supabase.table(table_name).select("*", count="exact").limit(0).execute()
        return res.count if res.count is not None else 0
    except Exception as e:
        print(f"Error counting table {table_name}: {e}")
        return 0

# ── Endpoints ────────────────────────────────────────────────────────────────
@router.get("/metrics")
def get_global_metrics(request: Request, _=Depends(has_role([Role.SUPER_ADMIN]))):
    """Compile global system-wide metrics and resource utilization stats."""
    supabase = get_supabase()
    
    # 1. Row counts
    total_companies = get_exact_count("companies")
    total_users = get_exact_count("profiles")
    total_customers = get_exact_count("customers")
    total_campaigns = get_exact_count("campaigns")
    total_messages = get_exact_count("communication_events")
    
    try:
        active_companies = supabase.table("companies").select("*", count="exact").eq("status", "active").limit(0).execute().count
        active_companies = active_companies if active_companies is not None else 0
    except Exception:
        active_companies = total_companies

    # 2. Dynamic Storage Usage (calculated using realistic base factors)
    # Database base size: ~15MB, + ~12KB per customer, + ~8KB per order, + ~15KB per communications, etc.
    orders_count = get_exact_count("orders")
    db_size_kb = 15360 + (total_customers * 12) + (orders_count * 8) + (total_messages * 15)
    db_size_mb = round(db_size_kb / 1024, 2)

    # Vector Storage base size: ~1.5MB, + ~150KB per customer embedding
    embeddings_count = get_exact_count("customer_embeddings")
    vector_size_kb = 1536 + (embeddings_count * 150)
    vector_size_mb = round(vector_size_kb / 1024, 2)

    # 3. Dynamic AI Usage (calculated based on activity counts)
    # Estimate LLM requests: base 100 per company + campaigns * 15 + customer counts * 2
    llm_requests = (total_companies * 120) + (total_campaigns * 25) + (total_customers * 3)
    # Average tokens per request: ~2,200 (prompt + completion)
    tokens_consumed = llm_requests * 2200
    # Average cost: ~$2.00 per million tokens (GPT-4o-mini averages)
    cost_estimation = round((tokens_consumed / 1000000) * 2.00, 2)

    return {
        "metrics": {
            "total_companies": total_companies,
            "active_companies": active_companies,
            "total_users": total_users,
            "total_customers": total_customers,
            "total_campaigns": total_campaigns,
            "total_messages": total_messages
        },
        "storage": {
            "database_usage_mb": db_size_mb,
            "vector_usage_mb": vector_size_mb,
            "total_limit_mb": 500.0
        },
        "ai_usage": {
            "llm_requests": llm_requests,
            "tokens_consumed": tokens_consumed,
            "cost_estimation": cost_estimation
        }
    }

@router.get("/companies")
def list_companies(request: Request, _=Depends(has_role([Role.SUPER_ADMIN]))):
    """Fetch all companies along with their metadata and aggregated user/customer metrics."""
    try:
        # First attempt: direct SQL query for ultra-fast, robust single-roundtrip aggregation
        sql = """
            SELECT 
                c.*,
                COALESCE(u.users_count, 0) as users_count,
                COALESCE(cust.customers_count, 0) as customers_count
            FROM companies c
            LEFT JOIN (
                SELECT company_id, COUNT(*) as users_count 
                FROM profiles 
                GROUP BY company_id
            ) u ON c.id = u.company_id
            LEFT JOIN (
                SELECT company_id, COUNT(*) as customers_count 
                FROM customers 
                GROUP BY company_id
            ) cust ON c.id = cust.company_id
            ORDER BY c.created_at DESC;
        """
        rows = execute_query(sql)
        if rows is not None:
            results = []
            for r in rows:
                item = dict(r)
                if item.get("id"):
                    item["id"] = str(item["id"])
                if item.get("created_at") and hasattr(item["created_at"], "isoformat"):
                    item["created_at"] = item["created_at"].isoformat()
                if item.get("updated_at") and hasattr(item["updated_at"], "isoformat"):
                    item["updated_at"] = item["updated_at"].isoformat()
                results.append(item)
            return results
    except Exception:
        # Proceed to REST fallback if direct SQL has an issue
        pass

    try:
        supabase = get_supabase()
        comp_res = supabase.table("companies").select("*").order("created_at", desc=True).execute()
        companies = comp_res.data or []
        
        users_res = supabase.table("profiles").select("company_id").limit(1000).execute()
        users_data = users_res.data or []
        user_counter = Counter([str(u["company_id"]) for u in users_data if u.get("company_id")])
        
        cust_res = supabase.table("customers").select("company_id").limit(2000).execute()
        cust_data = cust_res.data or []
        cust_counter = Counter([str(c["company_id"]) for c in cust_data if c.get("company_id")])
        
        results = []
        for comp in companies:
            cid = str(comp["id"])
            results.append({
                **comp,
                "users_count": user_counter.get(cid, 0),
                "customers_count": cust_counter.get(cid, 0)
            })
            
        return results
    except Exception as e:
        reset_supabase_client()
        raise HTTPException(status_code=500, detail=f"Failed to load tenant directory: {str(e)}")

@router.post("/companies")
def create_company(req: CompanyCreate, request: Request, _=Depends(has_role([Role.SUPER_ADMIN]))):
    """Manually provision a new tenant company workspace."""
    supabase = get_supabase()
    try:
        # Slugify name if not specified
        slug = req.slug
        if not slug:
            slug = re.sub(r'[^a-zA-Z0-9]', '-', req.name.lower())
            slug = re.sub(r'-+', '-', slug).strip('-')
            if not slug:
                slug = "workspace"
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        # Insert company
        res = supabase.table("companies").insert({
            "name": req.name,
            "slug": slug,
            "industry": req.industry,
            "logo_url": req.logo_url,
            "primary_color": req.primary_color,
            "plan": req.plan,
            "status": req.status
        }).execute()
        
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to write company record.")
            
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create company: {str(e)}")

@router.put("/companies/{company_id}/status")
def update_company_status(company_id: str, req: CompanyStatusUpdate, request: Request, _=Depends(has_role([Role.SUPER_ADMIN]))):
    """Suspend or re-activate a tenant company."""
    supabase = get_supabase()
    try:
        # Update status
        res = supabase.table("companies").update({"status": req.status}).eq("id", company_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Company not found.")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to adjust company status: {str(e)}")

@router.delete("/companies/{company_id}")
def delete_company(company_id: str, request: Request, _=Depends(has_role([Role.SUPER_ADMIN]))):
    """Permanently delete a company and all cascade-related workspace records."""
    supabase = get_supabase()
    try:
        # Delete company (cascade deletes all related tables via Foreign Key CASCADE rules)
        res = supabase.table("companies").delete().eq("id", company_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Company not found.")
        return {"status": "success", "message": f"Company {company_id} and all related workspace records purged."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete company: {str(e)}")

@router.get("/activity")
def get_recent_activity(request: Request, _=Depends(has_role([Role.SUPER_ADMIN]))):
    """Compile a system-wide chronological activity log."""
    supabase = get_supabase()
    activity_list = []
    
    try:
        # 1. Fetch recent companies
        comps = supabase.table("companies").select("id, name, created_at").order("created_at", desc=True).limit(8).execute().data or []
        for c in comps:
            activity_list.append({
                "id": f"comp-{c['id']}",
                "type": "company_created",
                "title": f"New Company Registered: '{c['name']}'",
                "timestamp": c["created_at"],
                "company_name": c["name"],
                "level": "info"
            })
            
        # 2. Fetch recent campaigns (including joined company name if available)
        campaigns = supabase.table("campaigns").select("id, name, created_at, companies(name)").order("created_at", desc=True).limit(8).execute().data or []
        for cp in campaigns:
            cname = cp.get("companies", {}).get("name") if cp.get("companies") else "Unknown"
            activity_list.append({
                "id": f"camp-{cp['id']}",
                "type": "campaign_created",
                "title": f"Campaign Initiated: '{cp['name']}'",
                "timestamp": cp["created_at"],
                "company_name": cname,
                "level": "success"
            })

        # 3. Fetch recent logs from agent_logs (failures or warning notifications)
        logs = supabase.table("agent_logs").select("id, message, level, created_at, companies(name)").order("created_at", desc=True).limit(10).execute().data or []
        for log in logs:
            cname = log.get("companies", {}).get("name") if log.get("companies") else "System"
            activity_list.append({
                "id": f"log-{log['id']}",
                "type": "agent_log",
                "title": f"Agent Log: {log['message']}",
                "timestamp": log["created_at"],
                "company_name": cname,
                "level": "error" if log["level"] == "error" else "warning" if log["level"] == "warning" else "info"
            })
            
        # Sort chronologically, descending
        activity_list.sort(key=lambda x: x["timestamp"], reverse=True)
        return activity_list[:15]
    except Exception as e:
        print(f"Error building activity log: {e}")
        return []
