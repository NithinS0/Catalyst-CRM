from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from backend.services.customer_service import CustomerService

router = APIRouter(prefix="/api/customers", tags=["customers"])
segments_router = APIRouter(prefix="/api/segments", tags=["segments"])

class CustomerCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = "lead"
    lead_score: Optional[int] = 0
    custom_attributes: Optional[Dict[str, Any]] = {}

class CustomerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = None
    lead_score: Optional[int] = None
    custom_attributes: Optional[Dict[str, Any]] = None

class InteractionCreate(BaseModel):
    type: str # call, email, meeting, note, support
    summary: str
    details: Optional[str] = None

class SegmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    definition: List[Dict[str, Any]]

# ==========================================
# Customers Endpoints
# ==========================================

@router.get("")
def list_customers():
    return CustomerService.list_customers()

@router.post("")
def create_customer(customer: CustomerCreate):
    try:
        return CustomerService.create_customer(
            first_name=customer.first_name,
            last_name=customer.last_name,
            email=customer.email,
            phone=customer.phone,
            company=customer.company,
            status=customer.status,
            lead_score=customer.lead_score,
            custom_attributes=customer.custom_attributes
        )
    except Exception as e:
        if "unique constraint" in str(e).lower() or "duplicate key" in str(e).lower():
            raise HTTPException(status_code=400, detail="Customer with this email already exists.")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{customer_id}")
def get_customer(customer_id: str, search_query: Optional[str] = None):
    try:
        return CustomerService.get_customer_detail(customer_id, search_query)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{customer_id}")
def update_customer(customer_id: str, updates: CustomerUpdate):
    try:
        updates_dict = updates.dict(exclude_unset=True)
        return CustomerService.update_customer(customer_id, updates_dict)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{customer_id}")
def delete_customer(customer_id: str):
    try:
        return CustomerService.delete_customer(customer_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{customer_id}/orders")
def get_customer_orders(customer_id: str):
    try:
        return CustomerService.get_customer_orders(customer_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{customer_id}/interactions")
def add_interaction(customer_id: str, interaction: InteractionCreate):
    try:
        return CustomerService.add_interaction(
            customer_id=customer_id,
            type_str=interaction.type,
            summary=interaction.summary,
            details=interaction.details
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# Segments Endpoints
# ==========================================

@segments_router.get("")
def list_segments():
    return CustomerService.list_segments()

@segments_router.post("")
def create_segment(segment: SegmentCreate):
    return CustomerService.create_segment(
        name=segment.name,
        description=segment.description,
        definition=segment.definition
    )

@segments_router.get("/{segment_id}/evaluate")
def evaluate_segment(segment_id: str):
    try:
        return CustomerService.evaluate_segment(segment_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
