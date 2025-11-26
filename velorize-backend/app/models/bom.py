from sqlalchemy import String, Numeric, Integer, ForeignKey, Enum as SQLEnum, Boolean, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum
from decimal import Decimal
from typing import List
from .base import Base


class BOMStatus(str, Enum):
    ACTIVE = "active"
    DRAFT = "draft"
    INACTIVE = "inactive"


class ComponentType(str, Enum):
    RAW_MATERIAL = "raw_material"
    PACKAGING = "packaging"
    SUB_ASSEMBLY = "sub_assembly"


class BillOfMaterials(Base):
    """Bill of Materials header - defines what finished goods are made of."""
    
    __tablename__ = "bill_of_materials"
    
    # Product this BOM is for
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    
    # BOM details
    version: Mapped[str] = mapped_column(String(20), default="1.0", nullable=False)
    status: Mapped[BOMStatus] = mapped_column(SQLEnum(BOMStatus), default=BOMStatus.DRAFT, nullable=False)
    
    # Yield and efficiency
    batch_size: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=1, nullable=False)  # Standard batch size
    yield_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=100, nullable=False)  # Manufacturing yield
    
    # Production details
    production_time_minutes: Mapped[int] = mapped_column(Integer, nullable=True)  # Time to produce one batch
    labor_cost_per_batch: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=True)  # Labor cost per batch
    overhead_cost_per_batch: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=True)  # Overhead per batch
    
    description: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Relationships
    components: Mapped[List["BOMComponent"]] = relationship("BOMComponent", back_populates="bom", cascade="all, delete-orphan")
    
    # Unique constraint to prevent multiple active BOMs for same product
    __table_args__ = (
        UniqueConstraint('product_id', 'version', name='uix_bom_product_version'),
    )
    
    @property
    def total_material_cost(self) -> Decimal:
        """Calculate total material cost for this BOM."""
        return sum(component.total_cost for component in self.components)
    
    @property
    def total_cost_per_unit(self) -> Decimal:
        """Calculate total cost per unit including materials, labor, and overhead."""
        material_cost = self.total_material_cost
        labor_cost = self.labor_cost_per_batch or Decimal('0')
        overhead_cost = self.overhead_cost_per_batch or Decimal('0')
        
        total_batch_cost = material_cost + labor_cost + overhead_cost
        yield_factor = self.yield_percentage / Decimal('100')
        
        # Adjust for yield and batch size
        return total_batch_cost / (self.batch_size * yield_factor)
    
    def __repr__(self) -> str:
        return f"<BOM(product_id={self.product_id}, version={self.version}, status={self.status})>"


class BOMComponent(Base):
    """Individual components/ingredients in a Bill of Materials."""
    
    __tablename__ = "bom_components"
    
    # Parent BOM
    bom_id: Mapped[int] = mapped_column(ForeignKey("bill_of_materials.id"), nullable=False, index=True)
    
    # Component product
    component_product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    
    # Component details
    component_type: Mapped[ComponentType] = mapped_column(SQLEnum(ComponentType), nullable=False)
    quantity_per_batch: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)  # Quantity needed per batch
    wastage_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0, nullable=False)  # Expected wastage
    
    # Costing
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)  # Cost per unit of component
    is_critical: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)  # Critical for production
    
    # Substitution
    substitute_product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=True)  # Alternative component
    
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Relationships
    bom = relationship("BillOfMaterials", back_populates="components")
    
    @property
    def effective_quantity(self) -> Decimal:
        """Quantity including wastage factor."""
        wastage_factor = Decimal('1') + (self.wastage_percentage / Decimal('100'))
        return self.quantity_per_batch * wastage_factor
    
    @property
    def total_cost(self) -> Decimal:
        """Total cost for this component including wastage."""
        return self.effective_quantity * self.unit_cost
    
    def __repr__(self) -> str:
        return f"<BOMComponent(bom_id={self.bom_id}, component_id={self.component_product_id}, qty={self.quantity_per_batch})>"