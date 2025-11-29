#!/usr/bin/env python3
"""
Script to seed sample data for Velorize F&B demo.
Creates sample products, customers, suppliers relevant to a poke bowl business.
"""

import os
import sys
from decimal import Decimal
from pathlib import Path

# Add the project root to Python path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.product import Product, ProductCategory, ProductStatus, UnitOfMeasure
from app.models.customer import Customer, CustomerType, CustomerStatus
from app.models.supplier import Supplier, SupplierType, SupplierStatus

def seed_products(db: Session):
    """Create sample F&B products for poke bowl business."""
    
    print("Creating sample products...")
    
    products = [
        # Finished Goods - Poke Bowls
        {
            "sku": "POKE-SALMON-REG",
            "name": "Regular Salmon Poke Bowl",
            "description": "Fresh salmon poke bowl with rice, vegetables and sauce",
            "category": ProductCategory.FINISHED_GOODS,
            "status": ProductStatus.ACTIVE,
            "base_uom": UnitOfMeasure.PIECE,
            "pack_size": Decimal("1.0"),
            "standard_cost": Decimal("12.50"),
            "selling_price": Decimal("18.90"),
            "supplier_lead_time": 1,
            "safety_stock_days": 2,
            "shelf_life_days": 3,
            "is_perishable": True,
            "storage_temperature": "chilled",
            "has_bom": True
        },
        {
            "sku": "POKE-TUNA-REG",
            "name": "Regular Tuna Poke Bowl", 
            "description": "Fresh tuna poke bowl with rice, vegetables and sauce",
            "category": ProductCategory.FINISHED_GOODS,
            "status": ProductStatus.ACTIVE,
            "base_uom": UnitOfMeasure.PIECE,
            "pack_size": Decimal("1.0"),
            "standard_cost": Decimal("14.00"),
            "selling_price": Decimal("21.90"),
            "supplier_lead_time": 1,
            "safety_stock_days": 2,
            "shelf_life_days": 3,
            "is_perishable": True,
            "storage_temperature": "chilled",
            "has_bom": True
        },
        
        # Raw Materials - Proteins
        {
            "sku": "FISH-SALMON-FRESH",
            "name": "Fresh Norwegian Salmon Sashimi Grade",
            "description": "Premium sashimi-grade salmon fillet",
            "category": ProductCategory.PROTEINS,
            "status": ProductStatus.ACTIVE,
            "base_uom": UnitOfMeasure.KG,
            "standard_cost": Decimal("45.00"),
            "supplier_lead_time": 2,
            "safety_stock_days": 1,
            "shelf_life_days": 3,
            "is_perishable": True,
            "storage_temperature": "chilled"
        },
        {
            "sku": "FISH-TUNA-FRESH", 
            "name": "Fresh Yellowfin Tuna Sashimi Grade",
            "description": "Premium sashimi-grade yellowfin tuna",
            "category": ProductCategory.PROTEINS,
            "status": ProductStatus.ACTIVE,
            "base_uom": UnitOfMeasure.KG,
            "standard_cost": Decimal("52.00"),
            "supplier_lead_time": 2,
            "safety_stock_days": 1,
            "shelf_life_days": 2,
            "is_perishable": True,
            "storage_temperature": "chilled"
        },
        
        # Grains
        {
            "sku": "RICE-SUSHI-PREMIUM",
            "name": "Premium Sushi Rice",
            "description": "Short grain sushi rice",
            "category": ProductCategory.GRAINS,
            "status": ProductStatus.ACTIVE,
            "base_uom": UnitOfMeasure.KG,
            "standard_cost": Decimal("8.50"),
            "supplier_lead_time": 7,
            "safety_stock_days": 14,
            "shelf_life_days": 365,
            "is_perishable": False,
            "storage_temperature": "ambient"
        },
        
        # Vegetables
        {
            "sku": "VEG-CUCUMBER-LOCAL",
            "name": "Local Cucumber",
            "description": "Fresh local cucumber",
            "category": ProductCategory.VEGETABLES,
            "status": ProductStatus.ACTIVE,
            "base_uom": UnitOfMeasure.KG,
            "standard_cost": Decimal("4.50"),
            "supplier_lead_time": 1,
            "safety_stock_days": 2,
            "shelf_life_days": 7,
            "is_perishable": True,
            "storage_temperature": "chilled"
        },
        {
            "sku": "VEG-AVOCADO-IMPORT",
            "name": "Imported Avocado",
            "description": "Premium imported avocado",
            "category": ProductCategory.VEGETABLES,
            "status": ProductStatus.ACTIVE,
            "base_uom": UnitOfMeasure.PIECE,
            "standard_cost": Decimal("2.80"),
            "supplier_lead_time": 3,
            "safety_stock_days": 2,
            "shelf_life_days": 5,
            "is_perishable": True,
            "storage_temperature": "ambient"
        },
        
        # Sauces & Condiments
        {
            "sku": "SAUCE-SOY-PREMIUM",
            "name": "Premium Soy Sauce",
            "description": "Japanese premium soy sauce",
            "category": ProductCategory.SAUCES_CONDIMENTS,
            "status": ProductStatus.ACTIVE,
            "base_uom": UnitOfMeasure.LITRE,
            "standard_cost": Decimal("15.00"),
            "supplier_lead_time": 14,
            "safety_stock_days": 30,
            "shelf_life_days": 730,
            "is_perishable": False,
            "storage_temperature": "ambient"
        },
        
        # Packaging
        {
            "sku": "PKG-BOWL-PAPER-500ML",
            "name": "Paper Poke Bowl 500ml",
            "description": "Eco-friendly paper bowl for poke",
            "category": ProductCategory.PACKAGING,
            "status": ProductStatus.ACTIVE,
            "base_uom": UnitOfMeasure.PIECE,
            "standard_cost": Decimal("0.45"),
            "supplier_lead_time": 14,
            "safety_stock_days": 30,
            "is_perishable": False,
            "storage_temperature": "ambient"
        }
    ]
    
    for product_data in products:
        existing = db.query(Product).filter(Product.sku == product_data["sku"]).first()
        if not existing:
            product = Product(**product_data)
            db.add(product)
    
    db.commit()
    print(f"✅ Created {len(products)} sample products")

