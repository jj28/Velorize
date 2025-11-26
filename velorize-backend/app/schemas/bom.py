from pydantic import BaseModel, Field
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from app.models.bom import BOMStatus, ComponentType


class BOMComponentBase(BaseModel):
    component_product_id: int
    component_type: ComponentType
    quantity_per_batch: Decimal = Field(..., gt=0, decimal_places=4)
    wastage_percentage: Decimal = Field(0, ge=0, le=100, decimal_places=2)
    unit_cost: Decimal = Field(..., gt=0, decimal_places=4)
    is_critical: bool = False
    substitute_product_id: Optional[int] = None
    notes: Optional[str] = None


class BOMComponentCreate(BOMComponentBase):
    pass


class BOMComponentResponse(BOMComponentBase):
    id: int
    bom_id: int
    effective_quantity: Decimal
    total_cost: Decimal
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BOMBase(BaseModel):
    product_id: int
    version: str = Field("1.0", max_length=20)
    status: BOMStatus = BOMStatus.DRAFT
    batch_size: Decimal = Field(1, gt=0, decimal_places=4)
    yield_percentage: Decimal = Field(100, gt=0, le=100, decimal_places=2)
    production_time_minutes: Optional[int] = Field(None, ge=0)
    labor_cost_per_batch: Optional[Decimal] = Field(None, ge=0, decimal_places=4)
    overhead_cost_per_batch: Optional[Decimal] = Field(None, ge=0, decimal_places=4)
    description: Optional[str] = None


class BOMCreate(BOMBase):
    components: List[BOMComponentCreate] = []
    
    class Config:
        json_schema_extra = {
            "example": {
                "product_id": 1,
                "version": "1.0",
                "status": "draft",
                "batch_size": 1.0,
                "yield_percentage": 95.0,
                "production_time_minutes": 15,
                "labor_cost_per_batch": 5.50,
                "overhead_cost_per_batch": 2.25,
                "description": "Premium Salmon Poke Bowl Recipe",
                "components": [
                    {
                        "component_product_id": 2,
                        "component_type": "raw_material", 
                        "quantity_per_batch": 0.15,
                        "wastage_percentage": 5.0,
                        "unit_cost": 45.00,
                        "is_critical": True,
                        "notes": "Fresh Norwegian salmon - 150g portion"
                    },
                    {
                        "component_product_id": 3,
                        "component_type": "raw_material",
                        "quantity_per_batch": 0.20,
                        "wastage_percentage": 2.0,
                        "unit_cost": 8.50,
                        "is_critical": False,
                        "notes": "Sushi rice - 200g cooked weight"
                    }
                ]
            }
        }


class BOMUpdate(BaseModel):
    version: Optional[str] = Field(None, max_length=20)
    status: Optional[BOMStatus] = None
    batch_size: Optional[Decimal] = Field(None, gt=0, decimal_places=4)
    yield_percentage: Optional[Decimal] = Field(None, gt=0, le=100, decimal_places=2)
    production_time_minutes: Optional[int] = Field(None, ge=0)
    labor_cost_per_batch: Optional[Decimal] = Field(None, ge=0, decimal_places=4)
    overhead_cost_per_batch: Optional[Decimal] = Field(None, ge=0, decimal_places=4)
    description: Optional[str] = None


class BOMResponse(BOMBase):
    id: int
    total_material_cost: Decimal
    total_cost_per_unit: Decimal
    components: List[BOMComponentResponse] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True