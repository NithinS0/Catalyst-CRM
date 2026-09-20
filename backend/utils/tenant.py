import contextvars
from typing import Optional
from contextlib import contextmanager

# Request-scoped tenant context variable
_current_company_id: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("current_company_id", default=None)

# Request-scoped user role variable
_current_user_role: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("current_user_role", default=None)

# Request-scoped flag indicating if the super admin has active workspace override
_super_admin_override_active: contextvars.ContextVar[bool] = contextvars.ContextVar("super_admin_override_active", default=False)

def get_current_company_id() -> Optional[str]:
    """Retrieve the company_id for the current request context."""
    return _current_company_id.get()

def set_current_company_id(company_id: Optional[str]) -> contextvars.Token:
    """Set the company_id for the current request context."""
    return _current_company_id.set(company_id)

def reset_current_company_id(token: contextvars.Token) -> None:
    """Reset the company_id context var using the token."""
    _current_company_id.reset(token)

def get_current_user_role() -> Optional[str]:
    """Retrieve the role for the current request context."""
    return _current_user_role.get()

def set_current_user_role(role: Optional[str]) -> contextvars.Token:
    """Set the role for the current request context."""
    return _current_user_role.set(role)

def reset_current_user_role(token: contextvars.Token) -> None:
    """Reset the role context var using the token."""
    _current_user_role.reset(token)

def get_super_admin_override_active() -> bool:
    """Check if the super admin override is active for the current request."""
    return _super_admin_override_active.get()

def set_super_admin_override_active(val: bool) -> contextvars.Token:
    """Set the super admin override status."""
    return _super_admin_override_active.set(val)

def reset_super_admin_override_active(token: contextvars.Token) -> None:
    """Reset the super admin override context var using the token."""
    _super_admin_override_active.reset(token)

@contextmanager
def tenant_context(company_id: Optional[str], role: Optional[str] = None, override_active: bool = False):
    """Context manager to run a block of code under a specific company and role context."""
    comp_token = set_current_company_id(company_id)
    role_token = set_current_user_role(role)
    override_token = set_super_admin_override_active(override_active)
    try:
        yield
    finally:
        reset_current_company_id(comp_token)
        reset_current_user_role(role_token)
        reset_super_admin_override_active(override_token)

