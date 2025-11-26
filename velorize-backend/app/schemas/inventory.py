from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import date, datetime
from app.models.inventory import StockLocation, StockStatus


class StockOnHandBase(BaseModel):
    product_id: int
    location: StockLocation
    quantity_on_hand: Decimal = Field(0, ge=0, decimal_places=4)
    reserved_quantity: Decimal = Field(0, ge=0, decimal_places=4)
    available_quantity: Decimal = Field(0, ge=0, decimal_places=4)
    average_unit_cost: Decimal = Field(0, ge=0, decimal_places=4)
    total_value: Decimal = Field(0, ge=0, decimal_places=2)
    status: StockStatus = StockStatus.AVAILABLE
    last_movement_date: Optional[date] = None
    days_since_last_movement: int = Field(0, ge=0)
    earliest_expiry_date: Optional[date] = None
    days_to_expiry: Optional[int] = None
    is_near_expiry: bool = False
    safety_stock_level: Decimal = Field(0, ge=0, decimal_places=4)
    reorder_point: Decimal = Field(0, ge=0, decimal_places=4)
    max_stock_level: Optional[Decimal] = Field(None, ge=0, decimal_places=4)
    last_count_date: Optional[date] = None
    snapshot_date: date = Field(default_factory=date.today)

    class Config:
        json_schema_extra = {
            "example": {
                "product_id": 1,
                "location": "cold_storage",
                "quantity_on_hand": 25.0,
                "reserved_quantity": 5.0,
                "available_quantity": 20.0,
                "average_unit_cost": 12.50,
                "total_value": 312.50,
                "status": "available",
                "last_movement_date": "2025-11-24",
                "days_since_last_movement": 1,
                "earliest_expiry_date": "2025-11-27",
                "days_to_expiry": 3,
                "is_near_expiry": True,
                "safety_stock_level": 10.0,
                "reorder_point": 15.0,
                "max_stock_level": 50.0
            }
        }


class StockOnHandCreate(StockOnHandBase):
    pass


class StockOnHandUpdate(BaseModel):
    quantity_on_hand: Optional[Decimal] = Field(None, ge=0, decimal_places=4)
    reserved_quantity: Optional[Decimal] = Field(None, ge=0, decimal_places=4)
    available_quantity: Optional[Decimal] = Field(None, ge=0, decimal_places=4)
    average_unit_cost: Optional[Decimal] = Field(None, ge=0, decimal_places=4)
    total_value: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    status: Optional[StockStatus] = None
    last_movement_date: Optional[date] = None
    days_since_last_movement: Optional[int] = Field(None, ge=0)
    earliest_expiry_date: Optional[date] = None
    days_to_expiry: Optional[int] = None
    is_near_expiry: Optional[bool] = None
    safety_stock_level: Optional[Decimal] = Field(None, ge=0, decimal_places=4)
    reorder_point: Optional[Decimal] = Field(None, ge=0, decimal_places=4)
    max_stock_level: Optional[Decimal] = Field(None, ge=0, decimal_places=4)
    last_count_date: Optional[date] = None


class StockOnHandResponse(StockOnHandBase):
    id: int
    stock_status_indicator: str
    days_of_supply: int
    is_excess_stock: bool
    inventory_health_score: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True