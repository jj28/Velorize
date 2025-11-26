from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.customer import CustomerType, CustomerStatus


class CustomerBase(BaseModel):
    customer_code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    type: CustomerType
    status: CustomerStatus = CustomerStatus.ACTIVE
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
    credit_limit_rm: Optional[int] = Field(None, ge=0)
    payment_terms_days: int = Field(30, ge=0)
    is_key_account: bool = False
    notes: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "customer_code": "CUST-001",
                "name": "Poke Bowl Central Sdn Bhd",
                "type": "food_service",
                "status": "active",
                "contact_person": "Ahmad Hassan",
                "email": "ahmad@pokebowlcentral.com.my",
                "phone": "+60123456789",
                "address_line1": "123 Jalan Bukit Bintang",
                "city": "Kuala Lumpur",
                "state": "Wilayah Persekutuan",
                "postal_code": "50200",
                "country": "Malaysia",
                "credit_limit_rm": 50000,
                "payment_terms_days": 30,
                "is_key_account": True
            }
        }


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    customer_code: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[CustomerType] = None
    status: Optional[CustomerStatus] = None
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
    credit_limit_rm: Optional[int] = Field(None, ge=0)
    payment_terms_days: Optional[int] = Field(None, ge=0)
    is_key_account: Optional[bool] = None
    notes: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True