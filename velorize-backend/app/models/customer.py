from sqlalchemy import String, Enum as SQLEnum, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from enum import Enum
from .base import Base


class CustomerType(str, Enum):
    RETAIL = "retail"
    WHOLESALE = "wholesale"  
    FOOD_SERVICE = "food_service"
    ONLINE = "online"
    DISTRIBUTOR = "distributor"


class CustomerStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class Customer(Base):
    """Customer master data model."""
    
    __tablename__ = "customers"
    
    # Basic info
    customer_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[CustomerType] = mapped_column(SQLEnum(CustomerType), nullable=False)
    status: Mapped[CustomerStatus] = mapped_column(SQLEnum(CustomerStatus), default=CustomerStatus.ACTIVE, nullable=False)
    
    # Contact information
    contact_person: Mapped[str] = mapped_column(String(255), nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=True)
    
    # Address
    address_line1: Mapped[str] = mapped_column(String(255), nullable=True)
    address_line2: Mapped[str] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=True)
    state: Mapped[str] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str] = mapped_column(String(20), nullable=True)
    country: Mapped[str] = mapped_column(String(100), default="Malaysia", nullable=False)
    
    # Business details
    business_registration_number: Mapped[str] = mapped_column(String(100), nullable=True)
    tax_id: Mapped[str] = mapped_column(String(100), nullable=True)
    
    # Credit terms
    credit_limit_rm: Mapped[int] = mapped_column(nullable=True)  # Credit limit in RM
    payment_terms_days: Mapped[int] = mapped_column(default=30, nullable=False)  # Payment terms in days
    
    # Sales settings
    is_key_account: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    
    def __repr__(self) -> str:
        return f"<Customer(code={self.customer_code}, name={self.name}, type={self.type})>"