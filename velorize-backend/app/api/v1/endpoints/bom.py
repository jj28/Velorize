from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_verified_user, get_sop_leader_or_admin
from app.models.user import User
from app.models.product import Product
from app.models.bom import BillOfMaterials, BOMComponent, BOMStatus, ComponentType
from app.schemas.bom import BOMCreate, BOMUpdate, BOMResponse, BOMComponentCreate, BOMComponentResponse

router = APIRouter()


@router.get("/", response_model=List[BOMResponse])
def read_boms(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: BOMStatus = None,
    product_id: int = None,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Retrieve BOMs with filtering options."""
    
    query = db.query(BillOfMaterials)
    
    # Apply filters
    if status:
        query = query.filter(BillOfMaterials.status == status)
    
    if product_id:
        query = query.filter(BillOfMaterials.product_id == product_id)
    
    # Apply pagination
    boms = query.offset(skip).limit(limit).all()
    return boms


@router.post("/", response_model=BOMResponse, status_code=status.HTTP_201_CREATED)
def create_bom(
    *,
    db: Session = Depends(get_db),
    bom_in: BOMCreate,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Create new BOM."""
    
    # Check if product exists
    product = db.query(Product).filter(Product.id == bom_in.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check if BOM with this version already exists for this product
    existing_bom = db.query(BillOfMaterials).filter(
        BillOfMaterials.product_id == bom_in.product_id,
        BillOfMaterials.version == bom_in.version
    ).first()
    if existing_bom:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"BOM version {bom_in.version} already exists for this product"
        )
    
    # Create new BOM
    bom_data = bom_in.dict(exclude={'components'})
    bom = BillOfMaterials(**bom_data)
    
    db.add(bom)
    db.flush()  # Flush to get the BOM ID
    
    # Create BOM components
    for component_data in bom_in.components:
        # Verify component product exists
        component_product = db.query(Product).filter(
            Product.id == component_data.component_product_id
        ).first()
        if not component_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Component product with ID {component_data.component_product_id} not found"
            )
        
        # Verify substitute product exists if specified
        if component_data.substitute_product_id:
            substitute_product = db.query(Product).filter(
                Product.id == component_data.substitute_product_id
            ).first()
            if not substitute_product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Substitute product with ID {component_data.substitute_product_id} not found"
                )
        
        component = BOMComponent(
            bom_id=bom.id,
            **component_data.dict()
        )
        db.add(component)
    
    # Update product to indicate it has a BOM
    product.has_bom = True
    
    db.commit()
    db.refresh(bom)
    
    return bom


@router.get("/{bom_id}", response_model=BOMResponse)
def read_bom(
    *,
    db: Session = Depends(get_db),
    bom_id: int,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get BOM by ID."""
    
    bom = db.query(BillOfMaterials).filter(BillOfMaterials.id == bom_id).first()
    if not bom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BOM not found"
        )
    
    return bom


@router.put("/{bom_id}", response_model=BOMResponse)
def update_bom(
    *,
    db: Session = Depends(get_db),
    bom_id: int,
    bom_in: BOMUpdate,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Update a BOM."""
    
    bom = db.query(BillOfMaterials).filter(BillOfMaterials.id == bom_id).first()
    if not bom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BOM not found"
        )
    
    # Check if version is being changed and already exists
    if bom_in.version and bom_in.version != bom.version:
        existing_bom = db.query(BillOfMaterials).filter(
            BillOfMaterials.product_id == bom.product_id,
            BillOfMaterials.version == bom_in.version,
            BillOfMaterials.id != bom_id
        ).first()
        if existing_bom:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"BOM version {bom_in.version} already exists for this product"
            )
    
    # Update BOM fields
    update_data = bom_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bom, field, value)
    
    db.commit()
    db.refresh(bom)
    
    return bom


@router.delete("/{bom_id}")
def delete_bom(
    *,
    db: Session = Depends(get_db),
    bom_id: int,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Delete a BOM (soft delete by setting inactive)."""
    
    bom = db.query(BillOfMaterials).filter(BillOfMaterials.id == bom_id).first()
    if not bom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BOM not found"
        )
    
    # Soft delete by setting status to inactive
    bom.status = BOMStatus.INACTIVE
    
    db.commit()
    
    return {"message": "BOM deactivated successfully"}


@router.get("/product/{product_id}/boms", response_model=List[BOMResponse])
def get_boms_by_product(
    *,
    db: Session = Depends(get_db),
    product_id: int,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get all BOMs for a specific product."""
    
    # Verify product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    boms = db.query(BillOfMaterials).filter(
        BillOfMaterials.product_id == product_id
    ).all()
    
    return boms


