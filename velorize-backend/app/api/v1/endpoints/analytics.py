from typing import Any, List, Dict, Optional, Tuple
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from datetime import datetime, date, timedelta
import numpy as np
import pandas as pd
from collections import defaultdict
import math

from app.core.deps import get_db, get_current_verified_user, get_sop_leader_or_admin
from app.models.user import User
from app.models.product import Product
from app.models.sales import SalesActual
from app.models.inventory import StockOnHand, StockMovement, MovementType
from app.models.forecast import DemandForecast

router = APIRouter()


@router.get("/abc-analysis")
def get_abc_analysis(
    *,
    db: Session = Depends(get_db),
    analysis_period_days: int = Query(365, description="Number of days for analysis"),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Perform ABC analysis based on sales revenue."""
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=analysis_period_days)
    
    # Get sales data for the period
    sales_data = db.query(
        SalesActual.product_id,
        func.sum(SalesActual.net_amount).label('total_revenue'),
        func.sum(SalesActual.quantity_sold).label('total_quantity')
    ).filter(
        SalesActual.sale_date.between(start_date, end_date)
    ).group_by(SalesActual.product_id).all()
    
    if not sales_data:
        return {
            "analysis_period": {"start_date": start_date.isoformat(), "end_date": end_date.isoformat()},
            "total_products": 0,
            "abc_breakdown": {"A": 0, "B": 0, "C": 0},
            "products": []
        }
    
    # Calculate cumulative revenue and percentages
    total_revenue = sum(item.total_revenue for item in sales_data)
    
    # Sort by revenue descending
    sorted_sales = sorted(sales_data, key=lambda x: x.total_revenue, reverse=True)
    
    # Calculate ABC classification
    abc_results = []
    cumulative_revenue = 0
    
    for i, item in enumerate(sorted_sales):
        cumulative_revenue += item.total_revenue
        cumulative_percentage = (cumulative_revenue / total_revenue) * 100
        revenue_percentage = (item.total_revenue / total_revenue) * 100
        
        # ABC Classification rules:
        # A items: Top 20% of items contributing to 80% of revenue
        # B items: Next 30% of items contributing to 15% of revenue
        # C items: Remaining 50% of items contributing to 5% of revenue
        if cumulative_percentage <= 80:
            abc_class = 'A'
        elif cumulative_percentage <= 95:
            abc_class = 'B'
        else:
            abc_class = 'C'
        
        # Get product details
        product = db.query(Product).filter(Product.id == item.product_id).first()
        
        abc_results.append({
            "product_id": item.product_id,
            "product_code": product.product_code if product else f"PROD-{item.product_id}",
            "product_name": product.name if product else "Unknown Product",
            "total_revenue": float(item.total_revenue),
            "total_quantity": float(item.total_quantity),
            "revenue_percentage": round(revenue_percentage, 2),
            "cumulative_percentage": round(cumulative_percentage, 2),
            "abc_class": abc_class,
            "rank": i + 1
        })
    
    # Count by ABC class
    abc_counts = {"A": 0, "B": 0, "C": 0}
    for item in abc_results:
        abc_counts[item["abc_class"]] += 1
    
    return {
        "analysis_period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": analysis_period_days
        },
        "total_revenue": float(total_revenue),
        "total_products": len(abc_results),
        "abc_breakdown": abc_counts,
        "abc_thresholds": {
            "A_items": "Top items contributing to 80% of revenue",
            "B_items": "Medium items contributing to 15% of revenue",
            "C_items": "Remaining items contributing to 5% of revenue"
        },
        "products": abc_results
    }


@router.get("/xyz-analysis")
def get_xyz_analysis(
    *,
    db: Session = Depends(get_db),
    analysis_period_days: int = Query(365, description="Number of days for analysis"),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Perform XYZ analysis based on demand variability."""
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=analysis_period_days)
    
    # Get daily sales data for coefficient of variation calculation
    daily_sales = db.query(
        SalesActual.product_id,
        SalesActual.sale_date,
        func.sum(SalesActual.quantity_sold).label('daily_quantity')
    ).filter(
        SalesActual.sale_date.between(start_date, end_date)
    ).group_by(
        SalesActual.product_id, 
        SalesActual.sale_date
    ).all()
    
    if not daily_sales:
        return {
            "analysis_period": {"start_date": start_date.isoformat(), "end_date": end_date.isoformat()},
            "total_products": 0,
            "xyz_breakdown": {"X": 0, "Y": 0, "Z": 0},
            "products": []
        }
    
    # Group by product and calculate variability
    product_sales = defaultdict(list)
    for sale in daily_sales:
        product_sales[sale.product_id].append(float(sale.daily_quantity))
    
    xyz_results = []
    
    for product_id, quantities in product_sales.items():
        if len(quantities) < 2:  # Need at least 2 data points for variance
            continue
        
        # Calculate coefficient of variation
        mean_demand = np.mean(quantities)
        std_demand = np.std(quantities, ddof=1)  # Sample standard deviation
        
        if mean_demand > 0:
            cv = (std_demand / mean_demand) * 100
        else:
            cv = 0
        
        # XYZ Classification based on coefficient of variation:
        # X items: CV < 20% (very predictable)
        # Y items: CV 20-50% (moderately predictable)
        # Z items: CV > 50% (unpredictable)
        if cv < 20:
            xyz_class = 'X'
        elif cv <= 50:
            xyz_class = 'Y'
        else:
            xyz_class = 'Z'
        
        # Get product details
        product = db.query(Product).filter(Product.id == product_id).first()
        
        # Calculate additional metrics
        total_demand = sum(quantities)
        max_demand = max(quantities)
        min_demand = min(quantities)
        
        xyz_results.append({
            "product_id": product_id,
            "product_code": product.product_code if product else f"PROD-{product_id}",
            "product_name": product.name if product else "Unknown Product",
            "mean_daily_demand": round(mean_demand, 2),
            "std_deviation": round(std_demand, 2),
            "coefficient_of_variation": round(cv, 2),
            "total_demand": float(total_demand),
            "max_daily_demand": float(max_demand),
            "min_daily_demand": float(min_demand),
            "data_points": len(quantities),
            "xyz_class": xyz_class
        })
    
    # Sort by coefficient of variation
    xyz_results.sort(key=lambda x: x["coefficient_of_variation"])
    
    # Count by XYZ class
    xyz_counts = {"X": 0, "Y": 0, "Z": 0}
    for item in xyz_results:
        xyz_counts[item["xyz_class"]] += 1
    
    return {
        "analysis_period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": analysis_period_days
        },
        "total_products": len(xyz_results),
        "xyz_breakdown": xyz_counts,
        "xyz_thresholds": {
            "X_items": "CV < 20% (Very predictable demand)",
            "Y_items": "CV 20-50% (Moderately predictable demand)",
            "Z_items": "CV > 50% (Unpredictable demand)"
        },
        "products": xyz_results
    }


