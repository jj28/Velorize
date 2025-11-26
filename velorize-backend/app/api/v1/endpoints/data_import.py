from typing import Any, List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import pandas as pd
import io
from datetime import datetime, date
import logging

from app.core.deps import get_db, get_current_verified_user, get_sop_leader_or_admin
from app.models.user import User
from app.models.product import Product, ProductCategory, UnitOfMeasure, ProductStatus
from app.models.customer import Customer, CustomerType, CustomerStatus
from app.models.supplier import Supplier, SupplierType, SupplierStatus
from app.models.inventory import StockOnHand, StockMovement, MovementType, MovementStatus
from app.models.sales import SalesActual
from app.models.forecast import DemandForecast, ForecastMethod, ForecastStatus

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/products/csv")
async def import_products_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_sop_leader_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Import products from CSV file."""
    
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be CSV or Excel format"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Parse file based on extension
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        else:
            df = pd.read_excel(io.BytesIO(content))
        
        # Validate required columns
        required_columns = ['product_code', 'name', 'category', 'unit_of_measure']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {missing_columns}"
            )
        
        # Process data in background
        background_tasks.add_task(
            _process_products_import,
            df.to_dict('records'),
            current_user.id,
            db
        )
        
        return {
            "message": f"Processing {len(df)} products. Import started in background.",
            "total_records": len(df)
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty or has no data"
        )
    except Exception as e:
        logger.error(f"Error processing products import: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}"
        )


async def _process_products_import(records: List[Dict], user_id: int, db: Session):
    """Background task to process products import."""
    
    success_count = 0
    error_count = 0
    errors = []
    
    for idx, record in enumerate(records):
        try:
            # Check if product already exists
            existing_product = db.query(Product).filter(
                Product.product_code == record['product_code']
            ).first()
            
            if existing_product:
                errors.append(f"Row {idx + 2}: Product {record['product_code']} already exists")
                error_count += 1
                continue
            
            # Validate and convert enums
            category = None
            try:
                category = ProductCategory(record['category'].upper())
            except (ValueError, KeyError):
                category = ProductCategory.OTHER
            
            unit_of_measure = None
            try:
                unit_of_measure = UnitOfMeasure(record['unit_of_measure'].upper())
            except (ValueError, KeyError):
                unit_of_measure = UnitOfMeasure.EACH
            
            # Create product
            product_data = {
                'product_code': record['product_code'],
                'name': record['name'],
                'category': category,
                'unit_of_measure': unit_of_measure,
                'status': ProductStatus.ACTIVE
            }
            
            # Optional fields
            if 'description' in record and pd.notna(record['description']):
                product_data['description'] = record['description']
            
            if 'selling_price' in record and pd.notna(record['selling_price']):
                product_data['selling_price'] = float(record['selling_price'])
            
            if 'cost_price' in record and pd.notna(record['cost_price']):
                product_data['cost_price'] = float(record['cost_price'])
            
            if 'reorder_level' in record and pd.notna(record['reorder_level']):
                product_data['reorder_level'] = float(record['reorder_level'])
            
            if 'shelf_life_days' in record and pd.notna(record['shelf_life_days']):
                product_data['shelf_life_days'] = int(record['shelf_life_days'])
            
            if 'is_perishable' in record and pd.notna(record['is_perishable']):
                product_data['is_perishable'] = str(record['is_perishable']).lower() in ['true', '1', 'yes']
            
            product = Product(**product_data)
            db.add(product)
            success_count += 1
            
        except Exception as e:
            errors.append(f"Row {idx + 2}: {str(e)}")
            error_count += 1
    
    try:
        db.commit()
        logger.info(f"Products import completed: {success_count} successful, {error_count} errors")
    except Exception as e:
        db.rollback()
        logger.error(f"Database commit failed during products import: {str(e)}")


@router.post("/customers/csv")
async def import_customers_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_sop_leader_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Import customers from CSV file."""
    
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be CSV or Excel format"
        )
    
    try:
        content = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        else:
            df = pd.read_excel(io.BytesIO(content))
        
        required_columns = ['customer_code', 'name', 'type']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {missing_columns}"
            )
        
        background_tasks.add_task(
            _process_customers_import,
            df.to_dict('records'),
            current_user.id,
            db
        )
        
        return {
            "message": f"Processing {len(df)} customers. Import started in background.",
            "total_records": len(df)
        }
        
    except Exception as e:
        logger.error(f"Error processing customers import: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}"
        )


