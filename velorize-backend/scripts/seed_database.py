"""
Database Seed Script for Velorize Platform
Populates the database with sample Malaysian F&B data for development and testing.

Run with: python -m scripts.seed_database
Or from Docker: docker-compose exec backend python -m scripts.seed_database
"""

import sys
import os
from datetime import date, datetime, timedelta
from decimal import Decimal
import random

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.models.product import Product, ProductStatus, ProductCategory, UnitOfMeasure
from app.models.customer import Customer, CustomerType, CustomerStatus
from app.models.supplier import Supplier, SupplierType, SupplierStatus
from app.models.inventory import StockOnHand, StockMovement, StockLocation, StockStatus, MovementType, MovementStatus
from app.models.sales import SalesActual, SalesChannel
from app.models.user import User


def get_admin_user(db: Session) -> User:
    """Get the admin user for foreign key references."""
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        raise Exception("Admin user not found. Please ensure the admin user exists.")
    return admin


def seed_products(db: Session) -> list[Product]:
    """Seed Malaysian F&B products."""
    
    products_data = [
        # Finished Goods - Malaysian Favorites
        {"sku": "FG-NL-001", "name": "Nasi Lemak Packet (Ready-to-Eat)", "category": ProductCategory.FINISHED_GOODS, 
         "base_uom": UnitOfMeasure.PACK, "standard_cost": Decimal("3.50"), "selling_price": Decimal("6.90"),
         "shelf_life_days": 3, "is_perishable": True, "storage_temperature": "chilled", "pack_size": Decimal("1")},
        
        {"sku": "FG-RK-001", "name": "Rendang Ayam (Chicken Rendang)", "category": ProductCategory.FINISHED_GOODS,
         "base_uom": UnitOfMeasure.PACK, "standard_cost": Decimal("8.00"), "selling_price": Decimal("15.90"),
         "shelf_life_days": 5, "is_perishable": True, "storage_temperature": "chilled", "pack_size": Decimal("0.3")},
        
        {"sku": "FG-ST-001", "name": "Satay Ayam (10 sticks)", "category": ProductCategory.FINISHED_GOODS,
         "base_uom": UnitOfMeasure.PACK, "standard_cost": Decimal("6.00"), "selling_price": Decimal("12.00"),
         "shelf_life_days": 2, "is_perishable": True, "storage_temperature": "frozen", "pack_size": Decimal("10")},
        
        {"sku": "FG-LK-001", "name": "Laksa Paste", "category": ProductCategory.FINISHED_GOODS,
         "base_uom": UnitOfMeasure.PACK, "standard_cost": Decimal("4.50"), "selling_price": Decimal("9.90"),
         "shelf_life_days": 180, "is_perishable": False, "storage_temperature": "ambient", "pack_size": Decimal("0.2")},
        
        {"sku": "FG-KR-001", "name": "Kuih Raya Assortment Box", "category": ProductCategory.FINISHED_GOODS,
         "base_uom": UnitOfMeasure.BOX, "standard_cost": Decimal("25.00"), "selling_price": Decimal("49.90"),
         "shelf_life_days": 30, "is_perishable": False, "storage_temperature": "ambient", "pack_size": Decimal("1")},
        
        {"sku": "FG-RB-001", "name": "Roti Canai (Frozen, 10pcs)", "category": ProductCategory.FINISHED_GOODS,
         "base_uom": UnitOfMeasure.PACK, "standard_cost": Decimal("5.00"), "selling_price": Decimal("10.90"),
         "shelf_life_days": 90, "is_perishable": True, "storage_temperature": "frozen", "pack_size": Decimal("10")},
        
        {"sku": "FG-CC-001", "name": "Curry Chicken (Ready Meal)", "category": ProductCategory.FINISHED_GOODS,
         "base_uom": UnitOfMeasure.PACK, "standard_cost": Decimal("7.50"), "selling_price": Decimal("14.90"),
         "shelf_life_days": 4, "is_perishable": True, "storage_temperature": "chilled", "pack_size": Decimal("0.35")},
        
        {"sku": "FG-MG-001", "name": "Mee Goreng Mamak (Frozen)", "category": ProductCategory.FINISHED_GOODS,
         "base_uom": UnitOfMeasure.PACK, "standard_cost": Decimal("4.00"), "selling_price": Decimal("8.90"),
         "shelf_life_days": 60, "is_perishable": True, "storage_temperature": "frozen", "pack_size": Decimal("0.4")},
        
        # Raw Materials
        {"sku": "RM-RC-001", "name": "Beras Wangi (Fragrant Rice)", "category": ProductCategory.RAW_MATERIALS,
         "base_uom": UnitOfMeasure.KG, "standard_cost": Decimal("3.20"), "selling_price": None,
         "shelf_life_days": 365, "is_perishable": False, "storage_temperature": "ambient", "pack_size": Decimal("10")},
        
        {"sku": "RM-SN-001", "name": "Santan Kelapa (Coconut Milk)", "category": ProductCategory.RAW_MATERIALS,
         "base_uom": UnitOfMeasure.LITRE, "standard_cost": Decimal("8.50"), "selling_price": None,
         "shelf_life_days": 7, "is_perishable": True, "storage_temperature": "chilled", "pack_size": Decimal("1")},
        
        {"sku": "RM-AY-001", "name": "Ayam Segar (Fresh Chicken)", "category": ProductCategory.PROTEINS,
         "base_uom": UnitOfMeasure.KG, "standard_cost": Decimal("12.00"), "selling_price": None,
         "shelf_life_days": 3, "is_perishable": True, "storage_temperature": "chilled", "pack_size": Decimal("1")},
        
        {"sku": "RM-UG-001", "name": "Udang Segar (Fresh Prawns)", "category": ProductCategory.PROTEINS,
         "base_uom": UnitOfMeasure.KG, "standard_cost": Decimal("35.00"), "selling_price": None,
         "shelf_life_days": 2, "is_perishable": True, "storage_temperature": "chilled", "pack_size": Decimal("1")},
        
        {"sku": "RM-CB-001", "name": "Cili Boh (Chili Paste)", "category": ProductCategory.SAUCES_CONDIMENTS,
         "base_uom": UnitOfMeasure.KG, "standard_cost": Decimal("15.00"), "selling_price": None,
         "shelf_life_days": 90, "is_perishable": False, "storage_temperature": "chilled", "pack_size": Decimal("1")},
        
        {"sku": "RM-BW-001", "name": "Bawang Merah (Shallots)", "category": ProductCategory.VEGETABLES,
         "base_uom": UnitOfMeasure.KG, "standard_cost": Decimal("8.00"), "selling_price": None,
         "shelf_life_days": 14, "is_perishable": True, "storage_temperature": "ambient", "pack_size": Decimal("1")},
        
        {"sku": "RM-SK-001", "name": "Serai (Lemongrass)", "category": ProductCategory.VEGETABLES,
         "base_uom": UnitOfMeasure.KG, "standard_cost": Decimal("6.00"), "selling_price": None,
         "shelf_life_days": 7, "is_perishable": True, "storage_temperature": "chilled", "pack_size": Decimal("1")},
        
        # Beverages
        {"sku": "BV-TT-001", "name": "Teh Tarik (3-in-1 Premix)", "category": ProductCategory.BEVERAGES,
         "base_uom": UnitOfMeasure.BOX, "standard_cost": Decimal("12.00"), "selling_price": Decimal("24.90"),
         "shelf_life_days": 365, "is_perishable": False, "storage_temperature": "ambient", "pack_size": Decimal("20")},
        
        {"sku": "BV-KP-001", "name": "Kopi O (Traditional Coffee)", "category": ProductCategory.BEVERAGES,
         "base_uom": UnitOfMeasure.PACK, "standard_cost": Decimal("8.00"), "selling_price": Decimal("16.90"),
         "shelf_life_days": 365, "is_perishable": False, "storage_temperature": "ambient", "pack_size": Decimal("0.5")},
        
        {"sku": "BV-ML-001", "name": "Milo Powder", "category": ProductCategory.BEVERAGES,
         "base_uom": UnitOfMeasure.KG, "standard_cost": Decimal("18.00"), "selling_price": Decimal("32.90"),
         "shelf_life_days": 365, "is_perishable": False, "storage_temperature": "ambient", "pack_size": Decimal("1")},
        
        # Packaging
        {"sku": "PK-CT-001", "name": "Food Container (500ml)", "category": ProductCategory.PACKAGING,
         "base_uom": UnitOfMeasure.PIECE, "standard_cost": Decimal("0.35"), "selling_price": None,
         "shelf_life_days": None, "is_perishable": False, "storage_temperature": "ambient", "pack_size": Decimal("100")},
        
        {"sku": "PK-BG-001", "name": "Vacuum Seal Bag (Large)", "category": ProductCategory.PACKAGING,
         "base_uom": UnitOfMeasure.PIECE, "standard_cost": Decimal("0.15"), "selling_price": None,
         "shelf_life_days": None, "is_perishable": False, "storage_temperature": "ambient", "pack_size": Decimal("500")},
    ]
    
    products = []
    for data in products_data:
        existing = db.query(Product).filter(Product.sku == data["sku"]).first()
        if not existing:
            # Set reorder level based on product type
            reorder_level = Decimal("50") if data["category"] == ProductCategory.FINISHED_GOODS else Decimal("100")
            product = Product(**data, status=ProductStatus.ACTIVE, safety_stock_days=7, reorder_level=reorder_level)
            db.add(product)
            products.append(product)
        else:
            products.append(existing)
    
    db.commit()
    print(f"✅ Seeded {len(products_data)} products")
    return products