@router.get("/abc-xyz-matrix")
def get_abc_xyz_matrix(
    *,
    db: Session = Depends(get_db),
    analysis_period_days: int = Query(365, description="Number of days for analysis"),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Combine ABC and XYZ analysis into a 9-cell matrix."""
    
    # Get ABC analysis
    abc_data = get_abc_analysis(db=db, analysis_period_days=analysis_period_days, current_user=current_user)
    
    # Get XYZ analysis
    xyz_data = get_xyz_analysis(db=db, analysis_period_days=analysis_period_days, current_user=current_user)
    
    # Create lookup dictionaries
    abc_lookup = {item["product_id"]: item["abc_class"] for item in abc_data["products"]}
    xyz_lookup = {item["product_id"]: item for item in xyz_data["products"]}
    
    # Combine the analyses
    matrix_results = []
    matrix_counts = {
        "AX": 0, "AY": 0, "AZ": 0,
        "BX": 0, "BY": 0, "BZ": 0,
        "CX": 0, "CY": 0, "CZ": 0
    }
    
    for abc_item in abc_data["products"]:
        product_id = abc_item["product_id"]
        
        if product_id in xyz_lookup:
            xyz_item = xyz_lookup[product_id]
            abc_class = abc_item["abc_class"]
            xyz_class = xyz_item["xyz_class"]
            matrix_class = f"{abc_class}{xyz_class}"
            
            matrix_counts[matrix_class] += 1
            
            # Determine inventory strategy
            strategy = _get_inventory_strategy(abc_class, xyz_class)
            
            matrix_results.append({
                "product_id": product_id,
                "product_code": abc_item["product_code"],
                "product_name": abc_item["product_name"],
                "abc_class": abc_class,
                "xyz_class": xyz_class,
                "matrix_class": matrix_class,
                "total_revenue": abc_item["total_revenue"],
                "revenue_percentage": abc_item["revenue_percentage"],
                "coefficient_of_variation": xyz_item["coefficient_of_variation"],
                "mean_daily_demand": xyz_item["mean_daily_demand"],
                "inventory_strategy": strategy,
                "priority_level": _get_priority_level(abc_class, xyz_class)
            })
    
    return {
        "analysis_period": abc_data["analysis_period"],
        "total_products": len(matrix_results),
        "matrix_breakdown": matrix_counts,
        "strategy_recommendations": {
            "AX": "High value, predictable - Optimize inventory levels, frequent monitoring",
            "AY": "High value, moderate variability - Safety stock with regular review",
            "AZ": "High value, unpredictable - Higher safety stock, close monitoring",
            "BX": "Medium value, predictable - Standard inventory policies",
            "BY": "Medium value, moderate variability - Moderate safety stock",
            "BZ": "Medium value, unpredictable - Flexible inventory management",
            "CX": "Low value, predictable - Minimal inventory, lean management",
            "CY": "Low value, moderate variability - Low safety stock",
            "CZ": "Low value, unpredictable - Consider discontinuation or minimal stock"
        },
        "products": matrix_results
    }


def _get_inventory_strategy(abc_class: str, xyz_class: str) -> str:
    """Determine inventory management strategy based on ABC-XYZ classification."""
    strategies = {
        "AX": "Tight control with frequent monitoring and optimization",
        "AY": "Good control with regular review and safety stock",
        "AZ": "Intensive control with high safety stock and close monitoring",
        "BX": "Standard control with periodic review",
        "BY": "Normal control with moderate safety stock",
        "BZ": "Flexible control with responsive inventory management",
        "CX": "Simple control with minimal inventory",
        "CY": "Basic control with low safety stock",
        "CZ": "Minimal control or consider discontinuation"
    }
    return strategies.get(f"{abc_class}{xyz_class}", "Standard control")


def _get_priority_level(abc_class: str, xyz_class: str) -> int:
    """Assign priority level (1-9) based on ABC-XYZ classification."""
    priority_matrix = {
        "AX": 1, "AY": 2, "AZ": 3,
        "BX": 4, "BY": 5, "BZ": 6,
        "CX": 7, "CY": 8, "CZ": 9
    }
    return priority_matrix.get(f"{abc_class}{xyz_class}", 5)


@router.get("/seasonal-analysis")
def get_seasonal_analysis(
    *,
    db: Session = Depends(get_db),
    product_id: Optional[int] = Query(None, description="Analyze specific product"),
    analysis_period_months: int = Query(12, description="Number of months for analysis"),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Analyze seasonal patterns in sales data."""
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=analysis_period_months * 30)
    
    # Base query
    query = db.query(
        SalesActual.product_id,
        func.extract('year', SalesActual.sale_date).label('year'),
        func.extract('month', SalesActual.sale_date).label('month'),
        func.sum(SalesActual.quantity_sold).label('monthly_quantity'),
        func.sum(SalesActual.net_amount).label('monthly_revenue')
    ).filter(
        SalesActual.sale_date.between(start_date, end_date)
    )
    
    # Filter by product if specified
    if product_id:
        query = query.filter(SalesActual.product_id == product_id)
    
    sales_data = query.group_by(
        SalesActual.product_id,
        func.extract('year', SalesActual.sale_date),
        func.extract('month', SalesActual.sale_date)
    ).all()
    
    if not sales_data:
        return {
            "analysis_period": {"start_date": start_date.isoformat(), "end_date": end_date.isoformat()},
            "seasonal_patterns": []
        }
    
    # Group by product
    product_patterns = defaultdict(lambda: defaultdict(list))
    
    for record in sales_data:
        product_patterns[record.product_id][int(record.month)].append({
            'year': int(record.year),
            'quantity': float(record.monthly_quantity),
            'revenue': float(record.monthly_revenue)
        })
    
    seasonal_results = []
    
    for product_id, monthly_data in product_patterns.items():
        # Calculate average quantities and revenues by month
        monthly_averages = {}
        seasonal_indices = {}
        
        total_avg_quantity = 0
        total_avg_revenue = 0
        months_with_data = 0
        
        for month in range(1, 13):
            if month in monthly_data:
                avg_quantity = np.mean([data['quantity'] for data in monthly_data[month]])
                avg_revenue = np.mean([data['revenue'] for data in monthly_data[month]])
                
                monthly_averages[month] = {
                    'avg_quantity': avg_quantity,
                    'avg_revenue': avg_revenue,
                    'data_points': len(monthly_data[month])
                }
                
                total_avg_quantity += avg_quantity
                total_avg_revenue += avg_revenue
                months_with_data += 1
        
        if months_with_data == 0:
            continue
        
        # Calculate overall averages
        overall_avg_quantity = total_avg_quantity / months_with_data
        overall_avg_revenue = total_avg_revenue / months_with_data
        
        # Calculate seasonal indices (month average / overall average)
        monthly_patterns = []
        for month in range(1, 13):
            month_name = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ][month - 1]
            
            if month in monthly_averages:
                quantity_index = (monthly_averages[month]['avg_quantity'] / overall_avg_quantity) * 100
                revenue_index = (monthly_averages[month]['avg_revenue'] / overall_avg_revenue) * 100
            else:
                quantity_index = 0
                revenue_index = 0
            
            monthly_patterns.append({
                "month": month,
                "month_name": month_name,
                "avg_quantity": monthly_averages.get(month, {}).get('avg_quantity', 0),
                "avg_revenue": monthly_averages.get(month, {}).get('avg_revenue', 0),
                "quantity_index": round(quantity_index, 1),
                "revenue_index": round(revenue_index, 1),
                "data_points": monthly_averages.get(month, {}).get('data_points', 0)
            })
        
        # Determine seasonality characteristics
        quantity_indices = [p["quantity_index"] for p in monthly_patterns if p["data_points"] > 0]
        if quantity_indices:
            cv_seasonality = (np.std(quantity_indices) / np.mean(quantity_indices)) * 100
            peak_month = max(monthly_patterns, key=lambda x: x["quantity_index"])["month_name"]
            low_month = min(monthly_patterns, key=lambda x: x["quantity_index"] if x["data_points"] > 0 else float('inf'))["month_name"]
        else:
            cv_seasonality = 0
            peak_month = "Unknown"
            low_month = "Unknown"
        
        # Get product details
        product = db.query(Product).filter(Product.id == product_id).first()
        
        seasonal_results.append({
            "product_id": product_id,
            "product_code": product.product_code if product else f"PROD-{product_id}",
            "product_name": product.name if product else "Unknown Product",
            "seasonality_coefficient": round(cv_seasonality, 2),
            "peak_season_month": peak_month,
            "low_season_month": low_month,
            "overall_avg_monthly_quantity": round(overall_avg_quantity, 2),
            "overall_avg_monthly_revenue": round(overall_avg_revenue, 2),
            "monthly_patterns": monthly_patterns
        })
    
    return {
        "analysis_period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "months": analysis_period_months
        },
        "seasonal_patterns": seasonal_results
    }


