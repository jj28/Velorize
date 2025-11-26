from datetime import date, datetime
from sqlalchemy import String, Numeric, Integer, ForeignKey, Date, DateTime, Enum as SQLEnum, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum
from decimal import Decimal
from .base import Base


class SalesChannel(str, Enum):
    RETAIL = "retail"
    WHOLESALE = "wholesale"
    ONLINE = "online"
    FOOD_SERVICE = "food_service"
    DISTRIBUTOR = "distributor"
    DIRECT_SALES = "direct_sales"


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PRODUCTION = "in_production"
    READY_TO_SHIP = "ready_to_ship"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    PARTIAL = "partial"
    OVERDUE = "overdue"
    REFUNDED = "refunded"


class SalesActual(Base):
    """Historical sales data - actual sales transactions."""
    
    __tablename__ = "sales_actuals"
    
    # Product and customer
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=False, index=True)
    
    # Transaction details
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    invoice_number: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    
    # Sales quantities and pricing
    quantity_sold: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    gross_sales_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    net_sales_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    
    # Cost and margin
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    total_cost: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    gross_margin_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    gross_margin_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    
    # Business context
    sales_channel: Mapped[SalesChannel] = mapped_column(SQLEnum(SalesChannel), nullable=False)
    sales_rep_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    # Promotion tracking
    promotion_code: Mapped[str] = mapped_column(String(50), nullable=True)
    is_promotional_sale: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Location and logistics
    delivery_location: Mapped[str] = mapped_column(String(255), nullable=True)
    delivery_date: Mapped[date] = mapped_column(Date, nullable=True)
    shipping_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Relationships will be defined when needed to avoid circular imports
    
    @property
    def margin_per_unit(self) -> Decimal:
        """Calculate gross margin per unit."""
        return self.unit_price - self.unit_cost
    
    @property
    def revenue_contribution_score(self) -> str:
        """Classify revenue contribution (A/B/C based on sales amount)."""
        # This would typically be calculated relative to other sales
        if self.net_sales_amount >= 1000:
            return "A"
        elif self.net_sales_amount >= 500:
            return "B" 
        else:
            return "C"
    
    def __repr__(self) -> str:
        return f"<SalesActual(product_id={self.product_id}, date={self.transaction_date}, amount=RM{self.net_sales_amount})>"


class SalesOrder(Base):
    """Sales orders - future/pending sales commitments."""
    
    __tablename__ = "sales_orders"
    
    # Order identification
    order_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    external_order_ref: Mapped[str] = mapped_column(String(100), nullable=True)  # Customer's PO number
    
    # Customer and dates
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=False, index=True)
    order_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    requested_delivery_date: Mapped[date] = mapped_column(Date, nullable=False)
    confirmed_delivery_date: Mapped[date] = mapped_column(Date, nullable=True)
    actual_delivery_date: Mapped[date] = mapped_column(Date, nullable=True)
    
    # Product details
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    quantity_ordered: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    quantity_shipped: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=0, nullable=False)
    quantity_remaining: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    
    # Pricing
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    total_order_value: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    
    # Status tracking
    order_status: Mapped[OrderStatus] = mapped_column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    payment_status: Mapped[PaymentStatus] = mapped_column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    
    # Business context
    sales_channel: Mapped[SalesChannel] = mapped_column(SQLEnum(SalesChannel), nullable=False)
    sales_rep_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    priority_level: Mapped[str] = mapped_column(String(20), default="Normal", nullable=False)  # High/Medium/Normal/Low
    
    # Special handling
    special_instructions: Mapped[str] = mapped_column(Text, nullable=True)
    requires_cold_chain: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Fulfillment tracking
    production_start_date: Mapped[date] = mapped_column(Date, nullable=True)
    production_completion_date: Mapped[date] = mapped_column(Date, nullable=True)
    
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Relationships will be defined when needed to avoid circular imports
    
    @property
    def is_overdue(self) -> bool:
        """Check if order delivery is overdue."""
        if self.order_status not in [OrderStatus.DELIVERED, OrderStatus.CANCELLED]:
            return date.today() > self.requested_delivery_date
        return False
    
    @property
    def days_until_delivery(self) -> int:
        """Days until requested delivery date."""
        return (self.requested_delivery_date - date.today()).days
    
    @property
    def fulfillment_percentage(self) -> float:
        """Percentage of order fulfilled."""
        if self.quantity_ordered > 0:
            return float((self.quantity_shipped / self.quantity_ordered) * 100)
        return 0.0
    
    @property
    def order_urgency(self) -> str:
        """Determine order urgency based on delivery date and status."""
        if self.is_overdue:
            return "overdue"
        elif self.days_until_delivery <= 1:
            return "urgent"
        elif self.days_until_delivery <= 3:
            return "high"
        elif self.days_until_delivery <= 7:
            return "medium"
        else:
            return "low"
    
    def __repr__(self) -> str:
        return f"<SalesOrder(order={self.order_number}, customer_id={self.customer_id}, status={self.order_status})>"