def seed_customers(db: Session) -> list[Customer]:
    """Seed Malaysian customers."""
    
    customers_data = [
        {"customer_code": "CUST-001", "name": "Giant Hypermarket", "type": CustomerType.RETAIL,
         "contact_person": "Ahmad bin Hassan", "email": "procurement@giant.com.my", "phone": "+60-3-7954-1234",
         "city": "Petaling Jaya", "state": "Selangor", "postal_code": "47301", "is_key_account": True,
         "credit_limit_rm": 100000, "payment_terms_days": 30},
        
        {"customer_code": "CUST-002", "name": "Aeon Big", "type": CustomerType.RETAIL,
         "contact_person": "Lim Wei Ming", "email": "buying@aeonbig.com.my", "phone": "+60-3-8922-5678",
         "city": "Shah Alam", "state": "Selangor", "postal_code": "40000", "is_key_account": True,
         "credit_limit_rm": 80000, "payment_terms_days": 30},
        
        {"customer_code": "CUST-003", "name": "99 Speedmart Sdn Bhd", "type": CustomerType.RETAIL,
         "contact_person": "Tan Ah Kow", "email": "supply@99speedmart.com.my", "phone": "+60-3-6142-9999",
         "city": "Kuala Lumpur", "state": "Wilayah Persekutuan", "postal_code": "50000", "is_key_account": True,
         "credit_limit_rm": 150000, "payment_terms_days": 14},
        
        {"customer_code": "CUST-004", "name": "Restoran Mamak Pelita", "type": CustomerType.FOOD_SERVICE,
         "contact_person": "Muthu Rajan", "email": "order@pelita.com.my", "phone": "+60-3-4023-4567",
         "city": "Ampang", "state": "Selangor", "postal_code": "68000", "is_key_account": False,
         "credit_limit_rm": 20000, "payment_terms_days": 7},
        
        {"customer_code": "CUST-005", "name": "Hotel Istana KL", "type": CustomerType.FOOD_SERVICE,
         "contact_person": "Chef Razali", "email": "kitchen@hotelkl.com.my", "phone": "+60-3-2141-8888",
         "city": "Kuala Lumpur", "state": "Wilayah Persekutuan", "postal_code": "50250", "is_key_account": True,
         "credit_limit_rm": 50000, "payment_terms_days": 30},
        
        {"customer_code": "CUST-006", "name": "Lazada Malaysia", "type": CustomerType.ONLINE,
         "contact_person": "Sarah Wong", "email": "vendor@lazada.com.my", "phone": "+60-3-2723-1000",
         "city": "Bangsar South", "state": "Kuala Lumpur", "postal_code": "59200", "is_key_account": True,
         "credit_limit_rm": 75000, "payment_terms_days": 14},
        
        {"customer_code": "CUST-007", "name": "Shopee Malaysia", "type": CustomerType.ONLINE,
         "contact_person": "Jason Lee", "email": "seller@shopee.com.my", "phone": "+60-3-2302-2000",
         "city": "Bangsar", "state": "Kuala Lumpur", "postal_code": "59100", "is_key_account": True,
         "credit_limit_rm": 60000, "payment_terms_days": 14},
        
        {"customer_code": "CUST-008", "name": "Syarikat Borong Utara", "type": CustomerType.WHOLESALE,
         "contact_person": "Encik Ismail", "email": "order@borongutara.com.my", "phone": "+60-4-733-5555",
         "city": "Alor Setar", "state": "Kedah", "postal_code": "05000", "is_key_account": False,
         "credit_limit_rm": 30000, "payment_terms_days": 14},
        
        {"customer_code": "CUST-009", "name": "Penang Food Distributors", "type": CustomerType.DISTRIBUTOR,
         "contact_person": "Goh Beng Huat", "email": "sales@pgfood.com.my", "phone": "+60-4-261-7777",
         "city": "Georgetown", "state": "Penang", "postal_code": "10000", "is_key_account": True,
         "credit_limit_rm": 120000, "payment_terms_days": 30},
        
        {"customer_code": "CUST-010", "name": "Johor Bahru Mart", "type": CustomerType.RETAIL,
         "contact_person": "Siti Aminah", "email": "purchase@jbmart.com.my", "phone": "+60-7-223-4444",
         "city": "Johor Bahru", "state": "Johor", "postal_code": "80000", "is_key_account": False,
         "credit_limit_rm": 25000, "payment_terms_days": 14},
    ]
    
    customers = []
    for data in customers_data:
        existing = db.query(Customer).filter(Customer.customer_code == data["customer_code"]).first()
        if not existing:
            customer = Customer(**data, status=CustomerStatus.ACTIVE, country="Malaysia")
            db.add(customer)
            customers.append(customer)
        else:
            customers.append(existing)
    
    db.commit()
    print(f"✅ Seeded {len(customers_data)} customers")
    return customers


