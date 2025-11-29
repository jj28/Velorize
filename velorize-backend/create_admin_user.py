#!/usr/bin/env python3
"""
Script to create an initial admin user for Velorize.
This should be run after the database is set up and migrations are applied.
"""

import os
import sys
from pathlib import Path

# Add the project root to Python path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.models.user import User, UserRole
from app.core.security import get_password_hash

def create_admin_user():
    """Create the initial admin user."""
    
    print("Creating initial admin user for Velorize...")
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Check if any admin user already exists
        existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        
        if existing_admin:
            print(f"Admin user already exists: {existing_admin.username} ({existing_admin.email})")
            return True
        
        # Create admin user
        admin_user = User(
            email="admin@velorize.app",
            username="admin",
            first_name="System",
            last_name="Administrator",
            hashed_password=get_password_hash("admin123"),  # Change this in production!
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Admin user created successfully!")
        print(f"   Username: {admin_user.username}")
        print(f"   Email: {admin_user.email}")
        print(f"   Password: admin123")
        print("\n⚠️  IMPORTANT: Change the default password after first login!")
        
        # Create a sample S&OP Leader user
        sop_user = User(
            email="sop@velorize.app",
            username="sop_leader",
            first_name="S&OP",
            last_name="Leader",
            hashed_password=get_password_hash("sop123"),
            role=UserRole.SOP_LEADER,
            is_active=True,
            is_verified=True
        )
        
        db.add(sop_user)
        db.commit()
        db.refresh(sop_user)
        
        print(f"\n✅ S&OP Leader user created successfully!")
        print(f"   Username: {sop_user.username}")
        print(f"   Email: {sop_user.email}")
        print(f"   Password: sop123")
        
        # Create a sample viewer user
        viewer_user = User(
            email="viewer@velorize.app",
            username="viewer",
            first_name="Demo",
            last_name="Viewer",
            hashed_password=get_password_hash("viewer123"),
            role=UserRole.VIEWER,
            is_active=True,
            is_verified=True
        )
        
        db.add(viewer_user)
        db.commit()
        db.refresh(viewer_user)
        
        print(f"\n✅ Viewer user created successfully!")
        print(f"   Username: {viewer_user.username}")
        print(f"   Email: {viewer_user.email}")
        print(f"   Password: viewer123")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
        return False
        
    finally:
        db.close()

def main():
    """Main function."""
    
    try:
        # Test database connection
        print("Testing database connection...")
        with engine.connect() as conn:
            print("✅ Database connection successful!")
        
        # Create admin user
        return create_admin_user()
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("Make sure PostgreSQL is running and accessible.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)