@router.get("/product/{product_id}/active-bom", response_model=BOMResponse)
def get_active_bom_by_product(
    *,
    db: Session = Depends(get_db),
    product_id: int,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get the active BOM for a specific product."""
    
    bom = db.query(BillOfMaterials).filter(
        BillOfMaterials.product_id == product_id,
        BillOfMaterials.status == BOMStatus.ACTIVE
    ).first()
    
    if not bom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active BOM found for this product"
        )
    
    return bom


@router.post("/{bom_id}/components", response_model=BOMComponentResponse)
def add_bom_component(
    *,
    db: Session = Depends(get_db),
    bom_id: int,
    component_in: BOMComponentCreate,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Add a component to an existing BOM."""
    
    # Check if BOM exists
    bom = db.query(BillOfMaterials).filter(BillOfMaterials.id == bom_id).first()
    if not bom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BOM not found"
        )
    
    # Verify component product exists
    component_product = db.query(Product).filter(
        Product.id == component_in.component_product_id
    ).first()
    if not component_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Component product not found"
        )
    
    # Verify substitute product exists if specified
    if component_in.substitute_product_id:
        substitute_product = db.query(Product).filter(
            Product.id == component_in.substitute_product_id
        ).first()
        if not substitute_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Substitute product not found"
            )
    
    # Create component
    component = BOMComponent(
        bom_id=bom_id,
        **component_in.dict()
    )
    
    db.add(component)
    db.commit()
    db.refresh(component)
    
    return component


@router.put("/components/{component_id}", response_model=BOMComponentResponse)
def update_bom_component(
    *,
    db: Session = Depends(get_db),
    component_id: int,
    component_in: BOMComponentCreate,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Update a BOM component."""
    
    component = db.query(BOMComponent).filter(BOMComponent.id == component_id).first()
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BOM component not found"
        )
    
    # Update component fields
    update_data = component_in.dict()
    for field, value in update_data.items():
        setattr(component, field, value)
    
    db.commit()
    db.refresh(component)
    
    return component


@router.delete("/components/{component_id}")
def delete_bom_component(
    *,
    db: Session = Depends(get_db),
    component_id: int,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Delete a BOM component."""
    
    component = db.query(BOMComponent).filter(BOMComponent.id == component_id).first()
    if not component:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BOM component not found"
        )
    
    db.delete(component)
    db.commit()
    
    return {"message": "BOM component deleted successfully"}


@router.get("/{bom_id}/cost-analysis")
def get_bom_cost_analysis(
    *,
    db: Session = Depends(get_db),
    bom_id: int,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get detailed cost analysis for a BOM."""
    
    bom = db.query(BillOfMaterials).filter(BillOfMaterials.id == bom_id).first()
    if not bom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="BOM not found"
        )
    
    # Calculate component costs
    component_costs = []
    total_component_cost = 0
    
    for component in bom.components:
        component_cost = float(component.total_cost)
        total_component_cost += component_cost
        
        component_costs.append({
            "component_id": component.id,
            "component_product_id": component.component_product_id,
            "component_type": component.component_type.value,
            "quantity_per_batch": float(component.quantity_per_batch),
            "effective_quantity": float(component.effective_quantity),
            "unit_cost": float(component.unit_cost),
            "total_cost": component_cost,
            "cost_percentage": 0  # Will be calculated below
        })
    
    # Calculate cost percentages
    for component_cost in component_costs:
        if total_component_cost > 0:
            component_cost["cost_percentage"] = (component_cost["total_cost"] / total_component_cost) * 100
    
    # Calculate total costs
    labor_cost = float(bom.labor_cost_per_batch or 0)
    overhead_cost = float(bom.overhead_cost_per_batch or 0)
    total_cost_per_unit = float(bom.total_cost_per_unit)
    
    return {
        "bom_id": bom.id,
        "product_id": bom.product_id,
        "version": bom.version,
        "batch_size": float(bom.batch_size),
        "yield_percentage": float(bom.yield_percentage),
        "component_analysis": {
            "components": component_costs,
            "total_material_cost": total_component_cost,
            "material_cost_percentage": (total_component_cost / total_cost_per_unit * 100) if total_cost_per_unit > 0 else 0
        },
        "cost_breakdown": {
            "material_cost_per_unit": total_component_cost / float(bom.batch_size) if bom.batch_size > 0 else 0,
            "labor_cost_per_unit": labor_cost / float(bom.batch_size) if bom.batch_size > 0 else 0,
            "overhead_cost_per_unit": overhead_cost / float(bom.batch_size) if bom.batch_size > 0 else 0,
            "total_cost_per_unit": total_cost_per_unit
        }
    }


@router.get("/stats/", response_model=dict)
def get_bom_statistics(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get BOM statistics summary."""
    
    # Count by status
    total_boms = db.query(BillOfMaterials).count()
    active_boms = db.query(BillOfMaterials).filter(BillOfMaterials.status == BOMStatus.ACTIVE).count()
    draft_boms = db.query(BillOfMaterials).filter(BillOfMaterials.status == BOMStatus.DRAFT).count()
    inactive_boms = db.query(BillOfMaterials).filter(BillOfMaterials.status == BOMStatus.INACTIVE).count()
    
    # Products with BOMs
    products_with_boms = db.query(Product).filter(Product.has_bom == True).count()
    total_products = db.query(Product).count()
    
    # Component type distribution
    component_type_stats = {}
    for comp_type in ComponentType:
        count = db.query(BOMComponent).join(BillOfMaterials).filter(
            BOMComponent.component_type == comp_type,
            BillOfMaterials.status == BOMStatus.ACTIVE
        ).count()
        component_type_stats[comp_type.value] = count
    
    return {
        "total_boms": total_boms,
        "status_breakdown": {
            "active": active_boms,
            "draft": draft_boms,
            "inactive": inactive_boms
        },
        "products_with_boms": products_with_boms,
        "total_products": total_products,
        "bom_coverage_percentage": (products_with_boms / total_products * 100) if total_products > 0 else 0,
        "component_type_breakdown": component_type_stats
    }