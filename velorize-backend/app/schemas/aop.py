from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import date, datetime
from app.models.aop import AOPPeriod, AOPStatus, AOPCategory


class AOPTargetBase(BaseModel):
    fiscal_year: int = Field(..., ge=2020, le=2050)
    period: AOPPeriod
    period_start_date: date
    period_end_date: date
    scope_type: str = Field(..., max_length=50)  # "company", "category", "product"
    product_id: Optional[int] = None
    category: Optional[str] = Field(None, max_length=100)
    target_category: AOPCategory
    target_name: str = Field(..., max_length=255)
    target_description: Optional[str] = None
    target_revenue_rm: Optional[Decimal] = Field(None, ge=0)
    target_volume_units: Optional[Decimal] = Field(None, ge=0)
    target_margin_rm: Optional[Decimal] = Field(None, ge=0)
    target_margin_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    target_market_share_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    target_new_customers: Optional[int] = Field(None, ge=0)
    target_customer_retention_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    target_inventory_turnover: Optional[Decimal] = Field(None, ge=0)
    target_cost_reduction_rm: Optional[Decimal] = Field(None, ge=0)
    target_service_level_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    actual_revenue_rm: Decimal = Field(0, ge=0)
    actual_volume_units: Decimal = Field(0, ge=0)
    actual_margin_rm: Decimal = Field(0, ge=0)
    actual_margin_percentage: Decimal = Field(0, ge=0)
    ytd_achievement_percentage: Decimal = Field(0, ge=0)
    forecast_achievement_percentage: Decimal = Field(0, ge=0)
    variance_to_target_rm: Decimal = Field(0)
    variance_to_target_percentage: Decimal = Field(0)
    risk_level: str = Field("Medium", max_length=20)
    risk_factors: Optional[str] = None
    mitigation_actions: Optional[str] = None
    status: AOPStatus = AOPStatus.DRAFT
    version: str = Field("1.0", max_length=20)
    owner_user_id: int
    created_by_user_id: int
    approved_by_user_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    last_review_date: Optional[date] = None
    next_review_date: Optional[date] = None
    notes: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "fiscal_year": 2025,
                "period": "yearly",
                "period_start_date": "2025-01-01",
                "period_end_date": "2025-12-31",
                "scope_type": "category",
                "category": "finished_goods",
                "target_category": "sales_revenue",
                "target_name": "F&B Revenue Growth 2025",
                "target_description": "Achieve 25% revenue growth in finished goods category",
                "target_revenue_rm": 1200000.00,
                "target_volume_units": 50000.0,
                "target_margin_rm": 360000.00,
                "target_margin_percentage": 30.0,
                "target_market_share_percentage": 15.0,
                "target_new_customers": 50,
                "target_service_level_percentage": 95.0,
                "actual_revenue_rm": 250000.00,
                "actual_volume_units": 10500.0,
                "actual_margin_rm": 72000.00,
                "actual_margin_percentage": 28.8,
                "ytd_achievement_percentage": 20.8,
                "risk_level": "Medium",
                "risk_factors": "Supply chain disruption, inflation pressure",
                "mitigation_actions": "Diversify suppliers, optimize pricing strategy",
                "status": "approved",
                "version": "1.0",
                "owner_user_id": 1,
                "created_by_user_id": 1,
                "next_review_date": "2025-03-31"
            }
        }


class AOPTargetCreate(AOPTargetBase):
    pass


class AOPTargetUpdate(BaseModel):
    target_description: Optional[str] = None
    target_revenue_rm: Optional[Decimal] = Field(None, ge=0)
    target_volume_units: Optional[Decimal] = Field(None, ge=0)
    target_margin_rm: Optional[Decimal] = Field(None, ge=0)
    target_margin_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    target_market_share_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    target_new_customers: Optional[int] = Field(None, ge=0)
    target_customer_retention_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    target_inventory_turnover: Optional[Decimal] = Field(None, ge=0)
    target_cost_reduction_rm: Optional[Decimal] = Field(None, ge=0)
    target_service_level_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    actual_revenue_rm: Optional[Decimal] = Field(None, ge=0)
    actual_volume_units: Optional[Decimal] = Field(None, ge=0)
    actual_margin_rm: Optional[Decimal] = Field(None, ge=0)
    actual_margin_percentage: Optional[Decimal] = Field(None, ge=0)
    ytd_achievement_percentage: Optional[Decimal] = Field(None, ge=0)
    forecast_achievement_percentage: Optional[Decimal] = Field(None, ge=0)
    variance_to_target_rm: Optional[Decimal] = Field(None)
    variance_to_target_percentage: Optional[Decimal] = Field(None)
    risk_level: Optional[str] = Field(None, max_length=20)
    risk_factors: Optional[str] = None
    mitigation_actions: Optional[str] = None
    status: Optional[AOPStatus] = None
    version: Optional[str] = Field(None, max_length=20)
    approved_by_user_id: Optional[int] = None
    last_review_date: Optional[date] = None
    next_review_date: Optional[date] = None
    notes: Optional[str] = None


class AOPTargetResponse(AOPTargetBase):
    id: int
    is_on_track: bool
    performance_status: str
    performance_color: str
    days_remaining: int
    progress_percentage: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Aliases for backward compatibility
AOPCreate = AOPTargetCreate
AOPUpdate = AOPTargetUpdate
AOPResponse = AOPTargetResponse