async def _process_customers_import(records: List[Dict], user_id: int, db: Session):
    """Background task to process customers import."""
    
    success_count = 0
    error_count = 0
    
    for idx, record in enumerate(records):
        try:
            existing_customer = db.query(Customer).filter(
                Customer.customer_code == record['customer_code']
            ).first()
            
            if existing_customer:
                error_count += 1
                continue
            
            customer_type = None
            try:
                customer_type = CustomerType(record['type'].upper())
            except (ValueError, KeyError):
                customer_type = CustomerType.RETAILER
            
            customer_data = {
                'customer_code': record['customer_code'],
                'name': record['name'],
                'type': customer_type,
                'status': CustomerStatus.ACTIVE
            }
            
            # Optional fields
            optional_fields = ['contact_person', 'email', 'phone', 'address', 'city', 'state', 'postal_code']
            for field in optional_fields:
                if field in record and pd.notna(record[field]):
                    customer_data[field] = record[field]
            
            if 'credit_limit_rm' in record and pd.notna(record['credit_limit_rm']):
                customer_data['credit_limit_rm'] = float(record['credit_limit_rm'])
            
            if 'is_key_account' in record and pd.notna(record['is_key_account']):
                customer_data['is_key_account'] = str(record['is_key_account']).lower() in ['true', '1', 'yes']
            
            customer = Customer(**customer_data)
            db.add(customer)
            success_count += 1
            
        except Exception as e:
            error_count += 1
    
    try:
        db.commit()
        logger.info(f"Customers import completed: {success_count} successful, {error_count} errors")
    except Exception as e:
        db.rollback()
        logger.error(f"Database commit failed during customers import: {str(e)}")


@router.post("/suppliers/csv")
async def import_suppliers_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_sop_leader_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Import suppliers from CSV file."""
    
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be CSV or Excel format"
        )
    
    try:
        content = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        else:
            df = pd.read_excel(io.BytesIO(content))
        
        required_columns = ['supplier_code', 'name', 'type']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {missing_columns}"
            )
        
        background_tasks.add_task(
            _process_suppliers_import,
            df.to_dict('records'),
            current_user.id,
            db
        )
        
        return {
            "message": f"Processing {len(df)} suppliers. Import started in background.",
            "total_records": len(df)
        }
        
    except Exception as e:
        logger.error(f"Error processing suppliers import: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}"
        )


async def _process_suppliers_import(records: List[Dict], user_id: int, db: Session):
    """Background task to process suppliers import."""
    
    success_count = 0
    error_count = 0
    
    for idx, record in enumerate(records):
        try:
            existing_supplier = db.query(Supplier).filter(
                Supplier.supplier_code == record['supplier_code']
            ).first()
            
            if existing_supplier:
                error_count += 1
                continue
            
            supplier_type = None
            try:
                supplier_type = SupplierType(record['type'].upper())
            except (ValueError, KeyError):
                supplier_type = SupplierType.RAW_MATERIAL
            
            supplier_data = {
                'supplier_code': record['supplier_code'],
                'name': record['name'],
                'type': supplier_type,
                'status': SupplierStatus.ACTIVE
            }
            
            # Optional fields
            optional_fields = ['contact_person', 'email', 'phone', 'address', 'city', 'state', 'postal_code']
            for field in optional_fields:
                if field in record and pd.notna(record[field]):
                    supplier_data[field] = record[field]
            
            if 'halal_certified' in record and pd.notna(record['halal_certified']):
                supplier_data['halal_certified'] = str(record['halal_certified']).lower() in ['true', '1', 'yes']
            
            if 'is_preferred' in record and pd.notna(record['is_preferred']):
                supplier_data['is_preferred'] = str(record['is_preferred']).lower() in ['true', '1', 'yes']
            
            if 'quality_rating' in record and pd.notna(record['quality_rating']):
                supplier_data['quality_rating'] = record['quality_rating']
            
            supplier = Supplier(**supplier_data)
            db.add(supplier)
            success_count += 1
            
        except Exception as e:
            error_count += 1
    
    try:
        db.commit()
        logger.info(f"Suppliers import completed: {success_count} successful, {error_count} errors")
    except Exception as e:
        db.rollback()
        logger.error(f"Database commit failed during suppliers import: {str(e)}")


@router.post("/inventory/csv")
async def import_inventory_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_sop_leader_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Import inventory/stock data from CSV file."""
    
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be CSV or Excel format"
        )
    
    try:
        content = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        else:
            df = pd.read_excel(io.BytesIO(content))
        
        required_columns = ['product_code', 'location', 'quantity', 'unit_cost']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {missing_columns}"
            )
        
        background_tasks.add_task(
            _process_inventory_import,
            df.to_dict('records'),
            current_user.id,
            db
        )
        
        return {
            "message": f"Processing {len(df)} inventory records. Import started in background.",
            "total_records": len(df)
        }
        
    except Exception as e:
        logger.error(f"Error processing inventory import: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}"
        )


