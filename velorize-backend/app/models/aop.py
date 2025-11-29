from datetime import date, datetime
from sqlalchemy import String, Numeric, Integer, ForeignKey, Date, DateTime, Enum as SQLEnum, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum
from decimal import Decimal
from .base import Base


class AOPPeriod(str, Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly" 
    YEARLY = "yearly"


class AOPStatus(str, Enum):
    DRAFT = "draft"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    LOCKED = "locked"
    REVISED = "revised"


class AOPCategory(str, Enum):
    SALES_REVENUE = "sales_revenue"
    SALES_VOLUME = "sales_volume"
    GROSS_MARGIN = "gross_margin"
    MARKET_SHARE = "market_share"
    NEW_CUSTOMERS = "new_customers"
    COST_REDUCTION = "cost_reduction"
    INVENTORY_TURNOVER = "inventory_turnover"


# Aliases for backward compatibility
PlanPeriod = AOPPeriod


class AOPTarget(Base):
    """Annual Operating Plan (AOP) targets and performance tracking."""
    
    __tablename__ = "aop_targets"
    
    # Planning context
    fiscal_year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)  # e.g., 2024
    period: Mapped[AOPPeriod] = mapped_column(SQLEnum(AOPPeriod), nullable=False)
    period_start_date: Mapped[date] = mapped_column(Date, nullable=False)
    period_end_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    # Scope - can be company-wide, category, or product-specific
    scope_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "company", "category", "product"
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=True, index=True)  # If product-specific
    category: Mapped[str] = mapped_column(String(100), nullable=True)  # Product category if category-level
    
    # Target definition
    target_category: Mapped[AOPCategory] = mapped_column(SQLEnum(AOPCategory), nullable=False)
    target_name: Mapped[str] = mapped_column(String(255), nullable=False)
    target_description: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Financial targets
    target_revenue_rm: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=True)
    target_volume_units: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=True)
    target_margin_rm: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=True)
    target_margin_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=True)
    
    # Market and customer targets
    target_market_share_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=True)
    target_new_customers: Mapped[int] = mapped_column(Integer, nullable=True)
    target_customer_retention_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=True)
    
    # Operational targets
    target_inventory_turnover: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=True)
    target_cost_reduction_rm: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=True)
    target_service_level_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=True)
    
    # Actual performance (updated throughout the year)
    actual_revenue_rm: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    actual_volume_units: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=0, nullable=False)
    actual_margin_rm: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    actual_margin_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0, nullable=False)
    
    # Performance tracking
    ytd_achievement_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0, nullable=False)
    forecast_achievement_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0, nullable=False)
    variance_to_target_rm: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    variance_to_target_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0, nullable=False)
    
    # Risk and mitigation
    risk_level: Mapped[str] = mapped_column(String(20), default="Medium", nullable=False)  # Low/Medium/High/Critical
    risk_factors: Mapped[str] = mapped_column(Text, nullable=True)
    mitigation_actions: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Status and approval
    status: Mapped[AOPStatus] = mapped_column(SQLEnum(AOPStatus), default=AOPStatus.DRAFT, nullable=False)
    version: Mapped[str] = mapped_column(String(20), default="1.0", nullable=False)
    
    # Ownership and approval
    owner_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    approved_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    
    # Review schedule
    last_review_date: Mapped[date] = mapped_column(Date, nullable=True)
    next_review_date: Mapped[date] = mapped_column(Date, nullable=True)
    
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Relationships will be defined when needed to avoid circular imports
    
    @property
    def is_on_track(self) -> bool:
        """Determine if target is on track based on achievement percentage."""
        # Simple rule: if YTD achievement is >= 80% of expected progress, it's on track
        days_elapsed = (date.today() - self.period_start_date).days
        total_days = (self.period_end_date - self.period_start_date).days
        expected_progress = (days_elapsed / total_days) * 100
        
        return self.ytd_achievement_percentage >= (expected_progress * 0.8)
    
    @property
    def performance_status(self) -> str:
        """Overall performance status."""
        achievement = self.ytd_achievement_percentage
        if achievement >= 100:
            return "exceeded"
        elif achievement >= 90:
            return "on_track"
        elif achievement >= 70:
            return "at_risk"
        else:
            return "behind"
    
    @property
    def performance_color(self) -> str:
        """Color coding for dashboards."""
        status = self.performance_status
        colors = {
            "exceeded": "green",
            "on_track": "green",
            "at_risk": "yellow", 
            "behind": "red"
        }
        return colors.get(status, "gray")
    
    @property
    def days_remaining(self) -> int:
        """Days remaining in the target period."""
        return (self.period_end_date - date.today()).days
    
    @property
    def progress_percentage(self) -> float:
        """Percentage of time elapsed in the target period."""
        days_elapsed = (date.today() - self.period_start_date).days
        total_days = (self.period_end_date - self.period_start_date).days
        return min(100, (days_elapsed / total_days) * 100) if total_days > 0 else 0
    
    def calculate_variance(self):
        """Calculate variance between actual and target performance."""
        if self.target_revenue_rm and self.target_revenue_rm > 0:
            self.variance_to_target_rm = self.actual_revenue_rm - self.target_revenue_rm
            self.variance_to_target_percentage = (self.variance_to_target_rm / self.target_revenue_rm) * 100
            
        # Calculate YTD achievement percentage
        if self.target_revenue_rm and self.target_revenue_rm > 0:
            self.ytd_achievement_percentage = (self.actual_revenue_rm / self.target_revenue_rm) * 100
    
    def __repr__(self) -> str:
        return f"<AOPTarget(fy={self.fiscal_year}, category={self.target_category}, target={self.target_name})>"


# Alias for backward compatibility
AnnualOperatingPlan = AOPTarget