def seed_suppliers(db: Session) -> list[Supplier]:
    """Seed Malaysian suppliers."""
    
    suppliers_data = [
        {"supplier_code": "SUP-001", "name": "Ayamas Food Corporation", "type": SupplierType.RAW_MATERIAL,
         "contact_person": "Encik Kamal", "email": "supply@ayamas.com.my", "phone": "+60-3-5122-1234",
         "city": "Rawang", "state": "Selangor", "postal_code": "48000", "is_preferred": True,
         "halal_certified": True, "quality_rating": "A", "lead_time_days": 2, "payment_terms_days": 30},
        
        {"supplier_code": "SUP-002", "name": "Bernas Rice Mill", "type": SupplierType.RAW_MATERIAL,
         "contact_person": "Puan Fatimah", "email": "sales@bernas.com.my", "phone": "+60-3-2034-5678",
         "city": "Kuala Lumpur", "state": "Wilayah Persekutuan", "postal_code": "50480", "is_preferred": True,
         "halal_certified": True, "quality_rating": "A", "lead_time_days": 3, "payment_terms_days": 30},
        
        {"supplier_code": "SUP-003", "name": "Kara Coconut Products", "type": SupplierType.RAW_MATERIAL,
         "contact_person": "Mr. Ravi", "email": "order@kara.com.my", "phone": "+60-6-765-4321",
         "city": "Melaka", "state": "Melaka", "postal_code": "75000", "is_preferred": True,
         "halal_certified": True, "quality_rating": "A", "lead_time_days": 2, "payment_terms_days": 14},
        
        {"supplier_code": "SUP-004", "name": "Seafood King Sdn Bhd", "type": SupplierType.RAW_MATERIAL,
         "contact_person": "Ah Hock", "email": "fresh@seafoodking.com.my", "phone": "+60-4-644-8888",
         "city": "Butterworth", "state": "Penang", "postal_code": "12100", "is_preferred": False,
         "halal_certified": True, "quality_rating": "B", "lead_time_days": 1, "payment_terms_days": 7},
        
        {"supplier_code": "SUP-005", "name": "Cameron Highlands Vegetables", "type": SupplierType.RAW_MATERIAL,
         "contact_person": "Mr. Tan", "email": "farm@cameronveg.com.my", "phone": "+60-5-491-2345",
         "city": "Tanah Rata", "state": "Pahang", "postal_code": "39000", "is_preferred": True,
         "halal_certified": True, "quality_rating": "A", "lead_time_days": 2, "payment_terms_days": 7},
        
        {"supplier_code": "SUP-006", "name": "Spice World Malaysia", "type": SupplierType.RAW_MATERIAL,
         "contact_person": "Encik Rashid", "email": "spices@spiceworld.com.my", "phone": "+60-3-8912-3456",
         "city": "Klang", "state": "Selangor", "postal_code": "41000", "is_preferred": True,
         "halal_certified": True, "quality_rating": "A", "lead_time_days": 3, "payment_terms_days": 30},
        
        {"supplier_code": "SUP-007", "name": "PackMate Industries", "type": SupplierType.PACKAGING,
         "contact_person": "Ms. Lee", "email": "sales@packmate.com.my", "phone": "+60-3-5569-7890",
         "city": "Shah Alam", "state": "Selangor", "postal_code": "40150", "is_preferred": True,
         "halal_certified": False, "quality_rating": "A", "lead_time_days": 5, "payment_terms_days": 30},
        
        {"supplier_code": "SUP-008", "name": "Cold Chain Logistics", "type": SupplierType.LOGISTICS,
         "contact_person": "Mr. Kumar", "email": "ops@coldchain.com.my", "phone": "+60-3-7845-6789",
         "city": "Petaling Jaya", "state": "Selangor", "postal_code": "47810", "is_preferred": True,
         "halal_certified": False, "quality_rating": "A", "lead_time_days": 1, "payment_terms_days": 14},
    ]
    
    suppliers = []
    for data in suppliers_data:
        existing = db.query(Supplier).filter(Supplier.supplier_code == data["supplier_code"]).first()
        if not existing:
            supplier = Supplier(**data, status=SupplierStatus.ACTIVE, country="Malaysia")
            db.add(supplier)
            suppliers.append(supplier)
        else:
            suppliers.append(existing)
    
    db.commit()
    print(f"✅ Seeded {len(suppliers_data)} suppliers")
    return suppliers


