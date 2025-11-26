from datetime import date, datetime
from sqlalchemy import String, Numeric, Integer, ForeignKey, Date, DateTime, Enum as SQLEnum, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum
from decimal import Decimal
from .base import Base


class ForecastMethod(str, Enum):
    MANUAL = "manual"              # Manual entry by user
    MOVING_AVERAGE = "moving_average"   # Simple moving average
    EXPONENTIAL_SMOOTHING = "exponential_smoothing"
    SARIMA = "sarima"             # Seasonal ARIMA
    LINEAR_REGRESSION = "linear_regression"
    PROPHET = "prophet"           # Facebook Prophet (future)
    ENSEMBLE = "ensemble"         # Combination of methods


class ForecastType(str, Enum):
    BASELINE = "baseline"         # Base forecast without promotions
    PROMOTIONAL = "promotional"   # Forecast including promo impact
    CONSENSUS = "consensus"       # Final agreed forecast (S&OP)


class ForecastStatus(str, Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    LOCKED = "locked"             # Cannot be modified


class DemandForecast(Base):
    """Demand forecasting data for products by period."""
    
    __tablename__ = "demand_forecasts"
    
    # Product and time
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    forecast_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)  # Month/period being forecasted
    forecast_period_start: Mapped[date] = mapped_column(Date, nullable=False)
    forecast_period_end: Mapped[date] = mapped_column(Date, nullable=False)
    
    # Forecast details
    forecast_method: Mapped[ForecastMethod] = mapped_column(SQLEnum(ForecastMethod), nullable=False)
    forecast_type: Mapped[ForecastType] = mapped_column(SQLEnum(ForecastType), default=ForecastType.BASELINE, nullable=False)
    status: Mapped[ForecastStatus] = mapped_column(SQLEnum(ForecastStatus), default=ForecastStatus.DRAFT, nullable=False)
    
    # Quantities
    baseline_demand: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=0, nullable=False)
    promotional_uplift: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=0, nullable=False)
    final_forecast: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=0, nullable=False)
    
    # Accuracy tracking (filled after actuals are available)
    actual_demand: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=True)
    absolute_error: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=True)
    percentage_error: Mapped[Decimal] = mapped_column(Numeric(8, 4), nullable=True)
    
    # Model performance
    confidence_level: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=True)  # Model confidence %
    forecast_bias: Mapped[Decimal] = mapped_column(Numeric(8, 4), default=0, nullable=False)  # Historical bias adjustment
    
    # Seasonality and trends
    seasonal_factor: Mapped[Decimal] = mapped_column(Numeric(6, 4), default=1, nullable=False)
    trend_factor: Mapped[Decimal] = mapped_column(Numeric(6, 4), default=1, nullable=False)
    
    # Business inputs
    marketing_events: Mapped[str] = mapped_column(Text, nullable=True)  # Marketing activities affecting forecast
    external_factors: Mapped[str] = mapped_column(Text, nullable=True)  # External factors (weather, holidays, etc.)
    
    # Version control
    version: Mapped[str] = mapped_column(String(20), default="1.0", nullable=False)
    forecast_lag: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # X weeks before period (Forecast Lag X)
    
    # Approval workflow
    created_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    approved_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Relationships will be defined when needed to avoid circular imports
    
    @property
    def accuracy_percentage(self) -> float:
        """Calculate forecast accuracy percentage (100% - |error%|)."""
        if self.percentage_error is not None:
            return max(0, 100 - abs(float(self.percentage_error)))
        return 0.0
    
    @property
    def is_accurate(self) -> bool:
        """Check if forecast is within acceptable accuracy threshold (85%)."""
        return self.accuracy_percentage >= 85.0
    
    @property
    def forecast_performance_grade(self) -> str:
        """Get performance grade for this forecast."""
        accuracy = self.accuracy_percentage
        if accuracy >= 95:
            return "A+"
        elif accuracy >= 90:
            return "A"
        elif accuracy >= 85:
            return "B"
        elif accuracy >= 75:
            return "C"
        else:
            return "D"
    
    def calculate_accuracy_metrics(self):
        """Calculate accuracy metrics when actual demand is available."""
        if self.actual_demand is not None and self.final_forecast > 0:
            self.absolute_error = abs(self.actual_demand - self.final_forecast)
            self.percentage_error = (self.absolute_error / self.final_forecast) * 100
    
    def __repr__(self) -> str:
        return f"<DemandForecast(product_id={self.product_id}, date={self.forecast_date}, forecast={self.final_forecast})>"