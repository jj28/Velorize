from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, date, timedelta

from app.core.deps import get_db, get_current_verified_user, get_sop_leader_or_admin
from app.models.user import User
from app.models.product import Product
from app.models.inventory import StockOnHand, StockMovement, MovementType, MovementStatus
from app.schemas.inventory import (
    StockOnHandCreate, StockOnHandUpdate, StockOnHandResponse,
    StockMovementCreate, StockMovementResponse, StockAdjustmentCreate
)

router = APIRouter()


@router.get("/stock", response_model=List[StockOnHandResponse])
def read_stock_on_hand(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    product_id: int = None,
    location: str = None,
    low_stock: bool = None,
    expired: bool = None,
    near_expiry: bool = None,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Retrieve stock on hand with filtering options."""
    
    query = db.query(StockOnHand)
    
    # Apply filters
    if product_id:
        query = query.filter(StockOnHand.product_id == product_id)
    
    if location:
        query = query.filter(StockOnHand.location.ilike(f"%{location}%"))
    
    if low_stock:
        # Join with Product to check against reorder level
        query = query.join(Product).filter(
            StockOnHand.quantity_available <= Product.reorder_level
        )
    
    if expired:
        today = datetime.now().date()
        if expired:
            query = query.filter(StockOnHand.expiry_date < today)
        else:
            query = query.filter(
                or_(StockOnHand.expiry_date.is_(None), StockOnHand.expiry_date >= today)
            )
    
    if near_expiry:
        # Items expiring within 7 days
        near_expiry_date = datetime.now().date() + timedelta(days=7)
        query = query.filter(
            and_(
                StockOnHand.expiry_date.isnot(None),
                StockOnHand.expiry_date <= near_expiry_date,
                StockOnHand.expiry_date >= datetime.now().date()
            )
        )
    
    # Apply pagination
    stock_items = query.offset(skip).limit(limit).all()
    return stock_items


@router.post("/stock", response_model=StockOnHandResponse, status_code=status.HTTP_201_CREATED)
def create_stock_entry(
    *,
    db: Session = Depends(get_db),
    stock_in: StockOnHandCreate,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Create new stock entry."""
    
    # Check if product exists
    product = db.query(Product).filter(Product.id == stock_in.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check if stock entry already exists for this product and location
    existing_stock = db.query(StockOnHand).filter(
        StockOnHand.product_id == stock_in.product_id,
        StockOnHand.location == stock_in.location,
        StockOnHand.lot_number == stock_in.lot_number
    ).first()
    
    if existing_stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock entry with same product, location, and lot number already exists"
        )
    
    # Create new stock entry
    stock = StockOnHand(**stock_in.dict())
    
    db.add(stock)
    db.commit()
    db.refresh(stock)
    
    # Create stock movement record
    movement = StockMovement(
        product_id=stock.product_id,
        movement_type=MovementType.STOCK_IN,
        quantity=float(stock.quantity_available),
        unit_cost=stock.unit_cost,
        total_cost=stock.total_cost,
        location=stock.location,
        lot_number=stock.lot_number,
        reference_number=f"INITIAL-{stock.id}",
        notes=f"Initial stock entry for {product.product_code}",
        movement_date=datetime.now(),
        status=MovementStatus.COMPLETED,
        created_by=current_user.id
    )
    
    db.add(movement)
    db.commit()
    
    return stock


@router.get("/stock/{stock_id}", response_model=StockOnHandResponse)
def read_stock_entry(
    *,
    db: Session = Depends(get_db),
    stock_id: int,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get stock entry by ID."""
    
    stock = db.query(StockOnHand).filter(StockOnHand.id == stock_id).first()
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock entry not found"
        )
    
    return stock


@router.put("/stock/{stock_id}", response_model=StockOnHandResponse)
def update_stock_entry(
    *,
    db: Session = Depends(get_db),
    stock_id: int,
    stock_in: StockOnHandUpdate,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Update a stock entry."""
    
    stock = db.query(StockOnHand).filter(StockOnHand.id == stock_id).first()
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock entry not found"
        )
    
    # Store original quantity for movement tracking
    original_quantity = float(stock.quantity_available)
    
    # Update stock fields
    update_data = stock_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(stock, field, value)
    
    db.commit()
    db.refresh(stock)
    
    # Create movement record if quantity changed
    if 'quantity_available' in update_data:
        new_quantity = float(stock.quantity_available)
        quantity_diff = new_quantity - original_quantity
        
        if quantity_diff != 0:
            movement_type = MovementType.ADJUSTMENT_IN if quantity_diff > 0 else MovementType.ADJUSTMENT_OUT
            
            movement = StockMovement(
                product_id=stock.product_id,
                movement_type=movement_type,
                quantity=abs(quantity_diff),
                unit_cost=stock.unit_cost,
                total_cost=abs(quantity_diff) * float(stock.unit_cost or 0),
                location=stock.location,
                lot_number=stock.lot_number,
                reference_number=f"ADJ-{stock.id}",
                notes=f"Stock adjustment from {original_quantity} to {new_quantity}",
                movement_date=datetime.now(),
                status=MovementStatus.COMPLETED,
                created_by=current_user.id
            )
            
            db.add(movement)
            db.commit()
    
    return stock


@router.post("/stock/{stock_id}/adjust")
def adjust_stock(
    *,
    db: Session = Depends(get_db),
    stock_id: int,
    adjustment: StockAdjustmentCreate,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Adjust stock quantity with reason."""
    
    stock = db.query(StockOnHand).filter(StockOnHand.id == stock_id).first()
    if not stock:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock entry not found"
        )
    
    original_quantity = float(stock.quantity_available)
    new_quantity = original_quantity + adjustment.quantity_change
    
    if new_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Adjustment would result in negative stock"
        )
    
    # Update stock quantity
    stock.quantity_available = new_quantity
    
    # Update total cost if unit cost is available
    if stock.unit_cost:
        stock.total_cost = new_quantity * float(stock.unit_cost)
    
    db.commit()
    db.refresh(stock)
    
    # Create movement record
    movement_type = MovementType.ADJUSTMENT_IN if adjustment.quantity_change > 0 else MovementType.ADJUSTMENT_OUT
    
    movement = StockMovement(
        product_id=stock.product_id,
        movement_type=movement_type,
        quantity=abs(adjustment.quantity_change),
        unit_cost=stock.unit_cost,
        total_cost=abs(adjustment.quantity_change) * float(stock.unit_cost or 0),
        location=stock.location,
        lot_number=stock.lot_number,
        reference_number=adjustment.reference_number,
        notes=adjustment.reason,
        movement_date=datetime.now(),
        status=MovementStatus.COMPLETED,
        created_by=current_user.id
    )
    
    db.add(movement)
    db.commit()
    
    return {"message": "Stock adjusted successfully", "new_quantity": new_quantity}


@router.get("/movements", response_model=List[StockMovementResponse])
def read_stock_movements(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    product_id: int = None,
    movement_type: MovementType = None,
    location: str = None,
    date_from: date = None,
    date_to: date = None,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Retrieve stock movements with filtering options."""
    
    query = db.query(StockMovement)
    
    # Apply filters
    if product_id:
        query = query.filter(StockMovement.product_id == product_id)
    
    if movement_type:
        query = query.filter(StockMovement.movement_type == movement_type)
    
    if location:
        query = query.filter(StockMovement.location.ilike(f"%{location}%"))
    
    if date_from:
        query = query.filter(StockMovement.movement_date >= date_from)
    
    if date_to:
        query = query.filter(StockMovement.movement_date <= date_to)
    
    # Order by date descending
    query = query.order_by(StockMovement.movement_date.desc())
    
    # Apply pagination
    movements = query.offset(skip).limit(limit).all()
    return movements


@router.post("/movements", response_model=StockMovementResponse, status_code=status.HTTP_201_CREATED)
def create_stock_movement(
    *,
    db: Session = Depends(get_db),
    movement_in: StockMovementCreate,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Create a new stock movement."""
    
    # Check if product exists
    product = db.query(Product).filter(Product.id == movement_in.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Create movement
    movement_data = movement_in.dict()
    movement_data['created_by'] = current_user.id
    movement_data['movement_date'] = movement_data.get('movement_date', datetime.now())
    movement = StockMovement(**movement_data)
    
    db.add(movement)
    
    # Update stock on hand if movement affects current stock
    if movement.movement_type in [
        MovementType.STOCK_IN, MovementType.STOCK_OUT, 
        MovementType.ADJUSTMENT_IN, MovementType.ADJUSTMENT_OUT
    ]:
        # Find existing stock entry
        stock = db.query(StockOnHand).filter(
            StockOnHand.product_id == movement.product_id,
            StockOnHand.location == movement.location,
            StockOnHand.lot_number == movement.lot_number
        ).first()
        
        if movement.movement_type in [MovementType.STOCK_IN, MovementType.ADJUSTMENT_IN]:
            if not stock:
                # Create new stock entry
                stock = StockOnHand(
                    product_id=movement.product_id,
                    quantity_available=movement.quantity,
                    unit_cost=movement.unit_cost,
                    total_cost=movement.total_cost,
                    location=movement.location,
                    lot_number=movement.lot_number
                )
                db.add(stock)
            else:
                # Update existing stock
                stock.quantity_available += movement.quantity
                if stock.unit_cost and movement.unit_cost:
                    # Weighted average cost
                    total_cost = float(stock.total_cost or 0) + float(movement.total_cost or 0)
                    total_quantity = float(stock.quantity_available)
                    stock.unit_cost = total_cost / total_quantity if total_quantity > 0 else movement.unit_cost
                    stock.total_cost = total_cost
        
        elif movement.movement_type in [MovementType.STOCK_OUT, MovementType.ADJUSTMENT_OUT]:
            if not stock or stock.quantity_available < movement.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insufficient stock for this movement"
                )
            
            stock.quantity_available -= movement.quantity
            if stock.unit_cost:
                stock.total_cost = float(stock.quantity_available) * float(stock.unit_cost)
    
    db.commit()
    db.refresh(movement)
    
    return movement


@router.get("/locations", response_model=List[str])
def get_stock_locations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get list of all stock locations."""
    
    locations = db.query(StockOnHand.location).distinct().all()
    return [loc[0] for loc in locations if loc[0]]


@router.get("/low-stock", response_model=List[StockOnHandResponse])
def get_low_stock_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get items with stock below reorder level."""
    
    low_stock_items = db.query(StockOnHand).join(Product).filter(
        StockOnHand.quantity_available <= Product.reorder_level
    ).all()
    
    return low_stock_items


@router.get("/expired", response_model=List[StockOnHandResponse])
def get_expired_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get expired stock items."""
    
    today = datetime.now().date()
    expired_items = db.query(StockOnHand).filter(
        StockOnHand.expiry_date < today
    ).all()
    
    return expired_items


@router.get("/expiring-soon", response_model=List[StockOnHandResponse])
def get_expiring_soon_items(
    db: Session = Depends(get_db),
    days: int = Query(7, description="Number of days to look ahead"),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get items expiring within specified days."""
    
    expiry_date = datetime.now().date() + timedelta(days=days)
    expiring_items = db.query(StockOnHand).filter(
        and_(
            StockOnHand.expiry_date.isnot(None),
            StockOnHand.expiry_date <= expiry_date,
            StockOnHand.expiry_date >= datetime.now().date()
        )
    ).all()
    
    return expiring_items


@router.get("/valuation")
def get_inventory_valuation(
    db: Session = Depends(get_db),
    location: str = None,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get total inventory valuation."""
    
    query = db.query(StockOnHand)
    
    if location:
        query = query.filter(StockOnHand.location == location)
    
    # Calculate total valuation
    total_valuation = query.with_entities(
        func.sum(StockOnHand.total_cost)
    ).scalar() or 0
    
    # Count items
    total_items = query.count()
    
    # Get valuation by location
    location_valuations = db.query(
        StockOnHand.location,
        func.sum(StockOnHand.total_cost).label('valuation'),
        func.count(StockOnHand.id).label('item_count')
    ).group_by(StockOnHand.location).all()
    
    return {
        "total_valuation": float(total_valuation),
        "total_items": total_items,
        "by_location": [
            {
                "location": loc.location,
                "valuation": float(loc.valuation or 0),
                "item_count": loc.item_count
            }
            for loc in location_valuations
        ]
    }


@router.get("/turnover-analysis")
def get_inventory_turnover_analysis(
    db: Session = Depends(get_db),
    days: int = Query(30, description="Number of days for analysis"),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get inventory turnover analysis."""
    
    start_date = datetime.now().date() - timedelta(days=days)
    
    # Get stock out movements for the period
    stock_out_movements = db.query(StockMovement).filter(
        StockMovement.movement_type == MovementType.STOCK_OUT,
        StockMovement.movement_date >= start_date
    ).all()
    
    # Calculate turnover by product
    product_turnover = {}
    for movement in stock_out_movements:
        if movement.product_id not in product_turnover:
            product_turnover[movement.product_id] = {
                'total_out': 0,
                'movement_count': 0
            }
        
        product_turnover[movement.product_id]['total_out'] += movement.quantity
        product_turnover[movement.product_id]['movement_count'] += 1
    
    # Get current stock levels
    current_stock = {
        stock.product_id: float(stock.quantity_available)
        for stock in db.query(StockOnHand).all()
    }
    
    # Calculate turnover ratios
    turnover_analysis = []
    for product_id, turnover_data in product_turnover.items():
        current_qty = current_stock.get(product_id, 0)
        if current_qty > 0:
            turnover_ratio = turnover_data['total_out'] / current_qty
        else:
            turnover_ratio = float('inf') if turnover_data['total_out'] > 0 else 0
        
        product = db.query(Product).filter(Product.id == product_id).first()
        turnover_analysis.append({
            "product_id": product_id,
            "product_code": product.product_code if product else f"PROD-{product_id}",
            "product_name": product.name if product else "Unknown Product",
            "quantity_sold": turnover_data['total_out'],
            "current_stock": current_qty,
            "turnover_ratio": turnover_ratio,
            "movement_count": turnover_data['movement_count']
        })
    
    # Sort by turnover ratio
    turnover_analysis.sort(key=lambda x: x['turnover_ratio'], reverse=True)
    
    return {
        "analysis_period_days": days,
        "analysis_from": start_date.isoformat(),
        "analysis_to": datetime.now().date().isoformat(),
        "products": turnover_analysis
    }


@router.get("/stats")
def get_inventory_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get inventory statistics summary."""
    
    # Total items and valuation
    total_items = db.query(StockOnHand).count()
    total_valuation = db.query(func.sum(StockOnHand.total_cost)).scalar() or 0
    
    # Low stock items
    low_stock_count = db.query(StockOnHand).join(Product).filter(
        StockOnHand.quantity_available <= Product.reorder_level
    ).count()
    
    # Expired items
    today = datetime.now().date()
    expired_count = db.query(StockOnHand).filter(
        StockOnHand.expiry_date < today
    ).count()
    
    # Expiring soon (within 7 days)
    expiry_date = today + timedelta(days=7)
    expiring_soon_count = db.query(StockOnHand).filter(
        and_(
            StockOnHand.expiry_date.isnot(None),
            StockOnHand.expiry_date <= expiry_date,
            StockOnHand.expiry_date >= today
        )
    ).count()
    
    # Movement statistics (last 30 days)
    start_date = today - timedelta(days=30)
    recent_movements = db.query(StockMovement).filter(
        StockMovement.movement_date >= start_date
    ).count()
    
    # Location breakdown
    location_stats = db.query(
        StockOnHand.location,
        func.count(StockOnHand.id).label('item_count'),
        func.sum(StockOnHand.total_cost).label('valuation')
    ).group_by(StockOnHand.location).all()
    
    return {
        "total_items": total_items,
        "total_valuation": float(total_valuation),
        "low_stock_items": low_stock_count,
        "expired_items": expired_count,
        "expiring_soon_items": expiring_soon_count,
        "recent_movements_30_days": recent_movements,
        "location_breakdown": [
            {
                "location": stat.location,
                "item_count": stat.item_count,
                "valuation": float(stat.valuation or 0)
            }
            for stat in location_stats
        ]
    }