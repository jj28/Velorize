from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import date, datetime
from app.models.marketing import PromoType, PromoStatus, PromoChannel


class MarketingCalendarBase(BaseModel):
    event_name: str = Field(..., max_length=255)
    event_code: str = Field(..., max_length=50)
    promo_type: PromoType
    start_date: date
    end_date: date
    duration_days: int
    promo_channel: PromoChannel = PromoChannel.ALL_CHANNELS
    target_customer_segments: Optional[str] = None
    geographic_scope: str = Field("Malaysia", max_length=255)
    discount_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    discount_amount: Optional[Decimal] = Field(None, ge=0)
    minimum_purchase_amount: Optional[Decimal] = Field(None, ge=0)
    maximum_discount_amount: Optional[Decimal] = Field(None, ge=0)
    volume_threshold_1: Optional[Decimal] = Field(None, ge=0)
    volume_discount_1: Optional[Decimal] = Field(None, ge=0, le=100)
    volume_threshold_2: Optional[Decimal] = Field(None, ge=0)
    volume_discount_2: Optional[Decimal] = Field(None, ge=0, le=100)
    marketing_budget_rm: Decimal = Field(0, ge=0)
    expected_roi_percentage: Optional[Decimal] = Field(None)
    expected_uplift_percentage: Decimal = Field(0, ge=0)
    expected_cannibalization_rate: Decimal = Field(0, ge=0, le=100)
    baseline_volume_impact: Decimal = Field(0, ge=0)
    status: PromoStatus = PromoStatus.PLANNED
    created_by_user_id: int
    approved_by_user_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    actual_sales_volume: Optional[Decimal] = Field(None, ge=0)
    actual_sales_value_rm: Optional[Decimal] = Field(None, ge=0)
    actual_uplift_percentage: Optional[Decimal] = Field(None)
    actual_roi_percentage: Optional[Decimal] = Field(None)
    description: Optional[str] = None
    success_criteria: Optional[str] = None
    lessons_learned: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "event_name": "Christmas Poke Special 2025",
                "event_code": "XMAS2025",
                "promo_type": "discount",
                "start_date": "2025-12-15",
                "end_date": "2025-12-31",
                "duration_days": 17,
                "promo_channel": "all_channels",
                "target_customer_segments": "Premium customers, Food service",
                "geographic_scope": "Malaysia",
                "discount_percentage": 15.0,
                "minimum_purchase_amount": 50.0,
                "maximum_discount_amount": 20.0,
                "marketing_budget_rm": 5000.0,
                "expected_roi_percentage": 200.0,
                "expected_uplift_percentage": 25.0,
                "expected_cannibalization_rate": 10.0,
                "baseline_volume_impact": 150.0,
                "status": "planned",
                "created_by_user_id": 1,
                "description": "Holiday season promotion to boost Q4 sales",
                "success_criteria": "25% volume uplift, 200% ROI, maintain margin >20%"
            }
        }


class MarketingCalendarCreate(MarketingCalendarBase):
    pass


class MarketingCalendarUpdate(BaseModel):
    event_name: Optional[str] = Field(None, max_length=255)
    promo_type: Optional[PromoType] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration_days: Optional[int] = None
    promo_channel: Optional[PromoChannel] = None
    target_customer_segments: Optional[str] = None
    geographic_scope: Optional[str] = Field(None, max_length=255)
    discount_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    discount_amount: Optional[Decimal] = Field(None, ge=0)
    minimum_purchase_amount: Optional[Decimal] = Field(None, ge=0)
    maximum_discount_amount: Optional[Decimal] = Field(None, ge=0)
    marketing_budget_rm: Optional[Decimal] = Field(None, ge=0)
    expected_roi_percentage: Optional[Decimal] = Field(None)
    expected_uplift_percentage: Optional[Decimal] = Field(None, ge=0)
    expected_cannibalization_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    baseline_volume_impact: Optional[Decimal] = Field(None, ge=0)
    status: Optional[PromoStatus] = None
    approved_by_user_id: Optional[int] = None
    actual_sales_volume: Optional[Decimal] = Field(None, ge=0)
    actual_sales_value_rm: Optional[Decimal] = Field(None, ge=0)
    actual_uplift_percentage: Optional[Decimal] = Field(None)
    actual_roi_percentage: Optional[Decimal] = Field(None)
    description: Optional[str] = None
    success_criteria: Optional[str] = None
    lessons_learned: Optional[str] = None


class MarketingCalendarResponse(MarketingCalendarBase):
    id: int
    is_active: bool
    days_until_start: int
    days_until_end: int
    campaign_phase: str
    roi_performance: str
    uplift_accuracy: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True