from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_verified_user, get_sop_leader_or_admin
from app.models.user import User
from app.models.supplier import Supplier, SupplierType, SupplierStatus
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse

router = APIRouter()


@router.get("/", response_model=List[SupplierResponse])
def read_suppliers(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    type: SupplierType = None,
    status: SupplierStatus = None,
    search: str = None,
    halal_certified: bool = None,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Retrieve suppliers with filtering options."""
    
    query = db.query(Supplier)
    
    # Apply filters
    if type:
        query = query.filter(Supplier.type == type)
    
    if status:
        query = query.filter(Supplier.status == status)
    
    if halal_certified is not None:
        query = query.filter(Supplier.halal_certified == halal_certified)
    
    if search:
        query = query.filter(
            Supplier.name.ilike(f"%{search}%") | 
            Supplier.supplier_code.ilike(f"%{search}%") |
            Supplier.contact_person.ilike(f"%{search}%") |
            Supplier.email.ilike(f"%{search}%")
        )
    
    # Apply pagination
    suppliers = query.offset(skip).limit(limit).all()
    return suppliers


@router.post("/", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(
    *,
    db: Session = Depends(get_db),
    supplier_in: SupplierCreate,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Create new supplier."""
    
    # Check if supplier code already exists
    existing_supplier = db.query(Supplier).filter(
        Supplier.supplier_code == supplier_in.supplier_code
    ).first()
    if existing_supplier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supplier with this code already exists"
        )
    
    # Check if email already exists (if provided)
    if supplier_in.email:
        existing_email = db.query(Supplier).filter(
            Supplier.email == supplier_in.email
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier with this email already exists"
            )
    
    # Create new supplier
    supplier = Supplier(**supplier_in.dict())
    
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    
    return supplier


@router.get("/{supplier_id}", response_model=SupplierResponse)
def read_supplier(
    *,
    db: Session = Depends(get_db),
    supplier_id: int,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get supplier by ID."""
    
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    return supplier


@router.get("/code/{supplier_code}", response_model=SupplierResponse)
def read_supplier_by_code(
    *,
    db: Session = Depends(get_db),
    supplier_code: str,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get supplier by code."""
    
    supplier = db.query(Supplier).filter(
        Supplier.supplier_code == supplier_code
    ).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    return supplier


@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    *,
    db: Session = Depends(get_db),
    supplier_id: int,
    supplier_in: SupplierUpdate,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Update a supplier."""
    
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    # Check if supplier code is being changed and already exists
    if supplier_in.supplier_code and supplier_in.supplier_code != supplier.supplier_code:
        existing_supplier = db.query(Supplier).filter(
            Supplier.supplier_code == supplier_in.supplier_code,
            Supplier.id != supplier_id
        ).first()
        if existing_supplier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier with this code already exists"
            )
    
    # Check if email is being changed and already exists
    if supplier_in.email and supplier_in.email != supplier.email:
        existing_email = db.query(Supplier).filter(
            Supplier.email == supplier_in.email,
            Supplier.id != supplier_id
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier with this email already exists"
            )
    
    # Update supplier fields
    update_data = supplier_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(supplier, field, value)
    
    db.commit()
    db.refresh(supplier)
    
    return supplier


@router.delete("/{supplier_id}")
def delete_supplier(
    *,
    db: Session = Depends(get_db),
    supplier_id: int,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Delete a supplier (soft delete by setting inactive)."""
    
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    # Soft delete by setting status to inactive
    supplier.status = SupplierStatus.INACTIVE
    
    db.commit()
    
    return {"message": "Supplier deactivated successfully"}


@router.get("/types/", response_model=List[str])
def get_supplier_types(
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get list of all supplier types."""
    return [type.value for type in SupplierType]


@router.get("/types/{supplier_type}/suppliers", response_model=List[SupplierResponse])
def get_suppliers_by_type(
    *,
    db: Session = Depends(get_db),
    supplier_type: SupplierType,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get suppliers by type."""
    
    suppliers = db.query(Supplier).filter(
        Supplier.type == supplier_type,
        Supplier.status == SupplierStatus.ACTIVE
    ).offset(skip).limit(limit).all()
    
    return suppliers


@router.get("/search/", response_model=List[SupplierResponse])
def search_suppliers(
    *,
    db: Session = Depends(get_db),
    q: str = Query(..., min_length=2, description="Search query"),
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Search suppliers by name, code, contact person, or email."""
    
    suppliers = db.query(Supplier).filter(
        Supplier.name.ilike(f"%{q}%") | 
        Supplier.supplier_code.ilike(f"%{q}%") |
        Supplier.contact_person.ilike(f"%{q}%") |
        Supplier.email.ilike(f"%{q}%")
    ).filter(
        Supplier.status == SupplierStatus.ACTIVE
    ).offset(skip).limit(limit).all()
    
    return suppliers


@router.get("/preferred/", response_model=List[SupplierResponse])
def get_preferred_suppliers(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get all preferred suppliers."""
    
    suppliers = db.query(Supplier).filter(
        Supplier.is_preferred == True,
        Supplier.status == SupplierStatus.ACTIVE
    ).offset(skip).limit(limit).all()
    
    return suppliers


@router.get("/halal-certified/", response_model=List[SupplierResponse])
def get_halal_certified_suppliers(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get all halal-certified suppliers."""
    
    suppliers = db.query(Supplier).filter(
        Supplier.halal_certified == True,
        Supplier.status == SupplierStatus.ACTIVE
    ).offset(skip).limit(limit).all()
    
    return suppliers


@router.get("/stats/", response_model=dict)
def get_supplier_statistics(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get supplier statistics summary."""
    
    # Count by status
    total_suppliers = db.query(Supplier).count()
    active_suppliers = db.query(Supplier).filter(Supplier.status == SupplierStatus.ACTIVE).count()
    inactive_suppliers = db.query(Supplier).filter(Supplier.status == SupplierStatus.INACTIVE).count()
    suspended_suppliers = db.query(Supplier).filter(Supplier.status == SupplierStatus.SUSPENDED).count()
    blacklisted_suppliers = db.query(Supplier).filter(Supplier.status == SupplierStatus.BLACKLISTED).count()
    
    # Count by type
    type_stats = {}
    for supplier_type in SupplierType:
        count = db.query(Supplier).filter(
            Supplier.type == supplier_type,
            Supplier.status == SupplierStatus.ACTIVE
        ).count()
        type_stats[supplier_type.value] = count
    
    # Preferred suppliers
    preferred_suppliers = db.query(Supplier).filter(
        Supplier.is_preferred == True,
        Supplier.status == SupplierStatus.ACTIVE
    ).count()
    
    # Halal certified suppliers
    halal_certified = db.query(Supplier).filter(
        Supplier.halal_certified == True,
        Supplier.status == SupplierStatus.ACTIVE
    ).count()
    
    # Quality rating distribution
    quality_ratings = {}
    for rating in ['A', 'B', 'C']:
        count = db.query(Supplier).filter(
            Supplier.quality_rating == rating,
            Supplier.status == SupplierStatus.ACTIVE
        ).count()
        quality_ratings[rating] = count
    
    return {
        "total_suppliers": total_suppliers,
        "status_breakdown": {
            "active": active_suppliers,
            "inactive": inactive_suppliers,
            "suspended": suspended_suppliers,
            "blacklisted": blacklisted_suppliers
        },
        "type_breakdown": type_stats,
        "preferred_suppliers": preferred_suppliers,
        "halal_certified": halal_certified,
        "quality_rating_breakdown": quality_ratings
    }