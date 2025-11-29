from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import date, datetime
from app.models.sales import SalesChannel, OrderStatus, PaymentStatus


class SalesActualBase(BaseModel):
    product_id: int
    customer_id: int
    transaction_date: date
    invoice_number: str = Field(..., max_length=100)
    quantity_sold: Decimal = Field(..., gt=0)
    unit_price: Decimal = Field(..., gt=0)
    gross_sales_amount: Decimal = Field(..., ge=0)
    discount_amount: Decimal = Field(0, ge=0)
    net_sales_amount: Decimal = Field(..., ge=0)
    unit_cost: Decimal = Field(..., gt=0)
    total_cost: Decimal = Field(..., ge=0)
    gross_margin_amount: Decimal = Field(...)
    gross_margin_percentage: Decimal = Field(...)
    sales_channel: SalesChannel
    sales_rep_id: Optional[int] = None
    promotion_code: Optional[str] = Field(None, max_length=50)
    is_promotional_sale: bool = False
    delivery_location: Optional[str] = Field(None, max_length=255)
    delivery_date: Optional[date] = None
    shipping_cost: Decimal = Field(0, ge=0)
    notes: Optional[str] = None


class SalesActualCreate(SalesActualBase):
    class Config:
        json_schema_extra = {
            "example": {
                "product_id": 1,
                "customer_id": 1,
                "transaction_date": "2025-11-25",
                "invoice_number": "INV-2025-001234",
                "quantity_sold": 3.0,
                "unit_price": 18.90,
                "gross_sales_amount": 56.70,
                "discount_amount": 5.67,
                "net_sales_amount": 51.03,
                "unit_cost": 12.50,
                "total_cost": 37.50,
                "gross_margin_amount": 13.53,
                "gross_margin_percentage": 26.51,
                "sales_channel": "food_service",
                "sales_rep_id": 2,
                "is_promotional_sale": True,
                "promotion_code": "LAUNCH10",
                "delivery_location": "Poke Bowl Central, KL",
                "delivery_date": "2025-11-25",
                "shipping_cost": 8.50
            }
        }


class SalesActualResponse(SalesActualBase):
    id: int
    margin_per_unit: Decimal
    revenue_contribution_score: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SalesOrderBase(BaseModel):
    order_number: str = Field(..., max_length=100)
    external_order_ref: Optional[str] = Field(None, max_length=100)
    customer_id: int
    order_date: date
    requested_delivery_date: date
    confirmed_delivery_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None
    product_id: int
    quantity_ordered: Decimal = Field(..., gt=0)
    quantity_shipped: Decimal = Field(0, ge=0)
    quantity_remaining: Decimal = Field(..., ge=0)
    unit_price: Decimal = Field(..., gt=0)
    total_order_value: Decimal = Field(..., ge=0)
    order_status: OrderStatus = OrderStatus.PENDING
    payment_status: PaymentStatus = PaymentStatus.PENDING
    sales_channel: SalesChannel
    sales_rep_id: Optional[int] = None
    priority_level: str = Field("Normal", max_length=20)
    special_instructions: Optional[str] = None
    requires_cold_chain: bool = False
    production_start_date: Optional[date] = None
    production_completion_date: Optional[date] = None
    notes: Optional[str] = None


class SalesOrderCreate(SalesOrderBase):
    class Config:
        json_schema_extra = {
            "example": {
                "order_number": "SO-2025-001234",
                "external_order_ref": "PO-ABC-789",
                "customer_id": 1,
                "order_date": "2025-11-25",
                "requested_delivery_date": "2025-11-28",
                "product_id": 1,
                "quantity_ordered": 50.0,
                "quantity_remaining": 50.0,
                "unit_price": 18.90,
                "total_order_value": 945.00,
                "order_status": "confirmed",
                "payment_status": "pending",
                "sales_channel": "food_service",
                "sales_rep_id": 2,
                "priority_level": "High",
                "requires_cold_chain": True,
                "special_instructions": "Deliver between 6-8 AM for freshness"
            }
        }


class SalesOrderUpdate(BaseModel):
    confirmed_delivery_date: Optional[date] = None
    actual_delivery_date: Optional[date] = None
    quantity_shipped: Optional[Decimal] = Field(None, ge=0)
    quantity_remaining: Optional[Decimal] = Field(None, ge=0)
    order_status: Optional[OrderStatus] = None
    payment_status: Optional[PaymentStatus] = None
    priority_level: Optional[str] = Field(None, max_length=20)
    special_instructions: Optional[str] = None
    production_start_date: Optional[date] = None
    production_completion_date: Optional[date] = None
    notes: Optional[str] = None


class SalesOrderResponse(SalesOrderBase):
    id: int
    is_overdue: bool
    days_until_delivery: int
    fulfillment_percentage: float
    order_urgency: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True