from pydantic import BaseModel, Field, validator
from typing import Optional
from decimal import Decimal
from datetime import datetime
from app.models.product import ProductStatus, ProductCategory, UnitOfMeasure


class ProductBase(BaseModel):
    sku: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: ProductCategory
    status: ProductStatus = ProductStatus.ACTIVE
    base_uom: UnitOfMeasure
    pack_size: Optional[Decimal] = Field(None, gt=0, decimal_places=3)
    standard_cost: Decimal = Field(..., gt=0, decimal_places=4)
    selling_price: Optional[Decimal] = Field(None, gt=0, decimal_places=4)
    supplier_lead_time: Optional[int] = Field(None, ge=0)
    safety_stock_days: int = Field(7, ge=0)
    shelf_life_days: Optional[int] = Field(None, gt=0)
    is_perishable: bool = False
    storage_temperature: Optional[str] = Field(None, max_length=50)
    has_bom: bool = False

    @validator('selling_price')
    def validate_selling_price(cls, v, values):
        if v is not None and 'standard_cost' in values and v <= values['standard_cost']:
            raise ValueError('Selling price must be greater than standard cost')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "sku": "POKE-SALMON-001",
                "name": "Premium Salmon Poke Bowl",
                "description": "Fresh salmon poke bowl with rice and vegetables",
                "category": "finished_goods",
                "status": "active",
                "base_uom": "piece",
                "pack_size": 1.0,
                "standard_cost": 12.50,
                "selling_price": 18.90,
                "supplier_lead_time": 1,
                "safety_stock_days": 2,
                "shelf_life_days": 3,
                "is_perishable": True,
                "storage_temperature": "chilled",
                "has_bom": True
            }
        }


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[ProductCategory] = None
    status: Optional[ProductStatus] = None
    base_uom: Optional[UnitOfMeasure] = None
    pack_size: Optional[Decimal] = Field(None, gt=0, decimal_places=3)
    standard_cost: Optional[Decimal] = Field(None, gt=0, decimal_places=4)
    selling_price: Optional[Decimal] = Field(None, gt=0, decimal_places=4)
    supplier_lead_time: Optional[int] = Field(None, ge=0)
    safety_stock_days: Optional[int] = Field(None, ge=0)
    shelf_life_days: Optional[int] = Field(None, gt=0)
    is_perishable: Optional[bool] = None
    storage_temperature: Optional[str] = Field(None, max_length=50)
    has_bom: Optional[bool] = None


class ProductResponse(ProductBase):
    id: int
    gross_margin_percentage: float
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True