def seed_customers(db: Session):
    """Create sample customers."""
    
    print("Creating sample customers...")
    
    customers = [
        {
            "customer_code": "CUST-FB-001",
            "name": "Poke Bowl Central Sdn Bhd",
            "type": CustomerType.FOOD_SERVICE,
            "status": CustomerStatus.ACTIVE,
            "contact_person": "Ahmad Hassan",
            "email": "ahmad@pokebowlcentral.com.my",
            "phone": "+60123456789",
            "address_line1": "123 Jalan Bukit Bintang",
            "city": "Kuala Lumpur",
            "state": "Wilayah Persekutuan",
            "postal_code": "50200",
            "country": "Malaysia",
            "credit_limit_rm": 50000,
            "payment_terms_days": 30,
            "is_key_account": True
        },
        {
            "customer_code": "CUST-RT-002",
            "name": "Fresh Food Mart",
            "type": CustomerType.RETAIL,
            "status": CustomerStatus.ACTIVE,
            "contact_person": "Lim Wei Ming",
            "email": "procurement@freshfoodmart.my",
            "phone": "+60387654321",
            "address_line1": "456 Jalan Petaling",
            "city": "Kuala Lumpur", 
            "state": "Wilayah Persekutuan",
            "postal_code": "50000",
            "country": "Malaysia",
            "credit_limit_rm": 30000,
            "payment_terms_days": 14,
            "is_key_account": False
        },
        {
            "customer_code": "CUST-ON-003",
            "name": "FoodPanda Malaysia",
            "type": CustomerType.ONLINE,
            "status": CustomerStatus.ACTIVE,
            "contact_person": "Sarah Tan",
            "email": "vendor@foodpanda.my",
            "phone": "+60312345678",
            "address_line1": "789 Jalan Technology",
            "city": "Cyberjaya",
            "state": "Selangor",
            "postal_code": "63000",
            "country": "Malaysia",
            "credit_limit_rm": 75000,
            "payment_terms_days": 21,
            "is_key_account": True
        }
    ]
    
    for customer_data in customers:
        existing = db.query(Customer).filter(Customer.customer_code == customer_data["customer_code"]).first()
        if not existing:
            customer = Customer(**customer_data)
            db.add(customer)
    
    db.commit()
    print(f"✅ Created {len(customers)} sample customers")