async def _process_inventory_import(records: List[Dict], user_id: int, db: Session):
    """Background task to process inventory import."""
    
    success_count = 0
    error_count = 0
    
    for idx, record in enumerate(records):
        try:
            # Find product by code
            product = db.query(Product).filter(
                Product.product_code == record['product_code']
            ).first()
            
            if not product:
                error_count += 1
                continue
            
            # Check if stock entry already exists
            lot_number = record.get('lot_number', f"IMPORT-{idx}")
            existing_stock = db.query(StockOnHand).filter(
                StockOnHand.product_id == product.id,
                StockOnHand.location == record['location'],
                StockOnHand.lot_number == lot_number
            ).first()
            
            if existing_stock:
                error_count += 1
                continue
            
            quantity = float(record['quantity'])
            unit_cost = float(record['unit_cost'])
            total_cost = quantity * unit_cost
            
            stock_data = {
                'product_id': product.id,
                'location': record['location'],
                'lot_number': lot_number,
                'quantity_available': quantity,
                'unit_cost': unit_cost,
                'total_cost': total_cost
            }
            
            # Optional fields
            if 'expiry_date' in record and pd.notna(record['expiry_date']):
                try:
                    stock_data['expiry_date'] = pd.to_datetime(record['expiry_date']).date()
                except:
                    pass  # Skip invalid dates
            
            if 'batch_number' in record and pd.notna(record['batch_number']):
                stock_data['batch_number'] = record['batch_number']
            
            stock = StockOnHand(**stock_data)
            db.add(stock)
            
            # Create stock movement record
            movement = StockMovement(
                product_id=product.id,
                movement_type=MovementType.STOCK_IN,
                quantity=quantity,
                unit_cost=unit_cost,
                total_cost=total_cost,
                location=record['location'],
                lot_number=lot_number,
                reference_number=f"IMPORT-{datetime.now().strftime('%Y%m%d')}-{idx}",
                notes=f"Initial stock import for {product.product_code}",
                movement_date=datetime.now(),
                status=MovementStatus.COMPLETED,
                created_by=user_id
            )
            db.add(movement)
            
            success_count += 1
            
        except Exception as e:
            error_count += 1
    
    try:
        db.commit()
        logger.info(f"Inventory import completed: {success_count} successful, {error_count} errors")
    except Exception as e:
        db.rollback()
        logger.error(f"Database commit failed during inventory import: {str(e)}")


