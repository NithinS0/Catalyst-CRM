from fastapi import Request, HTTPException, Depends
from typing import List, Optional
from backend.utils.tenant import get_current_user_role

class Role:
    SUPER_ADMIN = "super_admin"
    OWNER = "owner"
    ADMIN = "admin"
    MARKETER = "marketer"
    ANALYST = "analyst"

class Permission:
    # Super Admin global permissions
    MANAGE_COMPANIES = "manage_companies"
    VIEW_WORKSPACES = "view_workspaces"
    MANAGE_SUBSCRIPTIONS = "manage_subscriptions"
    ACCESS_GLOBAL_ANALYTICS = "access_global_analytics"
    
    # Owner permissions
    MANAGE_BILLING = "manage_billing"
    MANAGE_INTEGRATIONS = "manage_integrations"
    MANAGE_COMPANY_PROFILE = "manage_company_profile"
    
    # Admin / Owner permissions
    MANAGE_USERS = "manage_users"
    MANAGE_SETTINGS = "manage_settings"
    MANAGE_CUSTOMERS = "manage_customers"
    
    # Marketer / Admin / Owner permissions
    CREATE_CAMPAIGNS = "create_campaigns"
    MANAGE_SEGMENTS = "manage_segments"
    USE_AI_STUDIO = "use_ai_studio"
    
    # Analyst / Read-only permissions
    VIEW_ANALYTICS = "view_analytics"
    READ_ONLY = "read_only"

# Mapping roles to their allowed permissions (inclusive hierarchies)
ROLES_PERMISSIONS = {
    Role.SUPER_ADMIN: [
        Permission.MANAGE_COMPANIES,
        Permission.VIEW_WORKSPACES,
        Permission.MANAGE_SUBSCRIPTIONS,
        Permission.ACCESS_GLOBAL_ANALYTICS,
        Permission.MANAGE_BILLING,
        Permission.MANAGE_INTEGRATIONS,
        Permission.MANAGE_COMPANY_PROFILE,
        Permission.MANAGE_USERS,
        Permission.MANAGE_SETTINGS,
        Permission.MANAGE_CUSTOMERS,
        Permission.CREATE_CAMPAIGNS,
        Permission.MANAGE_SEGMENTS,
        Permission.USE_AI_STUDIO,
        Permission.VIEW_ANALYTICS,
        Permission.READ_ONLY
    ],
    Role.OWNER: [
        Permission.MANAGE_BILLING,
        Permission.MANAGE_INTEGRATIONS,
        Permission.MANAGE_COMPANY_PROFILE,
        Permission.MANAGE_USERS,
        Permission.MANAGE_SETTINGS,
        Permission.MANAGE_CUSTOMERS,
        Permission.CREATE_CAMPAIGNS,
        Permission.MANAGE_SEGMENTS,
        Permission.USE_AI_STUDIO,
        Permission.VIEW_ANALYTICS,
        Permission.READ_ONLY
    ],
    Role.ADMIN: [
        Permission.MANAGE_USERS,
        Permission.MANAGE_SETTINGS,
        Permission.MANAGE_CUSTOMERS,
        Permission.CREATE_CAMPAIGNS,
        Permission.MANAGE_SEGMENTS,
        Permission.USE_AI_STUDIO,
        Permission.VIEW_ANALYTICS,
        Permission.READ_ONLY
    ],
    Role.MARKETER: [
        Permission.CREATE_CAMPAIGNS,
        Permission.MANAGE_SEGMENTS,
        Permission.MANAGE_CUSTOMERS,
        Permission.USE_AI_STUDIO,
        Permission.VIEW_ANALYTICS,
        Permission.READ_ONLY
    ],
    Role.ANALYST: [
        Permission.MANAGE_CUSTOMERS,
        Permission.MANAGE_SEGMENTS,
        Permission.VIEW_ANALYTICS,
        Permission.READ_ONLY
    ]
}

def normalize_role(role: str) -> str:
    """Normalize legacy or mixed case role names into standard backend roles."""
    r = (role or "").lower().strip()
    if r == "owner":
        return Role.OWNER
    if r in ("admin", "company_admin"):
        return Role.ADMIN
    if r in ("marketer", "marketing_manager", "member"):
        return Role.MARKETER
    if r == "analyst":
        return Role.ANALYST
    if r == "super_admin":
        return Role.SUPER_ADMIN
    return Role.MARKETER

def has_permission(permission: str):
    """FastAPI dependency to verify if the requesting user's role has the required permission."""
    def dependency(request: Request):
        if request.method == "OPTIONS":
            return
            
        role = getattr(request.state, "role", None)
        if not role:
            # Fallback to request-scoped ContextVar if state is empty
            role = get_current_user_role()
            
        if not role:
            raise HTTPException(status_code=401, detail="Unauthorized: Role not determined in request context")
            
        norm_role = normalize_role(role)
        perms = ROLES_PERMISSIONS.get(norm_role, [])
        if permission not in perms:
            raise HTTPException(
                status_code=403, 
                detail=f"Forbidden: Action requires permission '{permission}'. Your role is '{norm_role}'."
            )
            
    return dependency

def has_role(allowed_roles: List[str]):
    """FastAPI dependency to verify if the requesting user belongs to one of the specified roles."""
    def dependency(request: Request):
        if request.method == "OPTIONS":
            return
            
        role = getattr(request.state, "role", None)
        if not role:
            role = get_current_user_role()
            
        if not role:
            raise HTTPException(status_code=401, detail="Unauthorized: Role not determined in request context")
            
        norm_role = normalize_role(role)
        norm_allowed_roles = [normalize_role(r) for r in allowed_roles]
        if norm_role not in norm_allowed_roles:
            allowed_str = ", ".join(allowed_roles)
            raise HTTPException(
                status_code=403, 
                detail=f"Forbidden: Access restricted to roles: [{allowed_str}]. Your role is '{norm_role}'."
            )
            
    return dependency
