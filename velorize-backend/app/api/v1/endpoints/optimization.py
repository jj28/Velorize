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
from app.models.forecast import DemandForecast, ForecastStatus
from app.models.supplier import Supplier

router = APIRouter()


class InventoryOptimizer:
    """Inventory optimization algorithms and calculations."""
    
    @staticmethod
    def calculate_eoq(annual_demand: float, ordering_cost: float, holding_cost: float) -> Dict[str, float]:
        """Calculate Economic Order Quantity (EOQ)."""
        if holding_cost <= 0 or ordering_cost <= 0 or annual_demand <= 0:
            return {
                'eoq': 0,
                'total_cost': 0,
                'ordering_cost': 0,
                'holding_cost': 0,
                'orders_per_year': 0
            }
        
        # EOQ formula: sqrt((2 * D * S) / H)
        # D = Annual demand, S = Ordering cost, H = Holding cost per unit per year
        eoq = math.sqrt((2 * annual_demand * ordering_cost) / holding_cost)
        
        # Calculate costs
        orders_per_year = annual_demand / eoq
        annual_ordering_cost = orders_per_year * ordering_cost
        annual_holding_cost = (eoq / 2) * holding_cost
        total_annual_cost = annual_ordering_cost + annual_holding_cost
        
        return {
            'eoq': round(eoq, 2),
            'total_cost': round(total_annual_cost, 2),
            'ordering_cost': round(annual_ordering_cost, 2),
            'holding_cost': round(annual_holding_cost, 2),
            'orders_per_year': round(orders_per_year, 2)
        }
    
    @staticmethod
    def calculate_reorder_point(
        lead_time_days: int,
        daily_demand: float,
        demand_std: float,
        service_level: float = 0.95
    ) -> Dict[str, float]:
        """Calculate reorder point with safety stock."""
        
        # Z-score for given service level
        z_scores = {
            0.90: 1.28,
            0.95: 1.65,
            0.97: 1.88,
            0.99: 2.33
        }
        z_score = z_scores.get(service_level, 1.65)
        
        # Average demand during lead time
        lead_time_demand = daily_demand * lead_time_days
        
        # Safety stock calculation
        # SS = Z * σ * sqrt(LT)
        safety_stock = z_score * demand_std * math.sqrt(lead_time_days)
        
        # Reorder point = Lead time demand + Safety stock
        reorder_point = lead_time_demand + safety_stock
        
        return {
            'reorder_point': round(reorder_point, 2),
            'lead_time_demand': round(lead_time_demand, 2),
            'safety_stock': round(safety_stock, 2),
            'service_level': service_level,
            'z_score': z_score
        }
    
    @staticmethod
    def calculate_abc_xyz_strategy(
        abc_class: str,
        xyz_class: str,
        current_stock: float,
        reorder_point: float,
        eoq: float
    ) -> Dict[str, Any]:
        """Calculate inventory strategy based on ABC-XYZ classification."""
        
        strategy_matrix = {
            'AX': {
                'max_stock_multiplier': 1.5,
                'safety_stock_multiplier': 1.2,
                'review_frequency_days': 7,
                'priority': 1
            },
            'AY': {
                'max_stock_multiplier': 2.0,
                'safety_stock_multiplier': 1.5,
                'review_frequency_days': 14,
                'priority': 2
            },
            'AZ': {
                'max_stock_multiplier': 3.0,
                'safety_stock_multiplier': 2.0,
                'review_frequency_days': 7,
                'priority': 3
            },
            'BX': {
                'max_stock_multiplier': 1.8,
                'safety_stock_multiplier': 1.3,
                'review_frequency_days': 14,
                'priority': 4
            },
            'BY': {
                'max_stock_multiplier': 2.5,
                'safety_stock_multiplier': 1.8,
                'review_frequency_days': 21,
                'priority': 5
            },
            'BZ': {
                'max_stock_multiplier': 3.5,
                'safety_stock_multiplier': 2.5,
                'review_frequency_days': 14,
                'priority': 6
            },
            'CX': {
                'max_stock_multiplier': 2.0,
                'safety_stock_multiplier': 1.0,
                'review_frequency_days': 30,
                'priority': 7
            },
            'CY': {
                'max_stock_multiplier': 3.0,
                'safety_stock_multiplier': 1.5,
                'review_frequency_days': 45,
                'priority': 8
            },
            'CZ': {
                'max_stock_multiplier': 4.0,
                'safety_stock_multiplier': 2.0,
                'review_frequency_days': 60,
                'priority': 9
            }
        }
        
        matrix_key = f"{abc_class}{xyz_class}"
        strategy = strategy_matrix.get(matrix_key, strategy_matrix['BY'])  # Default to BY
        
        # Calculate recommended stock levels
        max_stock = reorder_point + (eoq * strategy['max_stock_multiplier'])
        min_stock = reorder_point * 0.5  # Minimum stock is 50% of reorder point
        
        # Current stock status
        if current_stock <= min_stock:
            stock_status = 'CRITICAL'
        elif current_stock <= reorder_point:
            stock_status = 'LOW'
        elif current_stock <= max_stock:
            stock_status = 'OPTIMAL'
        else:
            stock_status = 'EXCESS'
        
        return {
            'recommended_min_stock': round(min_stock, 2),
            'recommended_max_stock': round(max_stock, 2),
            'recommended_order_quantity': round(eoq, 2),
            'current_stock_status': stock_status,
            'review_frequency_days': strategy['review_frequency_days'],
            'priority_level': strategy['priority'],
            'strategy_notes': f"ABC-XYZ class {matrix_key} strategy"
        }