def seed_inventory(db: Session, products: list[Product]) -> list[StockOnHand]:
    """Seed inventory stock levels."""
    
    inventory_items = []
    today = date.today()
    
    for product in products:
        # Skip if inventory already exists
        existing = db.query(StockOnHand).filter(StockOnHand.product_id == product.id).first()
        if existing:
            inventory_items.append(existing)
            continue
        
        # Generate random but realistic inventory levels
        base_qty = random.randint(50, 500)
        reserved = random.randint(0, int(base_qty * 0.2))
        available = base_qty - reserved
        
        # Calculate expiry date for perishable items
        expiry_date = None
        days_to_expiry = None
        is_near_expiry = False
        
        if product.is_perishable and product.shelf_life_days:
            # Random expiry within shelf life
            days_remaining = random.randint(1, product.shelf_life_days)
            expiry_date = today + timedelta(days=days_remaining)
            days_to_expiry = days_remaining
            is_near_expiry = days_remaining <= 7
        
        stock = StockOnHand(
            product_id=product.id,
            location=random.choice([StockLocation.MAIN_WAREHOUSE, StockLocation.COLD_STORAGE, StockLocation.DRY_STORAGE]),
            quantity_on_hand=Decimal(str(base_qty)),
            reserved_quantity=Decimal(str(reserved)),
            available_quantity=Decimal(str(available)),
            average_unit_cost=product.standard_cost,
            total_value=product.standard_cost * Decimal(str(base_qty)),
            status=StockStatus.AVAILABLE,
            last_movement_date=today - timedelta(days=random.randint(1, 14)),
            days_since_last_movement=random.randint(1, 14),
            earliest_expiry_date=expiry_date,
            days_to_expiry=days_to_expiry,
            is_near_expiry=is_near_expiry,
            safety_stock_level=Decimal(str(random.randint(20, 50))),
            reorder_point=Decimal(str(random.randint(30, 80))),
            snapshot_date=today
        )
        db.add(stock)
        inventory_items.append(stock)
    
    db.commit()
    print(f"✅ Seeded {len(inventory_items)} inventory records")
    return inventory_items


