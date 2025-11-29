from datetime import date, datetime
from sqlalchemy import String, Numeric, Integer, ForeignKey, Date, DateTime, Enum as SQLEnum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum
from decimal import Decimal
from .base import Base


class StockLocation(str, Enum):
    MAIN_WAREHOUSE = "main_warehouse"
    COLD_STORAGE = "cold_storage"
    FROZEN_STORAGE = "frozen_storage"
    DRY_STORAGE = "dry_storage"
    PRODUCTION_FLOOR = "production_floor"
    RETAIL_OUTLET = "retail_outlet"


class StockStatus(str, Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    DAMAGED = "damaged"
    EXPIRED = "expired"
    QUARANTINE = "quarantine"


class MovementType(str, Enum):
    RECEIPT = "receipt"
    ISSUE = "issue"
    TRANSFER = "transfer"
    ADJUSTMENT = "adjustment"
    RETURN = "return"
    PRODUCTION = "production"
    SALE = "sale"
    WASTAGE = "wastage"


class MovementStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class StockOnHand(Base):
    """Current stock levels by product and location."""
    
    __tablename__ = "stock_on_hand"
    
    # Product and location
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    location: Mapped[StockLocation] = mapped_column(SQLEnum(StockLocation), nullable=False)
    
    # Quantity and costing
    quantity_on_hand: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=0, nullable=False)
    reserved_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=0, nullable=False)
    available_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=0, nullable=False)
    
    # Valuation
    average_unit_cost: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=0, nullable=False)
    total_value: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    
    # Aging and quality
    status: Mapped[StockStatus] = mapped_column(SQLEnum(StockStatus), default=StockStatus.AVAILABLE, nullable=False)
    last_movement_date: Mapped[date] = mapped_column(Date, nullable=True)
    days_since_last_movement: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # F&B specific - expiry tracking
    earliest_expiry_date: Mapped[date] = mapped_column(Date, nullable=True)
    days_to_expiry: Mapped[int] = mapped_column(Integer, nullable=True)
    is_near_expiry: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Safety stock
    safety_stock_level: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=0, nullable=False)
    reorder_point: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=0, nullable=False)
    max_stock_level: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=True)
    
    # Last updated
    last_count_date: Mapped[date] = mapped_column(Date, nullable=True)
    snapshot_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    
    # Relationships will be defined when needed to avoid circular imports
    
    @property
    def stock_status_indicator(self) -> str:
        """Get stock level status for dashboards."""
        if self.available_quantity <= 0:
            return "out_of_stock"
        elif self.available_quantity <= self.safety_stock_level:
            return "below_safety"
        elif self.available_quantity <= self.reorder_point:
            return "reorder_needed"
        else:
            return "healthy"
    
    @property
    def days_of_supply(self) -> int:
        """Calculate days of supply based on average daily usage (placeholder - needs sales data)."""
        # TODO: Calculate based on average daily sales
        return 0
    
    @property
    def is_excess_stock(self) -> bool:
        """Determine if this is excess stock based on aging."""
        return self.days_since_last_movement > 90  # Configurable threshold
    
    @property
    def inventory_health_score(self) -> str:
        """Overall health assessment of this inventory item."""
        if self.is_near_expiry:
            return "critical"
        elif self.is_excess_stock:
            return "poor"
        elif self.stock_status_indicator == "below_safety":
            return "warning"
        else:
            return "good"
    
    def __repr__(self) -> str:
        return f"<StockOnHand(product_id={self.product_id}, location={self.location}, qty={self.quantity_on_hand})>"


class StockMovement(Base):
    """Track all inventory movements."""

    __tablename__ = "stock_movements"

    # Movement details
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    movement_type: Mapped[MovementType] = mapped_column(SQLEnum(MovementType), nullable=False)
    movement_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False, index=True)
    status: Mapped[MovementStatus] = mapped_column(SQLEnum(MovementStatus), default=MovementStatus.PENDING, nullable=False)

    # Quantity and location
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    from_location: Mapped[StockLocation] = mapped_column(SQLEnum(StockLocation), nullable=True)
    to_location: Mapped[StockLocation] = mapped_column(SQLEnum(StockLocation), nullable=True)

    # Cost tracking
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=True)
    total_cost: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=True)

    # Reference information
    reference_number: Mapped[str] = mapped_column(String(100), nullable=True)
    related_order_id: Mapped[int] = mapped_column(Integer, nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    # Additional details
    reason: Mapped[str] = mapped_column(String(255), nullable=True)
    notes: Mapped[str] = mapped_column(String(500), nullable=True)

    def __repr__(self) -> str:
        return f"<StockMovement(product_id={self.product_id}, type={self.movement_type}, qty={self.quantity})>"