@router.get("/velocity-analysis")
def get_velocity_analysis(
    *,
    db: Session = Depends(get_db),
    analysis_period_days: int = Query(90, description="Number of days for velocity analysis"),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Analyze inventory velocity (turnover rate)."""
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=analysis_period_days)
    
    # Get sales data for the period
    sales_query = db.query(
        SalesActual.product_id,
        func.sum(SalesActual.quantity_sold).label('total_sold')
    ).filter(
        SalesActual.sale_date.between(start_date, end_date)
    ).group_by(SalesActual.product_id)
    
    # Get current stock levels
    stock_query = db.query(
        StockOnHand.product_id,
        func.sum(StockOnHand.quantity_available).label('current_stock')
    ).group_by(StockOnHand.product_id)
    
    # Get average stock levels from movements
    movements_query = db.query(
        StockMovement.product_id,
        func.avg(StockMovement.quantity).label('avg_movement_quantity')
    ).filter(
        StockMovement.movement_date.between(start_date, end_date),
        StockMovement.movement_type.in_([MovementType.STOCK_IN, MovementType.STOCK_OUT])
    ).group_by(StockMovement.product_id)
    
    sales_data = {item.product_id: float(item.total_sold) for item in sales_query.all()}
    stock_data = {item.product_id: float(item.current_stock) for item in stock_query.all()}
    movement_data = {item.product_id: float(item.avg_movement_quantity) for item in movements_query.all()}
    
    velocity_results = []
    
    # Get all products that have sales or stock
    all_product_ids = set(sales_data.keys()) | set(stock_data.keys())
    
    for product_id in all_product_ids:
        total_sold = sales_data.get(product_id, 0)
        current_stock = stock_data.get(product_id, 0)
        avg_movement = movement_data.get(product_id, 0)
        
        # Calculate velocity metrics
        if current_stock > 0:
            turnover_ratio = total_sold / current_stock
            days_of_supply = (current_stock / (total_sold / analysis_period_days)) if total_sold > 0 else float('inf')
        else:
            turnover_ratio = float('inf') if total_sold > 0 else 0
            days_of_supply = 0
        
        # Calculate velocity classification
        # Fast: High turnover (>4 times per period), low days of supply (<30)
        # Medium: Moderate turnover (1-4 times), medium days of supply (30-90)
        # Slow: Low turnover (<1 time), high days of supply (>90)
        if turnover_ratio > 4 and days_of_supply < 30:
            velocity_class = "Fast"
        elif turnover_ratio >= 1 and days_of_supply <= 90:
            velocity_class = "Medium"
        else:
            velocity_class = "Slow"
        
        # Get product details
        product = db.query(Product).filter(Product.id == product_id).first()
        
        velocity_results.append({
            "product_id": product_id,
            "product_code": product.product_code if product else f"PROD-{product_id}",
            "product_name": product.name if product else "Unknown Product",
            "total_sold_period": total_sold,
            "current_stock": current_stock,
            "turnover_ratio": round(turnover_ratio if turnover_ratio != float('inf') else 0, 2),
            "days_of_supply": round(days_of_supply if days_of_supply != float('inf') else 0, 1),
            "velocity_class": velocity_class,
            "avg_daily_sales": round(total_sold / analysis_period_days, 2),
            "stock_to_sales_ratio": round(current_stock / total_sold, 2) if total_sold > 0 else float('inf')
        })
    
    # Sort by turnover ratio descending
    velocity_results.sort(key=lambda x: x["turnover_ratio"], reverse=True)
    
    # Count by velocity class
    velocity_counts = {"Fast": 0, "Medium": 0, "Slow": 0}
    for item in velocity_results:
        velocity_counts[item["velocity_class"]] += 1
    
    return {
        "analysis_period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": analysis_period_days
        },
        "total_products": len(velocity_results),
        "velocity_breakdown": velocity_counts,
        "velocity_thresholds": {
            "Fast": "Turnover > 4x, Days of supply < 30",
            "Medium": "Turnover 1-4x, Days of supply 30-90",
            "Slow": "Turnover < 1x, Days of supply > 90"
        },
        "products": velocity_results
    }


@router.get("/profitability-analysis")
def get_profitability_analysis(
    *,
    db: Session = Depends(get_db),
    analysis_period_days: int = Query(365, description="Number of days for analysis"),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Analyze product profitability."""
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=analysis_period_days)
    
    # Get sales and cost data
    sales_data = db.query(
        SalesActual.product_id,
        func.sum(SalesActual.quantity_sold).label('total_quantity'),
        func.sum(SalesActual.net_amount).label('total_revenue'),
        func.avg(SalesActual.unit_price).label('avg_selling_price')
    ).filter(
        SalesActual.sale_date.between(start_date, end_date)
    ).group_by(SalesActual.product_id).all()
    
    profitability_results = []
    
    for sales_record in sales_data:
        product = db.query(Product).filter(Product.id == sales_record.product_id).first()
        
        if not product:
            continue
        
        total_revenue = float(sales_record.total_revenue)
        total_quantity = float(sales_record.total_quantity)
        avg_selling_price = float(sales_record.avg_selling_price)
        
        # Calculate cost and profit metrics
        cost_price = float(product.cost_price or 0)
        total_cost = total_quantity * cost_price
        gross_profit = total_revenue - total_cost
        
        if total_revenue > 0:
            gross_margin_percentage = (gross_profit / total_revenue) * 100
        else:
            gross_margin_percentage = 0
        
        if cost_price > 0:
            markup_percentage = ((avg_selling_price - cost_price) / cost_price) * 100
        else:
            markup_percentage = 0
        
        # Calculate contribution per unit
        unit_profit = avg_selling_price - cost_price
        
        # Profitability classification
        if gross_margin_percentage >= 30:
            profitability_class = "High"
        elif gross_margin_percentage >= 15:
            profitability_class = "Medium"
        else:
            profitability_class = "Low"
        
        profitability_results.append({
            "product_id": sales_record.product_id,
            "product_code": product.product_code,
            "product_name": product.name,
            "total_quantity_sold": total_quantity,
            "total_revenue": total_revenue,
            "total_cost": total_cost,
            "gross_profit": gross_profit,
            "gross_margin_percentage": round(gross_margin_percentage, 2),
            "avg_selling_price": avg_selling_price,
            "cost_price": cost_price,
            "unit_profit": round(unit_profit, 2),
            "markup_percentage": round(markup_percentage, 2),
            "profitability_class": profitability_class
        })
    
    # Sort by gross profit descending
    profitability_results.sort(key=lambda x: x["gross_profit"], reverse=True)
    
    # Calculate summary statistics
    total_revenue = sum(item["total_revenue"] for item in profitability_results)
    total_profit = sum(item["gross_profit"] for item in profitability_results)
    overall_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0
    
    # Count by profitability class
    profit_counts = {"High": 0, "Medium": 0, "Low": 0}
    for item in profitability_results:
        profit_counts[item["profitability_class"]] += 1
    
    return {
        "analysis_period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": analysis_period_days
        },
        "summary": {
            "total_revenue": round(total_revenue, 2),
            "total_gross_profit": round(total_profit, 2),
            "overall_margin_percentage": round(overall_margin, 2),
            "total_products": len(profitability_results)
        },
        "profitability_breakdown": profit_counts,
        "profitability_thresholds": {
            "High": "Gross margin >= 30%",
            "Medium": "Gross margin 15-30%",
            "Low": "Gross margin < 15%"
        },
        "products": profitability_results
    }