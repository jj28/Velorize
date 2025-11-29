from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_user, get_admin_user, get_sop_leader_or_admin
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.core import security

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Retrieve users."""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
    current_user: User = Depends(get_admin_user)
) -> Any:
    """Create new user (admin only)."""
    
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    
    if existing_user:
        if existing_user.username == user_in.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Create new user
    hashed_password = security.get_password_hash(user_in.password)
    
    user = User(
        email=user_in.email,
        username=user_in.username,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        hashed_password=hashed_password,
        role=user_in.role,
        is_active=True,
        is_verified=True  # Admin-created users are auto-verified
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user


@router.get("/me", response_model=UserResponse)
def read_user_me(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get current user."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    password: str = None,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Update current user."""
    
    # Update user fields
    if user_in.email is not None:
        # Check if email is already taken by another user
        existing_user = db.query(User).filter(
            User.email == user_in.email,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        current_user.email = user_in.email
        current_user.is_verified = False  # Re-verify email if changed
    
    if user_in.username is not None:
        # Check if username is already taken by another user
        existing_user = db.query(User).filter(
            User.username == user_in.username,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        current_user.username = user_in.username
    
    if user_in.first_name is not None:
        current_user.first_name = user_in.first_name
    
    if user_in.last_name is not None:
        current_user.last_name = user_in.last_name
    
    # Update password if provided
    if password:
        current_user.hashed_password = security.get_password_hash(password)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.get("/{user_id}", response_model=UserResponse)
def read_user_by_id(
    user_id: int,
    current_user: User = Depends(get_sop_leader_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Get a specific user by id."""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(get_admin_user)
) -> Any:
    """Update a user (admin only)."""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update user fields
    if user_in.email is not None:
        # Check if email is already taken
        existing_user = db.query(User).filter(
            User.email == user_in.email,
            User.id != user_id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        user.email = user_in.email
    
    if user_in.username is not None:
        # Check if username is already taken
        existing_user = db.query(User).filter(
            User.username == user_in.username,
            User.id != user_id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        user.username = user_in.username
    
    if user_in.first_name is not None:
        user.first_name = user_in.first_name
    
    if user_in.last_name is not None:
        user.last_name = user_in.last_name
    
    if user_in.role is not None:
        user.role = user_in.role
    
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    
    if user_in.is_verified is not None:
        user.is_verified = user_in.is_verified
    
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/{user_id}")
def delete_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: User = Depends(get_admin_user)
) -> Any:
    """Delete a user (admin only)."""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from deleting themselves
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}