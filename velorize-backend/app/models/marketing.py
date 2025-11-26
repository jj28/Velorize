from datetime import date, datetime
from sqlalchemy import String, Numeric, Integer, ForeignKey, Date, DateTime, Enum as SQLEnum, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum
from decimal import Decimal
from typing import List
from .base import Base


class PromoType(str, Enum):
    DISCOUNT = "discount"           # Percentage or fixed amount discount
    BOGO = "bogo"                  # Buy One Get One
    BUNDLE = "bundle"              # Bundle deals
    VOLUME_DISCOUNT = "volume_discount"  # Quantity-based pricing
    SEASONAL = "seasonal"          # Seasonal promotions
    LOYALTY = "loyalty"            # Loyalty program benefits
    NEW_PRODUCT = "new_product"    # New product introduction
    CLEARANCE = "clearance"        # Excess inventory clearance


class PromoStatus(str, Enum):
    PLANNED = "planned"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PromoChannel(str, Enum):
    ALL_CHANNELS = "all_channels"
    RETAIL = "retail"
    ONLINE = "online"
    WHOLESALE = "wholesale"
    FOOD_SERVICE = "food_service"


class MarketingCalendar(Base):
    """Marketing calendar for tracking promotional activities and their demand impact."""
    
    __tablename__ = "marketing_calendar"
    
    # Event identification
    event_name: Mapped[str] = mapped_column(String(255), nullable=False)
    event_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    promo_type: Mapped[PromoType] = mapped_column(SQLEnum(PromoType), nullable=False)
    
    # Timing
    start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    end_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Scope and targeting
    promo_channel: Mapped[PromoChannel] = mapped_column(SQLEnum(PromoChannel), default=PromoChannel.ALL_CHANNELS, nullable=False)
    target_customer_segments: Mapped[str] = mapped_column(Text, nullable=True)  # JSON or comma-separated
    geographic_scope: Mapped[str] = mapped_column(String(255), default="Malaysia", nullable=False)
    
    # Promotional mechanics
    discount_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=True)  # e.g., 15.00 for 15%
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True)     # Fixed amount discount
    minimum_purchase_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True)
    maximum_discount_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True)
    
    # Volume-based pricing
    volume_threshold_1: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True)
    volume_discount_1: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=True)
    volume_threshold_2: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True)
    volume_discount_2: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=True)
    
    # Budget and investment
    marketing_budget_rm: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    expected_roi_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=True)
    
    # Demand planning impact
    expected_uplift_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0, nullable=False)
    expected_cannibalization_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0, nullable=False)
    baseline_volume_impact: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=0, nullable=False)
    
    # Status and approval
    status: Mapped[PromoStatus] = mapped_column(SQLEnum(PromoStatus), default=PromoStatus.PLANNED, nullable=False)
    created_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    approved_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    
    # Results tracking (post-event analysis)
    actual_sales_volume: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=True)
    actual_sales_value_rm: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=True)
    actual_uplift_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=True)
    actual_roi_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=True)
    
    # Description and notes
    description: Mapped[str] = mapped_column(Text, nullable=True)
    success_criteria: Mapped[str] = mapped_column(Text, nullable=True)
    lessons_learned: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Relationships will be defined when needed to avoid circular imports
    
    @property
    def is_active(self) -> bool:
        """Check if promotion is currently active."""
        today = date.today()
        return (self.status == PromoStatus.ACTIVE and 
                self.start_date <= today <= self.end_date)
    
    @property
    def days_until_start(self) -> int:
        """Days until promotion starts."""
        return (self.start_date - date.today()).days
    
    @property
    def days_until_end(self) -> int:
        """Days until promotion ends."""
        return (self.end_date - date.today()).days
    
    @property
    def campaign_phase(self) -> str:
        """Current phase of the campaign."""
        today = date.today()
        if today < self.start_date:
            return "pre_launch"
        elif self.start_date <= today <= self.end_date:
            return "active"
        else:
            return "post_campaign"
    
    @property
    def roi_performance(self) -> str:
        """ROI performance assessment."""
        if self.actual_roi_percentage is None:
            return "pending"
        elif self.actual_roi_percentage >= (self.expected_roi_percentage or 0):
            return "exceeded"
        elif self.actual_roi_percentage >= (self.expected_roi_percentage or 0) * 0.8:
            return "met"
        else:
            return "underperformed"
    
    @property
    def uplift_accuracy(self) -> str:
        """How accurate was the uplift forecast."""
        if self.actual_uplift_percentage is None or self.expected_uplift_percentage == 0:
            return "unknown"
        
        accuracy_ratio = self.actual_uplift_percentage / self.expected_uplift_percentage
        if 0.9 <= accuracy_ratio <= 1.1:
            return "accurate"
        elif 0.8 <= accuracy_ratio <= 1.2:
            return "close"
        else:
            return "inaccurate"
    
    def calculate_performance_metrics(self):
        """Calculate post-campaign performance metrics."""
        if self.actual_sales_value_rm and self.marketing_budget_rm > 0:
            self.actual_roi_percentage = ((self.actual_sales_value_rm - self.marketing_budget_rm) / self.marketing_budget_rm) * 100
    
    def __repr__(self) -> str:
        return f"<MarketingCalendar(event={self.event_name}, type={self.promo_type}, dates={self.start_date}-{self.end_date})>"