def seed_sales_history(db: Session, products: list[Product], customers: list[Customer], admin_user: User):
    """Seed 6 months of sales history."""
    
    # Check if sales already exist
    existing_count = db.query(SalesActual).count()
    if existing_count > 0:
        print(f"⏭️  Skipping sales seeding - {existing_count} records already exist")
        return
    
    today = date.today()
    start_date = today - timedelta(days=180)  # 6 months back
    
    # Filter to only finished goods and beverages (sellable products)
    sellable_products = [p for p in products if p.category in [ProductCategory.FINISHED_GOODS, ProductCategory.BEVERAGES]]
    
    sales_channels = [SalesChannel.RETAIL, SalesChannel.WHOLESALE, SalesChannel.ONLINE, SalesChannel.FOOD_SERVICE]
    invoice_counter = 1000
    
    sales_records = []
    current_date = start_date
    
    while current_date <= today:
        # Generate 5-15 sales per day
        daily_sales = random.randint(5, 15)
        
        for _ in range(daily_sales):
            product = random.choice(sellable_products)
            customer = random.choice(customers)
            
            # Random quantity based on customer type
            if customer.type == CustomerType.WHOLESALE:
                qty = random.randint(20, 100)
            elif customer.type == CustomerType.DISTRIBUTOR:
                qty = random.randint(50, 200)
            else:
                qty = random.randint(1, 20)
            
            unit_price = product.selling_price or product.standard_cost * Decimal("1.5")
            gross_amount = unit_price * Decimal(str(qty))
            
            # Random discount (0-15%)
            discount_pct = random.uniform(0, 0.15)
            discount_amount = gross_amount * Decimal(str(discount_pct))
            net_amount = gross_amount - discount_amount
            
            unit_cost = product.standard_cost
            total_cost = unit_cost * Decimal(str(qty))
            margin_amount = net_amount - total_cost
            margin_pct = (margin_amount / net_amount * 100) if net_amount > 0 else Decimal("0")
            
            invoice_counter += 1
            
            sale = SalesActual(
                product_id=product.id,
                customer_id=customer.id,
                transaction_date=current_date,
                invoice_number=f"INV-{current_date.strftime('%Y%m')}-{invoice_counter}",
                quantity_sold=Decimal(str(qty)),
                unit_price=unit_price,
                gross_sales_amount=gross_amount.quantize(Decimal("0.01")),
                discount_amount=discount_amount.quantize(Decimal("0.01")),
                net_sales_amount=net_amount.quantize(Decimal("0.01")),
                unit_cost=unit_cost,
                total_cost=total_cost.quantize(Decimal("0.01")),
                gross_margin_amount=margin_amount.quantize(Decimal("0.01")),
                gross_margin_percentage=margin_pct.quantize(Decimal("0.01")),
                sales_channel=random.choice(sales_channels),
                sales_rep_id=admin_user.id,
                is_promotional_sale=random.random() < 0.1,  # 10% promotional
                shipping_cost=Decimal(str(random.randint(0, 20)))
            )
            sales_records.append(sale)
        
        current_date += timedelta(days=1)
    
    # Batch insert
    db.bulk_save_objects(sales_records)
    db.commit()
    print(f"✅ Seeded {len(sales_records)} sales records (6 months history)")