@router.get("/eoq-analysis")
def get_eoq_analysis(
    *,
    db: Session = Depends(get_db),
    product_id: Optional[int] = Query(None, description="Specific product ID"),
    analysis_period_days: int = Query(365, description="Period for demand analysis"),
    ordering_cost: float = Query(100.0, description="Cost per order (RM)"),
    holding_cost_percentage: float = Query(20.0, description="Holding cost as % of item value per year"),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Calculate Economic Order Quantity (EOQ) for products."""
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=analysis_period_days)
    
    # Base query for sales data
    sales_query = db.query(
        SalesActual.product_id,
        func.sum(SalesActual.quantity_sold).label('total_demand'),
        func.avg(SalesActual.unit_price).label('avg_price')
    ).filter(
        SalesActual.sale_date.between(start_date, end_date)
    ).group_by(SalesActual.product_id)
    
    if product_id:
        sales_query = sales_query.filter(SalesActual.product_id == product_id)
    
    sales_data = sales_query.all()
    
    if not sales_data:
        return {
            "analysis_period": {"start_date": start_date.isoformat(), "end_date": end_date.isoformat()},
            "parameters": {"ordering_cost": ordering_cost, "holding_cost_percentage": holding_cost_percentage},
            "products": []
        }
    
    optimizer = InventoryOptimizer()
    eoq_results = []
    
    for sales_record in sales_data:
        product = db.query(Product).filter(Product.id == sales_record.product_id).first()
        
        if not product:
            continue
        
        # Calculate annual demand
        days_in_period = (end_date - start_date).days
        annual_demand = float(sales_record.total_demand) * (365 / days_in_period)
        
        # Calculate holding cost per unit
        avg_unit_value = float(sales_record.avg_price or product.cost_price or 0)
        holding_cost_per_unit = avg_unit_value * (holding_cost_percentage / 100)
        
        # Calculate EOQ
        eoq_analysis = optimizer.calculate_eoq(
            annual_demand=annual_demand,
            ordering_cost=ordering_cost,
            holding_cost=holding_cost_per_unit
        )
        
        # Get current stock
        current_stock = db.query(
            func.sum(StockOnHand.quantity_available)
        ).filter(
            StockOnHand.product_id == sales_record.product_id
        ).scalar() or 0
        
        # Calculate current performance metrics
        if eoq_analysis['eoq'] > 0:
            current_orders_per_year = annual_demand / current_stock if current_stock > 0 else 0
            current_ordering_cost = current_orders_per_year * ordering_cost
            current_holding_cost = (current_stock / 2) * holding_cost_per_unit
            current_total_cost = current_ordering_cost + current_holding_cost
            
            potential_savings = current_total_cost - eoq_analysis['total_cost']
            savings_percentage = (potential_savings / current_total_cost * 100) if current_total_cost > 0 else 0
        else:
            potential_savings = 0
            savings_percentage = 0
        
        eoq_results.append({
            "product_id": sales_record.product_id,
            "product_code": product.product_code,
            "product_name": product.name,
            "annual_demand": round(annual_demand, 2),
            "avg_unit_value": round(avg_unit_value, 2),
            "holding_cost_per_unit": round(holding_cost_per_unit, 2),
            "current_stock": round(float(current_stock), 2),
            "eoq_analysis": eoq_analysis,
            "current_total_cost": round(current_total_cost, 2) if 'current_total_cost' in locals() else 0,
            "potential_annual_savings": round(potential_savings, 2),
            "savings_percentage": round(savings_percentage, 2)
        })
    
    # Sort by potential savings
    eoq_results.sort(key=lambda x: x["potential_annual_savings"], reverse=True)
    
    return {
        "analysis_period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": analysis_period_days
        },
        "parameters": {
            "ordering_cost_rm": ordering_cost,
            "holding_cost_percentage": holding_cost_percentage
        },
        "summary": {
            "total_products": len(eoq_results),
            "total_potential_savings": round(sum(r["potential_annual_savings"] for r in eoq_results), 2)
        },
        "products": eoq_results
    }


@router.get("/reorder-points")
def calculate_reorder_points(
    *,
    db: Session = Depends(get_db),
    product_id: Optional[int] = Query(None, description="Specific product ID"),
    lead_time_days: int = Query(7, description="Default lead time in days"),
    service_level: float = Query(0.95, description="Desired service level (0.90-0.99)"),
    analysis_period_days: int = Query(180, description="Period for demand analysis"),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Calculate optimal reorder points with safety stock."""
    
    if service_level < 0.90 or service_level > 0.99:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Service level must be between 0.90 and 0.99"
        )
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=analysis_period_days)
    
    # Get daily sales data for demand variability analysis
    daily_sales_query = db.query(
        SalesActual.product_id,
        SalesActual.sale_date,
        func.sum(SalesActual.quantity_sold).label('daily_quantity')
    ).filter(
        SalesActual.sale_date.between(start_date, end_date)
    ).group_by(
        SalesActual.product_id,
        SalesActual.sale_date
    )
    
    if product_id:
        daily_sales_query = daily_sales_query.filter(SalesActual.product_id == product_id)
    
    daily_sales = daily_sales_query.all()
    
    # Group by product
    product_daily_sales = defaultdict(list)
    for sale in daily_sales:
        product_daily_sales[sale.product_id].append(float(sale.daily_quantity))
    
    optimizer = InventoryOptimizer()
    reorder_results = []
    
    for product_id, daily_quantities in product_daily_sales.items():
        product = db.query(Product).filter(Product.id == product_id).first()
        
        if not product or len(daily_quantities) < 7:  # Need at least a week of data
            continue
        
        # Calculate demand statistics
        daily_demand = np.mean(daily_quantities)
        demand_std = np.std(daily_quantities, ddof=1)
        
        # Get supplier lead time or use default
        # You could join with supplier data here if available
        effective_lead_time = lead_time_days
        
        # Calculate reorder point
        reorder_analysis = optimizer.calculate_reorder_point(
            lead_time_days=effective_lead_time,
            daily_demand=daily_demand,
            demand_std=demand_std,
            service_level=service_level
        )
        
        # Get current stock and reorder level
        current_stock = db.query(
            func.sum(StockOnHand.quantity_available)
        ).filter(
            StockOnHand.product_id == product_id
        ).scalar() or 0
        
        current_reorder_level = float(product.reorder_level or 0)
        
        # Calculate stock status and recommendations
        if current_stock <= reorder_analysis['reorder_point']:
            stock_status = 'REORDER_NOW'
            action_needed = f"Order immediately - below reorder point"
        elif current_stock <= reorder_analysis['reorder_point'] * 1.2:
            stock_status = 'MONITOR'
            action_needed = "Monitor closely - approaching reorder point"
        else:
            stock_status = 'ADEQUATE'
            action_needed = "No immediate action needed"
        
        # Calculate days of supply
        days_of_supply = current_stock / daily_demand if daily_demand > 0 else 0
        
        reorder_results.append({
            "product_id": product_id,
            "product_code": product.product_code,
            "product_name": product.name,
            "demand_statistics": {
                "daily_demand_avg": round(daily_demand, 2),
                "demand_std_dev": round(demand_std, 2),
                "coefficient_of_variation": round((demand_std / daily_demand * 100), 2) if daily_demand > 0 else 0,
                "data_points": len(daily_quantities)
            },
            "reorder_analysis": reorder_analysis,
            "current_situation": {
                "current_stock": round(float(current_stock), 2),
                "current_reorder_level": current_reorder_level,
                "days_of_supply": round(days_of_supply, 1),
                "stock_status": stock_status,
                "action_needed": action_needed
            },
            "recommendations": {
                "update_reorder_level": reorder_analysis['reorder_point'] != current_reorder_level,
                "recommended_reorder_level": reorder_analysis['reorder_point'],
                "reorder_level_change": round(reorder_analysis['reorder_point'] - current_reorder_level, 2)
            }
        })
    
    # Sort by priority (reorder now first, then by days of supply)
    reorder_results.sort(key=lambda x: (
        0 if x["current_situation"]["stock_status"] == "REORDER_NOW" else
        1 if x["current_situation"]["stock_status"] == "MONITOR" else 2,
        x["current_situation"]["days_of_supply"]
    ))
    
    return {
        "analysis_period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": analysis_period_days
        },
        "parameters": {
            "default_lead_time_days": lead_time_days,
            "service_level": service_level
        },
        "summary": {
            "total_products": len(reorder_results),
            "reorder_now": len([r for r in reorder_results if r["current_situation"]["stock_status"] == "REORDER_NOW"]),
            "monitor": len([r for r in reorder_results if r["current_situation"]["stock_status"] == "MONITOR"]),
            "adequate": len([r for r in reorder_results if r["current_situation"]["stock_status"] == "ADEQUATE"])
        },
        "products": reorder_results
    }


