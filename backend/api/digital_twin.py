"""
Digital Twin API
POST /api/customers/{customer_id}/digital-twin  → generate/refresh twin
GET  /api/customers/{customer_id}/digital-twin  → fetch existing twin
"""
from fastapi import APIRouter, HTTPException, Depends
from backend.utils.auth import has_permission, Permission
from backend.agents.digital_twin.agent import generate_digital_twin, get_digital_twin

router = APIRouter(
    prefix="/api/customers",
    tags=["digital-twin"],
    dependencies=[Depends(has_permission(Permission.READ_ONLY))]
)


@router.get("/{customer_id}/digital-twin")
def fetch_digital_twin(customer_id: str):
    """Return cached digital twin; 404 if not yet generated."""
    twin = get_digital_twin(customer_id)
    if not twin:
        raise HTTPException(
            status_code=404,
            detail="Digital Twin not yet generated for this customer. POST to generate."
        )
    return twin


@router.post(
    "/{customer_id}/digital-twin",
    dependencies=[Depends(has_permission(Permission.MANAGE_CUSTOMERS))]
)
def create_or_refresh_digital_twin(customer_id: str):
    """Generate or refresh the digital twin for a customer."""
    try:
        twin = generate_digital_twin(customer_id)
        return twin
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Digital Twin generation failed: {str(e)}")
