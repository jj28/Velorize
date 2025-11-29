from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import date, datetime
from app.models.forecast import ForecastMethod, ForecastType, ForecastStatus


class DemandForecastBase(BaseModel):
    product_id: int
    forecast_date: date
    forecast_period_start: date
    forecast_period_end: date
    forecast_method: ForecastMethod
    forecast_type: ForecastType = ForecastType.BASELINE
    status: ForecastStatus = ForecastStatus.DRAFT
    baseline_demand: Decimal = Field(0, ge=0)
    promotional_uplift: Decimal = Field(0, ge=0)
    final_forecast: Decimal = Field(0, ge=0)
    actual_demand: Optional[Decimal] = Field(None, ge=0)
    absolute_error: Optional[Decimal] = Field(None, ge=0)
    percentage_error: Optional[Decimal] = Field(None)
    confidence_level: Optional[Decimal] = Field(None, ge=0, le=100)
    forecast_bias: Decimal = Field(0)
    seasonal_factor: Decimal = Field(1, gt=0)
    trend_factor: Decimal = Field(1, gt=0)
    marketing_events: Optional[str] = None
    external_factors: Optional[str] = None
    version: str = Field("1.0", max_length=20)
    forecast_lag: int = Field(0, ge=0)
    created_by_user_id: int
    approved_by_user_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "product_id": 1,
                "forecast_date": "2025-12-01",
                "forecast_period_start": "2025-12-01",
                "forecast_period_end": "2025-12-31",
                "forecast_method": "sarima",
                "forecast_type": "consensus",
                "status": "approved",
                "baseline_demand": 150.0,
                "promotional_uplift": 25.0,
                "final_forecast": 175.0,
                "confidence_level": 85.5,
                "forecast_bias": 0.05,
                "seasonal_factor": 1.15,
                "trend_factor": 1.02,
                "marketing_events": "Christmas promotion, Year-end sale",
                "external_factors": "Holiday season, increased dining out",
                "version": "2.1",
                "forecast_lag": 4,
                "created_by_user_id": 1,
                "notes": "Adjusted for holiday seasonality"
            }
        }


class DemandForecastCreate(DemandForecastBase):
    pass


class DemandForecastUpdate(BaseModel):
    forecast_method: Optional[ForecastMethod] = None
    forecast_type: Optional[ForecastType] = None
    status: Optional[ForecastStatus] = None
    baseline_demand: Optional[Decimal] = Field(None, ge=0)
    promotional_uplift: Optional[Decimal] = Field(None, ge=0)
    final_forecast: Optional[Decimal] = Field(None, ge=0)
    actual_demand: Optional[Decimal] = Field(None, ge=0)
    confidence_level: Optional[Decimal] = Field(None, ge=0, le=100)
    forecast_bias: Optional[Decimal] = Field(None)
    seasonal_factor: Optional[Decimal] = Field(None, gt=0)
    trend_factor: Optional[Decimal] = Field(None, gt=0)
    marketing_events: Optional[str] = None
    external_factors: Optional[str] = None
    version: Optional[str] = Field(None, max_length=20)
    forecast_lag: Optional[int] = Field(None, ge=0)
    approved_by_user_id: Optional[int] = None
    notes: Optional[str] = None


class DemandForecastResponse(DemandForecastBase):
    id: int
    accuracy_percentage: float
    is_accurate: bool
    forecast_performance_grade: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ForecastGenerationRequest(BaseModel):
    product_id: int
    forecast_period_start: date
    forecast_period_end: date
    forecast_method: ForecastMethod = ForecastMethod.EXPONENTIAL_SMOOTHING
    include_marketing_events: bool = True
    confidence_level_threshold: Optional[Decimal] = Field(None, ge=0, le=100)


class ForecastAccuracyResponse(BaseModel):
    product_id: int
    total_forecasts: int
    accurate_forecasts: int
    accuracy_percentage: float
    average_absolute_error: Decimal
    average_percentage_error: Decimal
    forecast_bias: Decimal
    best_performing_method: Optional[str] = None