@router.get("/abc-xyz-optimization")
def get_abc_xyz_optimization(
    *,
    db: Session = Depends(get_db),
    analysis_period_days: int = Query(365, description="Period for ABC-XYZ analysis"),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get inventory optimization recommendations based on ABC-XYZ analysis."""
    
    # This would typically call the analytics endpoints to get ABC and XYZ data
    # For now, we'll simulate the integration
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=analysis_period_days)
    
    # Get products with sales and stock data
    products_query = db.query(Product).filter(Product.status.in_(['ACTIVE'])).all()
    
    optimizer = InventoryOptimizer()
    optimization_results = []
    
    for product in products_query:
        # Get sales data for ABC analysis
        total_revenue = db.query(
            func.sum(SalesActual.net_amount)
        ).filter(
            SalesActual.product_id == product.id,
            SalesActual.sale_date.between(start_date, end_date)
        ).scalar() or 0
        
        # Get daily sales for XYZ analysis
        daily_sales = db.query(
            func.sum(SalesActual.quantity_sold).label('daily_qty')
        ).filter(
            SalesActual.product_id == product.id,
            SalesActual.sale_date.between(start_date, end_date)
        ).group_by(SalesActual.sale_date).all()
        
        if not daily_sales or len(daily_sales) < 30:  # Need at least 30 days
            continue
        
        daily_quantities = [float(sale.daily_qty) for sale in daily_sales]
        
        # Simple ABC classification (this would normally come from analytics endpoint)
        if total_revenue > 50000:  # High value
            abc_class = 'A'
        elif total_revenue > 10000:  # Medium value
            abc_class = 'B'
        else:  # Low value
            abc_class = 'C'
        
        # Simple XYZ classification based on coefficient of variation
        if daily_quantities:
            mean_demand = np.mean(daily_quantities)
            std_demand = np.std(daily_quantities)
            cv = (std_demand / mean_demand * 100) if mean_demand > 0 else 0
            
            if cv < 20:
                xyz_class = 'X'  # Predictable
            elif cv <= 50:
                xyz_class = 'Y'  # Moderately predictable
            else:
                xyz_class = 'Z'  # Unpredictable
        else:
            xyz_class = 'Y'  # Default
        
        # Calculate basic metrics for optimization
        annual_demand = sum(daily_quantities) * (365 / len(daily_quantities))
        daily_demand = np.mean(daily_quantities)
        demand_std = np.std(daily_quantities)
        
        # Calculate EOQ (simplified)
        ordering_cost = 100  # Default
        holding_cost = float(product.cost_price or 10) * 0.2  # 20% of cost
        
        eoq_analysis = optimizer.calculate_eoq(
            annual_demand=annual_demand,
            ordering_cost=ordering_cost,
            holding_cost=holding_cost
        )
        
        # Calculate reorder point
        lead_time_days = 7  # Default
        reorder_analysis = optimizer.calculate_reorder_point(
            lead_time_days=lead_time_days,
            daily_demand=daily_demand,
            demand_std=demand_std,
            service_level=0.95
        )
        
        # Get current stock
        current_stock = db.query(
            func.sum(StockOnHand.quantity_available)
        ).filter(
            StockOnHand.product_id == product.id
        ).scalar() or 0
        
        # Get ABC-XYZ strategy
        strategy = optimizer.calculate_abc_xyz_strategy(
            abc_class=abc_class,
            xyz_class=xyz_class,
            current_stock=float(current_stock),
            reorder_point=reorder_analysis['reorder_point'],
            eoq=eoq_analysis['eoq']
        )
        
        optimization_results.append({
            "product_id": product.id,
            "product_code": product.product_code,
            "product_name": product.name,
            "classification": {
                "abc_class": abc_class,
                "xyz_class": xyz_class,
                "matrix_class": f"{abc_class}{xyz_class}",
                "coefficient_of_variation": round(cv, 2) if 'cv' in locals() else 0
            },
            "demand_metrics": {
                "annual_demand": round(annual_demand, 2),
                "daily_demand_avg": round(daily_demand, 2),
                "demand_std_dev": round(demand_std, 2)
            },
            "current_inventory": {
                "current_stock": round(float(current_stock), 2),
                "current_reorder_level": float(product.reorder_level or 0)
            },
            "optimization_recommendations": {
                **strategy,
                "eoq": round(eoq_analysis['eoq'], 2),
                "reorder_point": round(reorder_analysis['reorder_point'], 2),
                "safety_stock": round(reorder_analysis['safety_stock'], 2)
            }
        })
    
    # Sort by priority level
    optimization_results.sort(key=lambda x: x["optimization_recommendations"]["priority_level"])
    
    # Calculate summary statistics
    priority_counts = {}
    for i in range(1, 10):
        priority_counts[f"priority_{i}"] = len([r for r in optimization_results if r["optimization_recommendations"]["priority_level"] == i])
    
    return {
        "analysis_period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": analysis_period_days
        },
        "summary": {
            "total_products": len(optimization_results),
            "priority_breakdown": priority_counts,
            "high_priority_items": len([r for r in optimization_results if r["optimization_recommendations"]["priority_level"] <= 3])
        },
        "optimization_strategies": {
            "AX": "Tight control - Frequent monitoring, optimal stock levels",
            "AY": "Good control - Regular review, adequate safety stock",
            "AZ": "Intensive control - High safety stock, close monitoring",
            "BX": "Standard control - Periodic review",
            "BY": "Normal control - Moderate safety stock",
            "BZ": "Flexible control - Responsive management",
            "CX": "Simple control - Minimal inventory",
            "CY": "Basic control - Low safety stock",
            "CZ": "Minimal control - Consider discontinuation"
        },
        "products": optimization_results
    }


@router.get("/stock-recommendations")
def get_stock_recommendations(
    *,
    db: Session = Depends(get_db),
    urgency_filter: Optional[str] = Query(None, description="Filter by urgency: critical, urgent, normal"),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get actionable inventory recommendations."""
    
    # Get all products with current stock levels
    stock_query = db.query(
        StockOnHand.product_id,
        func.sum(StockOnHand.quantity_available).label('current_stock'),
        func.min(StockOnHand.expiry_date).label('earliest_expiry')
    ).group_by(StockOnHand.product_id).all()
    
    recommendations = []
    
    for stock_record in stock_query:
        product = db.query(Product).filter(Product.id == stock_record.product_id).first()
        
        if not product:
            continue
        
        current_stock = float(stock_record.current_stock)
        reorder_level = float(product.reorder_level or 0)
        
        # Calculate recent demand
        recent_date = datetime.now().date() - timedelta(days=30)
        recent_demand = db.query(
            func.sum(SalesActual.quantity_sold)
        ).filter(
            SalesActual.product_id == stock_record.product_id,
            SalesActual.sale_date >= recent_date
        ).scalar() or 0
        
        daily_demand = float(recent_demand) / 30 if recent_demand > 0 else 0
        days_of_supply = current_stock / daily_demand if daily_demand > 0 else float('inf')
        
        # Determine recommendation type and urgency
        recommendation_type = None
        urgency = None
        action = None
        reason = None
        
        # Check for critical conditions
        if current_stock <= 0:
            recommendation_type = "STOCK_OUT"
            urgency = "critical"
            action = "Emergency procurement required"
            reason = "Product is out of stock"
        elif current_stock <= reorder_level * 0.5:
            recommendation_type = "CRITICAL_LOW"
            urgency = "critical"
            action = f"Order {max(100, reorder_level * 2)} units immediately"
            reason = "Stock below 50% of reorder level"
        elif current_stock <= reorder_level:
            recommendation_type = "REORDER_NOW"
            urgency = "urgent"
            action = f"Order {max(50, reorder_level)} units"
            reason = "Stock at or below reorder level"
        elif days_of_supply < 7:
            recommendation_type = "LOW_SUPPLY"
            urgency = "urgent"
            action = f"Review demand and consider ordering {int(daily_demand * 14)} units"
            reason = f"Only {days_of_supply:.1f} days of supply remaining"
        elif stock_record.earliest_expiry and stock_record.earliest_expiry <= datetime.now().date() + timedelta(days=30):
            recommendation_type = "EXPIRY_RISK"
            urgency = "urgent"
            action = "Implement promotion or markdown to move expiring stock"
            reason = f"Stock expiring on {stock_record.earliest_expiry}"
        elif current_stock > reorder_level * 3:
            recommendation_type = "EXCESS_STOCK"
            urgency = "normal"
            action = "Review ordering patterns and consider reducing orders"
            reason = "Stock levels significantly above reorder level"
        elif days_of_supply > 90:
            recommendation_type = "OVERSTOCK"
            urgency = "normal"
            action = "Consider reducing inventory levels"
            reason = f"High days of supply ({days_of_supply:.1f} days)"
        else:
            recommendation_type = "OPTIMAL"
            urgency = "normal"
            action = "No action needed"
            reason = "Stock levels are adequate"
        
        # Apply urgency filter if specified
        if urgency_filter and urgency != urgency_filter:
            continue
        
        recommendation = {
            "product_id": stock_record.product_id,
            "product_code": product.product_code,
            "product_name": product.name,
            "current_stock": current_stock,
            "reorder_level": reorder_level,
            "recent_30_day_demand": float(recent_demand),
            "daily_demand_avg": round(daily_demand, 2),
            "days_of_supply": round(days_of_supply if days_of_supply != float('inf') else 0, 1),
            "earliest_expiry": stock_record.earliest_expiry.isoformat() if stock_record.earliest_expiry else None,
            "recommendation": {
                "type": recommendation_type,
                "urgency": urgency,
                "action": action,
                "reason": reason,
                "priority_score": _calculate_priority_score(urgency, recommendation_type)
            }
        }
        
        recommendations.append(recommendation)
    
    # Sort by priority score (higher is more urgent)
    recommendations.sort(key=lambda x: x["recommendation"]["priority_score"], reverse=True)
    
    # Calculate summary statistics
    urgency_counts = {
        "critical": len([r for r in recommendations if r["recommendation"]["urgency"] == "critical"]),
        "urgent": len([r for r in recommendations if r["recommendation"]["urgency"] == "urgent"]),
        "normal": len([r for r in recommendations if r["recommendation"]["urgency"] == "normal"])
    }
    
    recommendation_type_counts = {}
    for rec in recommendations:
        rec_type = rec["recommendation"]["type"]
        recommendation_type_counts[rec_type] = recommendation_type_counts.get(rec_type, 0) + 1
    
    return {
        "generated_at": datetime.now().isoformat(),
        "summary": {
            "total_products": len(recommendations),
            "urgency_breakdown": urgency_counts,
            "recommendation_type_breakdown": recommendation_type_counts
        },
        "recommendations": recommendations
    }


def _calculate_priority_score(urgency: str, recommendation_type: str) -> int:
    """Calculate priority score for sorting recommendations."""
    urgency_scores = {"critical": 100, "urgent": 50, "normal": 10}
    type_scores = {
        "STOCK_OUT": 50,
        "CRITICAL_LOW": 40,
        "REORDER_NOW": 30,
        "LOW_SUPPLY": 25,
        "EXPIRY_RISK": 20,
        "EXCESS_STOCK": 5,
        "OVERSTOCK": 3,
        "OPTIMAL": 1
    }
    
    return urgency_scores.get(urgency, 10) + type_scores.get(recommendation_type, 1)


@router.get("/optimization-summary")
def get_optimization_summary(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get overall inventory optimization summary and KPIs."""
    
    # Total inventory value
    total_inventory_value = db.query(
        func.sum(StockOnHand.total_cost)
    ).scalar() or 0
    
    # Items requiring action
    stock_items = db.query(StockOnHand.product_id, func.sum(StockOnHand.quantity_available).label('stock')).group_by(StockOnHand.product_id).all()
    
    action_needed = 0
    optimal_items = 0
    
    for item in stock_items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            current_stock = float(item.stock)
            reorder_level = float(product.reorder_level or 0)
            
            if current_stock <= reorder_level:
                action_needed += 1
            else:
                optimal_items += 1
    
    # Recent stock movements
    recent_date = datetime.now().date() - timedelta(days=7)
    recent_movements = db.query(StockMovement).filter(
        StockMovement.movement_date >= recent_date
    ).count()
    
    # Forecast coverage
    active_forecasts = db.query(DemandForecast).filter(
        DemandForecast.status == ForecastStatus.ACTIVE,
        DemandForecast.forecast_period >= datetime.now().date()
    ).count()
    
    total_active_products = db.query(Product).filter(Product.status.in_(['ACTIVE'])).count()
    forecast_coverage = (active_forecasts / total_active_products * 100) if total_active_products > 0 else 0
    
    return {
        "optimization_kpis": {
            "total_inventory_value_rm": round(float(total_inventory_value), 2),
            "total_products_tracked": len(stock_items),
            "items_requiring_action": action_needed,
            "optimal_stock_items": optimal_items,
            "optimization_coverage": round((optimal_items / len(stock_items) * 100), 2) if stock_items else 0
        },
        "recent_activity": {
            "stock_movements_7_days": recent_movements,
            "forecast_coverage_percentage": round(forecast_coverage, 2)
        },
        "recommendations": {
            "priority_actions": action_needed,
            "optimization_opportunity": f"{action_needed} items need immediate attention",
            "next_steps": [
                "Review items requiring action",
                "Update reorder levels based on recent demand",
                "Generate forecasts for products without coverage",
                "Implement EOQ recommendations for high-value items"
            ]
        }
    }