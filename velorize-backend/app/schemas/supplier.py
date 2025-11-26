from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.supplier import SupplierType, SupplierStatus


class SupplierBase(BaseModel):
    supplier_code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    type: SupplierType
    status: SupplierStatus = SupplierStatus.ACTIVE
    contact_person: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: str = Field("Malaysia", max_length=100)
    business_registration_number: Optional[str] = Field(None, max_length=100)
    tax_id: Optional[str] = Field(None, max_length=100)
    payment_terms_days: int = Field(30, ge=0)
    lead_time_days: Optional[int] = Field(None, ge=0)
    minimum_order_quantity: Optional[int] = Field(None, ge=0)
    is_preferred: bool = False
    quality_rating: Optional[str] = Field(None, max_length=10)
    halal_certified: bool = False
    notes: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "supplier_code": "SUPP-001",
                "name": "Fresh Seafood Suppliers Sdn Bhd",
                "type": "raw_material",
                "status": "active",
                "contact_person": "Lim Wei Ming",
                "email": "wm.lim@freshseafood.com.my",
                "phone": "+60387654321",
                "address_line1": "45 Jalan Klang Lama",
                "city": "Kuala Lumpur",
                "state": "Wilayah Persekutuan",
                "postal_code": "58000",
                "country": "Malaysia",
                "payment_terms_days": 14,
                "lead_time_days": 1,
                "minimum_order_quantity": 10,
                "is_preferred": True,
                "quality_rating": "A",
                "halal_certified": True
            }
        }


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    supplier_code: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[SupplierType] = None
    status: Optional[SupplierStatus] = None
    contact_person: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    business_registration_number: Optional[str] = Field(None, max_length=100)
    tax_id: Optional[str] = Field(None, max_length=100)
    payment_terms_days: Optional[int] = Field(None, ge=0)
    lead_time_days: Optional[int] = Field(None, ge=0)
    minimum_order_quantity: Optional[int] = Field(None, ge=0)
    is_preferred: Optional[bool] = None
    quality_rating: Optional[str] = Field(None, max_length=10)
    halal_certified: Optional[bool] = None
    notes: Optional[str] = None


class SupplierResponse(SupplierBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True