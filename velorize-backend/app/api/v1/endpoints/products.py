from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_verified_user, get_sop_leader_or_admin
from app.models.user import User
from app.models.product import Product, ProductStatus, ProductCategory
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter()


@router.get("/", response_model=List[ProductResponse])
def read_products(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    category: ProductCategory = None,
    status: ProductStatus = None,
    search: str = None,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Retrieve products with filtering options."""
    
    query = db.query(Product)
    
    # Apply filters
    if category:
        query = query.filter(Product.category == category)
    
    if status:
        query = query.filter(Product.status == status)
    
    if search:
        query = query.filter(
            Product.name.ilike(f"%{search}%") | 
            Product.sku.ilike(f"%{search}%") |
            Product.description.ilike(f"%{search}%")
        )
    
    # Apply pagination
    products = query.offset(skip).limit(limit).all()
    return products


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    *,
    db: Session = Depends(get_db),
    product_in: ProductCreate,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Create new product."""
    
    # Check if SKU already exists
    existing_product = db.query(Product).filter(Product.sku == product_in.sku).first()
    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product with this SKU already exists"
        )
    
    # Create new product
    product = Product(**product_in.dict())
    
    db.add(product)
    db.commit()
    db.refresh(product)
    
    return product


@router.get("/{product_id}", response_model=ProductResponse)
def read_product(
    *,
    db: Session = Depends(get_db),
    product_id: int,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get product by ID."""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return product


@router.get("/sku/{sku}", response_model=ProductResponse)
def read_product_by_sku(
    *,
    db: Session = Depends(get_db),
    sku: str,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get product by SKU."""
    
    product = db.query(Product).filter(Product.sku == sku).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    *,
    db: Session = Depends(get_db),
    product_id: int,
    product_in: ProductUpdate,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Update a product."""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check if SKU is being changed and already exists
    if product_in.sku and product_in.sku != product.sku:
        existing_product = db.query(Product).filter(
            Product.sku == product_in.sku,
            Product.id != product_id
        ).first()
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product with this SKU already exists"
            )
    
    # Update product fields
    update_data = product_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    
    return product


@router.delete("/{product_id}")
def delete_product(
    *,
    db: Session = Depends(get_db),
    product_id: int,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Delete a product."""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Soft delete by changing status to discontinued
    product.status = ProductStatus.DISCONTINUED
    
    db.commit()
    
    return {"message": "Product discontinued successfully"}


@router.get("/categories/", response_model=List[str])
def get_product_categories(
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get list of all product categories."""
    return [category.value for category in ProductCategory]


@router.get("/categories/{category}/products", response_model=List[ProductResponse])
def get_products_by_category(
    *,
    db: Session = Depends(get_db),
    category: ProductCategory,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get products by category."""
    
    products = db.query(Product).filter(
        Product.category == category,
        Product.status == ProductStatus.ACTIVE
    ).offset(skip).limit(limit).all()
    
    return products


@router.get("/search/", response_model=List[ProductResponse])
def search_products(
    *,
    db: Session = Depends(get_db),
    q: str = Query(..., min_length=2, description="Search query"),
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Search products by name, SKU, or description."""
    
    products = db.query(Product).filter(
        Product.name.ilike(f"%{q}%") | 
        Product.sku.ilike(f"%{q}%") |
        Product.description.ilike(f"%{q}%")
    ).filter(
        Product.status == ProductStatus.ACTIVE
    ).offset(skip).limit(limit).all()
    
    return products


@router.get("/perishable/", response_model=List[ProductResponse])
def get_perishable_products(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get all perishable products."""
    
    products = db.query(Product).filter(
        Product.is_perishable == True,
        Product.status == ProductStatus.ACTIVE
    ).offset(skip).limit(limit).all()
    
    return products


@router.get("/bom-enabled/", response_model=List[ProductResponse])
def get_bom_enabled_products(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get products that have BOMs."""
    
    products = db.query(Product).filter(
        Product.has_bom == True,
        Product.status == ProductStatus.ACTIVE
    ).offset(skip).limit(limit).all()
    
    return products


@router.get("/stats/", response_model=dict)
def get_product_statistics(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get product statistics summary."""
    
    # Count by status
    total_products = db.query(Product).count()
    active_products = db.query(Product).filter(Product.status == ProductStatus.ACTIVE).count()
    discontinued_products = db.query(Product).filter(Product.status == ProductStatus.DISCONTINUED).count()
    phase_in_products = db.query(Product).filter(Product.status == ProductStatus.PHASE_IN).count()
    phase_out_products = db.query(Product).filter(Product.status == ProductStatus.PHASE_OUT).count()
    
    # Count by category
    category_stats = {}
    for category in ProductCategory:
        count = db.query(Product).filter(
            Product.category == category,
            Product.status == ProductStatus.ACTIVE
        ).count()
        category_stats[category.value] = count
    
    # Other statistics
    perishable_count = db.query(Product).filter(
        Product.is_perishable == True,
        Product.status == ProductStatus.ACTIVE
    ).count()
    
    bom_enabled_count = db.query(Product).filter(
        Product.has_bom == True,
        Product.status == ProductStatus.ACTIVE
    ).count()
    
    return {
        "total_products": total_products,
        "status_breakdown": {
            "active": active_products,
            "discontinued": discontinued_products,
            "phase_in": phase_in_products,
            "phase_out": phase_out_products
        },
        "category_breakdown": category_stats,
        "special_attributes": {
            "perishable": perishable_count,
            "has_bom": bom_enabled_count
        }
    }