def seed_stock_movements(db: Session, products: list[Product], admin_user: User):
    """Seed recent stock movements."""
    
    # Check if movements already exist
    existing_count = db.query(StockMovement).count()
    if existing_count > 0:
        print(f"⏭️  Skipping stock movements seeding - {existing_count} records already exist")
        return
    
    today = datetime.now()
    movements = []
    
    for product in products[:10]:  # First 10 products
        # Create some receipt movements (stock in)
        for i in range(3):
            movement_date = today - timedelta(days=random.randint(1, 30))
            qty = Decimal(str(random.randint(50, 200)))
            
            movement = StockMovement(
                product_id=product.id,
                movement_type=MovementType.RECEIPT,
                movement_date=movement_date,
                status=MovementStatus.COMPLETED,
                quantity=qty,
                to_location=StockLocation.MAIN_WAREHOUSE,
                unit_cost=product.standard_cost,
                total_cost=(product.standard_cost * qty).quantize(Decimal("0.01")),
                reference_number=f"GRN-{movement_date.strftime('%Y%m%d')}-{random.randint(100, 999)}",
                user_id=admin_user.id,
                reason="Regular stock replenishment"
            )
            movements.append(movement)
        
        # Create some issue movements (stock out)
        for i in range(5):
            movement_date = today - timedelta(days=random.randint(1, 30))
            qty = Decimal(str(random.randint(10, 50)))
            
            movement = StockMovement(
                product_id=product.id,
                movement_type=MovementType.ISSUE,
                movement_date=movement_date,
                status=MovementStatus.COMPLETED,
                quantity=qty,
                from_location=StockLocation.MAIN_WAREHOUSE,
                unit_cost=product.standard_cost,
                total_cost=(product.standard_cost * qty).quantize(Decimal("0.01")),
                reference_number=f"DO-{movement_date.strftime('%Y%m%d')}-{random.randint(100, 999)}",
                user_id=admin_user.id,
                reason="Sales order fulfillment"
            )
            movements.append(movement)
    
    db.bulk_save_objects(movements)
    db.commit()
    print(f"✅ Seeded {len(movements)} stock movements")


def main():
    """Main seeding function."""
    print("\n" + "="*60)
    print("🌱 VELORIZE DATABASE SEEDING")
    print("="*60 + "\n")
    
    db = SessionLocal()
    
    try:
        # Get admin user first
        admin_user = get_admin_user(db)
        print(f"✅ Found admin user: {admin_user.username}")
        
        # Seed master data
        products = seed_products(db)
        customers = seed_customers(db)
        suppliers = seed_suppliers(db)
        
        # Seed transactional data
        inventory = seed_inventory(db, products)
        seed_sales_history(db, products, customers, admin_user)
        seed_stock_movements(db, products, admin_user)
        
        print("\n" + "="*60)
        print("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print("="*60)
        print("\nSummary:")
        print(f"  - Products: {len(products)}")
        print(f"  - Customers: {len(customers)}")
        print(f"  - Suppliers: {len(suppliers)}")
        print(f"  - Inventory records: {len(inventory)}")
        print(f"  - Sales history: ~1800 records (6 months)")
        print(f"  - Stock movements: ~80 records")
        print("\n")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
