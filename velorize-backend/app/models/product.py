from sqlalchemy import String, Numeric, Integer, Boolean, Enum as SQLEnum, Text
from sqlalchemy.orm import Mapped, mapped_column
from enum import Enum
from decimal import Decimal
from .base import Base


class ProductStatus(str, Enum):
    ACTIVE = "active"
    PHASE_IN = "phase_in"
    PHASE_OUT = "phase_out"
    DISCONTINUED = "discontinued"


class ProductCategory(str, Enum):
    # F&B specific categories
    FINISHED_GOODS = "finished_goods"
    RAW_MATERIALS = "raw_materials" 
    PACKAGING = "packaging"
    BEVERAGES = "beverages"
    PROTEINS = "proteins"
    VEGETABLES = "vegetables"
    GRAINS = "grains"
    SAUCES_CONDIMENTS = "sauces_condiments"


class UnitOfMeasure(str, Enum):
    KG = "kg"
    GRAM = "gram"
    LITRE = "litre"
    ML = "ml"
    PIECE = "piece"
    PACK = "pack"
    BOX = "box"
    CASE = "case"


class Product(Base):
    """Product master data model."""
    
    __tablename__ = "products"
    
    # Basic product info
    sku: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    category: Mapped[ProductCategory] = mapped_column(SQLEnum(ProductCategory), nullable=False)
    status: Mapped[ProductStatus] = mapped_column(SQLEnum(ProductStatus), default=ProductStatus.ACTIVE, nullable=False)
    
    # Units and measurements
    base_uom: Mapped[UnitOfMeasure] = mapped_column(SQLEnum(UnitOfMeasure), nullable=False)
    pack_size: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=True)  # e.g., 1.5 for 1.5kg pack
    
    # Costing
    standard_cost: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)  # Cost per base UOM
    selling_price: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=True)   # Selling price per base UOM
    
    # Supply chain attributes
    supplier_lead_time: Mapped[int] = mapped_column(Integer, nullable=True)  # Days
    safety_stock_days: Mapped[int] = mapped_column(Integer, default=7, nullable=False)
    reorder_level: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=True)  # Reorder point quantity
    
    # F&B specific attributes
    shelf_life_days: Mapped[int] = mapped_column(Integer, nullable=True)  # For perishable items
    is_perishable: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    storage_temperature: Mapped[str] = mapped_column(String(50), nullable=True)  # e.g., "chilled", "frozen", "ambient"
    
    # BOM indicator
    has_bom: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)  # Whether this product has a Bill of Materials
    
    @property
    def gross_margin_percentage(self) -> float:
        """Calculate gross margin percentage if selling price is available."""
        if self.selling_price and self.standard_cost:
            return float((self.selling_price - self.standard_cost) / self.selling_price * 100)
        return 0.0
    
    def __repr__(self) -> str:
        return f"<Product(sku={self.sku}, name={self.name}, category={self.category})>"