def seed_suppliers(db: Session):
    """Create sample suppliers."""
    
    print("Creating sample suppliers...")
    
    suppliers = [
        {
            "supplier_code": "SUPP-FISH-001",
            "name": "Fresh Seafood Suppliers Sdn Bhd",
            "type": SupplierType.RAW_MATERIAL,
            "status": SupplierStatus.ACTIVE,
            "contact_person": "Captain Lee",
            "email": "orders@freshseafood.my",
            "phone": "+60387654321",
            "address_line1": "Port Klang Fish Market",
            "city": "Port Klang",
            "state": "Selangor",
            "postal_code": "42000",
            "country": "Malaysia",
            "payment_terms_days": 14,
            "lead_time_days": 1,
            "minimum_order_quantity": 5,
            "is_preferred": True,
            "quality_rating": "A",
            "halal_certified": True
        },
        {
            "supplier_code": "SUPP-VEG-002", 
            "name": "Cameron Highlands Vegetables",
            "type": SupplierType.RAW_MATERIAL,
            "status": SupplierStatus.ACTIVE,
            "contact_person": "Raj Kumar",
            "email": "supply@cameronveg.my",
            "phone": "+60459876543",
            "address_line1": "Cameron Highlands",
            "city": "Tanah Rata",
            "state": "Pahang",
            "postal_code": "39000",
            "country": "Malaysia",
            "payment_terms_days": 7,
            "lead_time_days": 2,
            "minimum_order_quantity": 20,
            "is_preferred": True,
            "quality_rating": "A",
            "halal_certified": True
        },
        {
            "supplier_code": "SUPP-PKG-003",
            "name": "Eco Pack Solutions",
            "type": SupplierType.PACKAGING,
            "status": SupplierStatus.ACTIVE,
            "contact_person": "Jennifer Wong",
            "email": "sales@ecopack.my",
            "phone": "+60356781234",
            "address_line1": "Industrial Area",
            "city": "Shah Alam",
            "state": "Selangor", 
            "postal_code": "40000",
            "country": "Malaysia",
            "payment_terms_days": 30,
            "lead_time_days": 14,
            "minimum_order_quantity": 1000,
            "is_preferred": True,
            "quality_rating": "B",
            "halal_certified": False
        }
    ]
    
    for supplier_data in suppliers:
        existing = db.query(Supplier).filter(Supplier.supplier_code == supplier_data["supplier_code"]).first()
        if not existing:
            supplier = Supplier(**supplier_data)
            db.add(supplier)
    
    db.commit()
    print(f"✅ Created {len(suppliers)} sample suppliers")

def main():
    """Main function to seed all sample data."""
    
    print("🌱 Seeding sample F&B data for Velorize...")
    
    db = SessionLocal()
    
    try:
        seed_products(db)
        seed_customers(db)  
        seed_suppliers(db)
        
        print("\n✅ Sample data seeding completed successfully!")
        print("You can now test the Velorize application with realistic F&B data.")
        
        # Show summary
        product_count = db.query(Product).count()
        customer_count = db.query(Customer).count()
        supplier_count = db.query(Supplier).count()
        
        print(f"\nData Summary:")
        print(f"  Products: {product_count}")
        print(f"  Customers: {customer_count}")
        print(f"  Suppliers: {supplier_count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        db.rollback()
        return False
        
    finally:
        db.close()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)