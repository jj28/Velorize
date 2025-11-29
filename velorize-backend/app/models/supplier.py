from sqlalchemy import String, Enum as SQLEnum, Boolean, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column
from enum import Enum
from .base import Base


class SupplierType(str, Enum):
    RAW_MATERIAL = "raw_material"
    PACKAGING = "packaging"
    EQUIPMENT = "equipment"
    SERVICE = "service"
    LOGISTICS = "logistics"


class SupplierStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    BLACKLISTED = "blacklisted"


class Supplier(Base):
    """Supplier master data model."""
    
    __tablename__ = "suppliers"
    
    # Basic info
    supplier_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[SupplierType] = mapped_column(SQLEnum(SupplierType), nullable=False)
    status: Mapped[SupplierStatus] = mapped_column(SQLEnum(SupplierStatus), default=SupplierStatus.ACTIVE, nullable=False)
    
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
    
    # Supply terms
    payment_terms_days: Mapped[int] = mapped_column(Integer, default=30, nullable=False)  # Payment terms in days
    lead_time_days: Mapped[int] = mapped_column(Integer, nullable=True)  # Standard lead time
    minimum_order_quantity: Mapped[int] = mapped_column(Integer, nullable=True)  # MOQ
    
    # Quality & compliance
    is_preferred: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    quality_rating: Mapped[str] = mapped_column(String(10), nullable=True)  # e.g., "A", "B", "C"
    halal_certified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)  # Important for F&B in Malaysia
    
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    
    def __repr__(self) -> str:
        return f"<Supplier(code={self.supplier_code}, name={self.name}, type={self.type})>"