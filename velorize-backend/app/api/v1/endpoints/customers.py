from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_verified_user, get_sop_leader_or_admin
from app.models.user import User
from app.models.customer import Customer, CustomerType, CustomerStatus
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse

router = APIRouter()


@router.get("/", response_model=List[CustomerResponse])
def read_customers(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    type: CustomerType = None,
    status: CustomerStatus = None,
    search: str = None,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Retrieve customers with filtering options."""
    
    query = db.query(Customer)
    
    # Apply filters
    if type:
        query = query.filter(Customer.type == type)
    
    if status:
        query = query.filter(Customer.status == status)
    
    if search:
        query = query.filter(
            Customer.name.ilike(f"%{search}%") | 
            Customer.customer_code.ilike(f"%{search}%") |
            Customer.contact_person.ilike(f"%{search}%") |
            Customer.email.ilike(f"%{search}%")
        )
    
    # Apply pagination
    customers = query.offset(skip).limit(limit).all()
    return customers


@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    *,
    db: Session = Depends(get_db),
    customer_in: CustomerCreate,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Create new customer."""
    
    # Check if customer code already exists
    existing_customer = db.query(Customer).filter(
        Customer.customer_code == customer_in.customer_code
    ).first()
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer with this code already exists"
        )
    
    # Check if email already exists (if provided)
    if customer_in.email:
        existing_email = db.query(Customer).filter(
            Customer.email == customer_in.email
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Customer with this email already exists"
            )
    
    # Create new customer
    customer = Customer(**customer_in.dict())
    
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
    return customer


@router.get("/{customer_id}", response_model=CustomerResponse)
def read_customer(
    *,
    db: Session = Depends(get_db),
    customer_id: int,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get customer by ID."""
    
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    return customer


@router.get("/code/{customer_code}", response_model=CustomerResponse)
def read_customer_by_code(
    *,
    db: Session = Depends(get_db),
    customer_code: str,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get customer by code."""
    
    customer = db.query(Customer).filter(
        Customer.customer_code == customer_code
    ).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    *,
    db: Session = Depends(get_db),
    customer_id: int,
    customer_in: CustomerUpdate,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Update a customer."""
    
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Check if customer code is being changed and already exists
    if customer_in.customer_code and customer_in.customer_code != customer.customer_code:
        existing_customer = db.query(Customer).filter(
            Customer.customer_code == customer_in.customer_code,
            Customer.id != customer_id
        ).first()
        if existing_customer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Customer with this code already exists"
            )
    
    # Check if email is being changed and already exists
    if customer_in.email and customer_in.email != customer.email:
        existing_email = db.query(Customer).filter(
            Customer.email == customer_in.email,
            Customer.id != customer_id
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Customer with this email already exists"
            )
    
    # Update customer fields
    update_data = customer_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
    
    db.commit()
    db.refresh(customer)
    
    return customer


@router.delete("/{customer_id}")
def delete_customer(
    *,
    db: Session = Depends(get_db),
    customer_id: int,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Delete a customer (soft delete by setting inactive)."""
    
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Soft delete by setting status to inactive
    customer.status = CustomerStatus.INACTIVE
    
    db.commit()
    
    return {"message": "Customer deactivated successfully"}


@router.get("/types/", response_model=List[str])
def get_customer_types(
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get list of all customer types."""
    return [type.value for type in CustomerType]


@router.get("/types/{customer_type}/customers", response_model=List[CustomerResponse])
def get_customers_by_type(
    *,
    db: Session = Depends(get_db),
    customer_type: CustomerType,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get customers by type."""
    
    customers = db.query(Customer).filter(
        Customer.type == customer_type,
        Customer.status == CustomerStatus.ACTIVE
    ).offset(skip).limit(limit).all()
    
    return customers


@router.get("/search/", response_model=List[CustomerResponse])
def search_customers(
    *,
    db: Session = Depends(get_db),
    q: str = Query(..., min_length=2, description="Search query"),
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Search customers by name, code, contact person, or email."""
    
    customers = db.query(Customer).filter(
        Customer.name.ilike(f"%{q}%") | 
        Customer.customer_code.ilike(f"%{q}%") |
        Customer.contact_person.ilike(f"%{q}%") |
        Customer.email.ilike(f"%{q}%")
    ).filter(
        Customer.status == CustomerStatus.ACTIVE
    ).offset(skip).limit(limit).all()
    
    return customers


@router.get("/key-accounts/", response_model=List[CustomerResponse])
def get_key_accounts(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get all key account customers."""
    
    customers = db.query(Customer).filter(
        Customer.is_key_account == True,
        Customer.status == CustomerStatus.ACTIVE
    ).offset(skip).limit(limit).all()
    
    return customers


@router.get("/stats/", response_model=dict)
def get_customer_statistics(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get customer statistics summary."""
    
    # Count by status
    total_customers = db.query(Customer).count()
    active_customers = db.query(Customer).filter(Customer.status == CustomerStatus.ACTIVE).count()
    inactive_customers = db.query(Customer).filter(Customer.status == CustomerStatus.INACTIVE).count()
    suspended_customers = db.query(Customer).filter(Customer.status == CustomerStatus.SUSPENDED).count()
    
    # Count by type
    type_stats = {}
    for customer_type in CustomerType:
        count = db.query(Customer).filter(
            Customer.type == customer_type,
            Customer.status == CustomerStatus.ACTIVE
        ).count()
        type_stats[customer_type.value] = count
    
    # Key account statistics
    key_accounts = db.query(Customer).filter(
        Customer.is_key_account == True,
        Customer.status == CustomerStatus.ACTIVE
    ).count()
    
    # Credit limit statistics
    total_credit_limit = db.query(Customer).filter(
        Customer.status == CustomerStatus.ACTIVE,
        Customer.credit_limit_rm.isnot(None)
    ).with_entities(
        db.func.sum(Customer.credit_limit_rm)
    ).scalar() or 0
    
    return {
        "total_customers": total_customers,
        "status_breakdown": {
            "active": active_customers,
            "inactive": inactive_customers,
            "suspended": suspended_customers
        },
        "type_breakdown": type_stats,
        "key_accounts": key_accounts,
        "total_credit_limit_rm": float(total_credit_limit)
    }