@router.post("/sales/csv")
async def import_sales_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_sop_leader_or_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Import sales data from CSV file."""
    
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be CSV or Excel format"
        )
    
    try:
        content = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        else:
            df = pd.read_excel(io.BytesIO(content))
        
        required_columns = ['product_code', 'customer_code', 'sale_date', 'quantity', 'unit_price']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {missing_columns}"
            )
        
        background_tasks.add_task(
            _process_sales_import,
            df.to_dict('records'),
            current_user.id,
            db
        )
        
        return {
            "message": f"Processing {len(df)} sales records. Import started in background.",
            "total_records": len(df)
        }
        
    except Exception as e:
        logger.error(f"Error processing sales import: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}"
        )


async def _process_sales_import(records: List[Dict], user_id: int, db: Session):
    """Background task to process sales import."""
    
    success_count = 0
    error_count = 0
    
    for idx, record in enumerate(records):
        try:
            # Find product and customer by code
            product = db.query(Product).filter(
                Product.product_code == record['product_code']
            ).first()
            
            customer = db.query(Customer).filter(
                Customer.customer_code == record['customer_code']
            ).first()
            
            if not product or not customer:
                error_count += 1
                continue
            
            # Parse date
            try:
                sale_date = pd.to_datetime(record['sale_date']).date()
            except:
                error_count += 1
                continue
            
            quantity = float(record['quantity'])
            unit_price = float(record['unit_price'])
            total_amount = quantity * unit_price
            
            sales_data = {
                'product_id': product.id,
                'customer_id': customer.id,
                'sale_date': sale_date,
                'quantity_sold': quantity,
                'unit_price': unit_price,
                'total_amount': total_amount
            }
            
            # Optional fields
            if 'discount_amount' in record and pd.notna(record['discount_amount']):
                sales_data['discount_amount'] = float(record['discount_amount'])
                sales_data['net_amount'] = total_amount - float(record['discount_amount'])
            else:
                sales_data['net_amount'] = total_amount
            
            if 'invoice_number' in record and pd.notna(record['invoice_number']):
                sales_data['invoice_number'] = record['invoice_number']
            
            sales = SalesActual(**sales_data)
            db.add(sales)
            success_count += 1
            
        except Exception as e:
            error_count += 1
    
    try:
        db.commit()
        logger.info(f"Sales import completed: {success_count} successful, {error_count} errors")
    except Exception as e:
        db.rollback()
        logger.error(f"Database commit failed during sales import: {str(e)}")


@router.get("/templates/{data_type}")
async def get_import_template(
    data_type: str,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get CSV template for data import."""
    
    templates = {
        "products": {
            "columns": [
                "product_code", "name", "description", "category", "unit_of_measure",
                "selling_price", "cost_price", "reorder_level", "shelf_life_days",
                "is_perishable"
            ],
            "sample_data": [
                {
                    "product_code": "PRD001",
                    "name": "Sample Product",
                    "description": "Sample product description",
                    "category": "FINISHED_GOODS",
                    "unit_of_measure": "EACH",
                    "selling_price": 10.50,
                    "cost_price": 7.25,
                    "reorder_level": 50,
                    "shelf_life_days": 365,
                    "is_perishable": "false"
                }
            ]
        },
        "customers": {
            "columns": [
                "customer_code", "name", "type", "contact_person", "email", "phone",
                "address", "city", "state", "postal_code", "credit_limit_rm", "is_key_account"
            ],
            "sample_data": [
                {
                    "customer_code": "CUST001",
                    "name": "Sample Customer Sdn Bhd",
                    "type": "RETAILER",
                    "contact_person": "John Doe",
                    "email": "john@customer.com",
                    "phone": "+60123456789",
                    "address": "123 Main Street",
                    "city": "Kuala Lumpur",
                    "state": "Selangor",
                    "postal_code": "50000",
                    "credit_limit_rm": 50000.00,
                    "is_key_account": "true"
                }
            ]
        },
        "suppliers": {
            "columns": [
                "supplier_code", "name", "type", "contact_person", "email", "phone",
                "address", "city", "state", "postal_code", "halal_certified",
                "is_preferred", "quality_rating"
            ],
            "sample_data": [
                {
                    "supplier_code": "SUPP001",
                    "name": "Sample Supplier Sdn Bhd",
                    "type": "RAW_MATERIAL",
                    "contact_person": "Jane Smith",
                    "email": "jane@supplier.com",
                    "phone": "+60123456789",
                    "address": "456 Industrial Area",
                    "city": "Shah Alam",
                    "state": "Selangor",
                    "postal_code": "40000",
                    "halal_certified": "true",
                    "is_preferred": "true",
                    "quality_rating": "A"
                }
            ]
        },
        "inventory": {
            "columns": [
                "product_code", "location", "quantity", "unit_cost", "lot_number",
                "batch_number", "expiry_date"
            ],
            "sample_data": [
                {
                    "product_code": "PRD001",
                    "location": "WAREHOUSE-A",
                    "quantity": 100.0,
                    "unit_cost": 7.25,
                    "lot_number": "LOT001",
                    "batch_number": "BATCH001",
                    "expiry_date": "2024-12-31"
                }
            ]
        },
        "sales": {
            "columns": [
                "product_code", "customer_code", "sale_date", "quantity", "unit_price",
                "discount_amount", "invoice_number"
            ],
            "sample_data": [
                {
                    "product_code": "PRD001",
                    "customer_code": "CUST001",
                    "sale_date": "2024-01-15",
                    "quantity": 10.0,
                    "unit_price": 10.50,
                    "discount_amount": 5.00,
                    "invoice_number": "INV-2024-001"
                }
            ]
        }
    }
    
    if data_type not in templates:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template not found for data type: {data_type}"
        )
    
    return templates[data_type]


@router.get("/status/{import_id}")
async def get_import_status(
    import_id: str,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get status of data import operation."""
    
    # This would typically check a background job status
    # For now, return a mock response
    return {
        "import_id": import_id,
        "status": "completed",
        "total_records": 100,
        "successful_records": 95,
        "failed_records": 5,
        "errors": [
            "Row 12: Product code already exists",
            "Row 25: Invalid date format",
            "Row 67: Missing required field",
            "Row 88: Invalid enum value",
            "Row 91: Duplicate entry"
        ]
    }