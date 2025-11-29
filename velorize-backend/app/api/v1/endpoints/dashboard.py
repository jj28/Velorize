from typing import Any, List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, text
from datetime import datetime, date, timedelta
from decimal import Decimal
import numpy as np

from app.core.deps import get_db, get_current_verified_user, get_sop_leader_or_admin
from app.models.user import User
from app.models.product import Product, ProductStatus
from app.models.customer import Customer, CustomerStatus
from app.models.supplier import Supplier, SupplierStatus
from app.models.inventory import StockOnHand, StockMovement, MovementType
from app.models.sales import SalesActual
from app.models.forecast import DemandForecast, ForecastStatus
from app.models.marketing import MarketingCalendar, EventStatus
from app.models.aop import AnnualOperatingPlan, AOPStatus
from app.models.bom import BillOfMaterials, BOMStatus

router = APIRouter()


@router.get("/overview")
def get_dashboard_overview(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get comprehensive dashboard overview with key metrics."""
    
    # Current date for calculations
    today = datetime.now().date()
    current_month_start = today.replace(day=1)
    last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
    last_month_end = current_month_start - timedelta(days=1)
    ytd_start = today.replace(month=1, day=1)
    
    # === SALES METRICS ===
    
    # Current month sales
    current_month_sales = db.query(
        func.sum(SalesActual.net_sales_amount).label('revenue'),
        func.sum(SalesActual.quantity_sold).label('quantity'),
        func.count(SalesActual.id).label('transactions')
    ).filter(
        SalesActual.transaction_date >= current_month_start
    ).first()

    # Last month sales for comparison
    last_month_sales = db.query(
        func.sum(SalesActual.net_sales_amount).label('revenue'),
        func.sum(SalesActual.quantity_sold).label('quantity')
    ).filter(
        SalesActual.transaction_date.between(last_month_start, last_month_end)
    ).first()
    
    # YTD sales
    ytd_sales = db.query(
        func.sum(SalesActual.net_sales_amount).label('revenue'),
        func.sum(SalesActual.quantity_sold).label('quantity')
    ).filter(
        SalesActual.transaction_date >= ytd_start
    ).first()
    
    # Calculate growth rates
    current_revenue = float(current_month_sales.revenue or 0)
    last_revenue = float(last_month_sales.revenue or 0)
    revenue_growth = ((current_revenue - last_revenue) / last_revenue * 100) if last_revenue > 0 else 0
    
    current_quantity = float(current_month_sales.quantity or 0)
    last_quantity = float(last_month_sales.quantity or 0)
    quantity_growth = ((current_quantity - last_quantity) / last_quantity * 100) if last_quantity > 0 else 0
    
    # === INVENTORY METRICS ===
    
    # Total inventory value
    total_inventory_value = db.query(
        func.sum(StockOnHand.total_value)
    ).scalar() or 0
    
    # Low stock items
    low_stock_items = db.query(StockOnHand).join(Product).filter(
        StockOnHand.available_quantity <= Product.reorder_level
    ).count()
    
    # Expired items
    expired_items = db.query(StockOnHand).filter(
        StockOnHand.earliest_expiry_date < today
    ).count()
    
    # Items expiring within 30 days
    expiring_soon = db.query(StockOnHand).filter(
        and_(
            StockOnHand.earliest_expiry_date.isnot(None),
            StockOnHand.earliest_expiry_date <= today + timedelta(days=30),
            StockOnHand.earliest_expiry_date >= today
        )
    ).count()
    
    # Total stock movements this month
    monthly_movements = db.query(StockMovement).filter(
        StockMovement.movement_date >= current_month_start
    ).count()
    
    # === MASTER DATA METRICS ===
    
    # Product counts
    total_products = db.query(Product).count()
    active_products = db.query(Product).filter(Product.status == ProductStatus.ACTIVE).count()
    
    # Customer counts
    total_customers = db.query(Customer).count()
    active_customers = db.query(Customer).filter(Customer.status == CustomerStatus.ACTIVE).count()
    
    # Supplier counts
    total_suppliers = db.query(Supplier).count()
    active_suppliers = db.query(Supplier).filter(Supplier.status == SupplierStatus.ACTIVE).count()
    
    # === FORECASTING METRICS ===
    
    # Active forecasts
    future_date = today + timedelta(days=30)
    active_forecasts = db.query(DemandForecast).filter(
        DemandForecast.status == ForecastStatus.APPROVED,
        DemandForecast.forecast_period_start >= today,
        DemandForecast.forecast_period_start <= future_date
    ).count()
    
    # Products with forecasts
    products_with_forecasts = db.query(DemandForecast.product_id).filter(
        DemandForecast.status == ForecastStatus.APPROVED,
        DemandForecast.forecast_period_start >= today
    ).distinct().count()
    
    forecast_coverage = (products_with_forecasts / active_products * 100) if active_products > 0 else 0
    
    # === MARKETING & AOP METRICS ===
    
    # Upcoming marketing events
    upcoming_events = db.query(MarketingCalendar).filter(
        MarketingCalendar.start_date >= today,
        MarketingCalendar.start_date <= today + timedelta(days=30),
        MarketingCalendar.is_active == True,
        MarketingCalendar.status != EventStatus.CANCELLED
    ).count()
    
    # Current AOP status
    current_year = today.year
    current_aop = db.query(AnnualOperatingPlan).filter(
        AnnualOperatingPlan.fiscal_year == current_year,
        AnnualOperatingPlan.status == AOPStatus.APPROVED
    ).first()
    
    aop_performance = None
    if current_aop:
        ytd_revenue = float(ytd_sales.revenue or 0)
        target_revenue = float(current_aop.target_revenue_rm)
        days_elapsed = (today - ytd_start).days + 1
        days_in_year = 366 if current_year % 4 == 0 else 365
        expected_revenue = target_revenue * (days_elapsed / days_in_year)
        
        aop_performance = {
            "target_revenue": target_revenue,
            "ytd_actual": ytd_revenue,
            "ytd_expected": expected_revenue,
            "achievement_percentage": (ytd_revenue / expected_revenue * 100) if expected_revenue > 0 else 0,
            "on_track": ytd_revenue >= expected_revenue * 0.95
        }
    
    # === RECENT ACTIVITY ===
    
    # Recent sales (last 7 days)
    recent_sales = db.query(
        func.sum(SalesActual.net_sales_amount).label('revenue'),
        func.count(SalesActual.id).label('transactions')
    ).filter(
        SalesActual.transaction_date >= today - timedelta(days=7)
    ).first()
    
    # Recent stock movements (last 7 days)
    recent_stock_ins = db.query(StockMovement).filter(
        StockMovement.movement_type == MovementType.RECEIPT,
        StockMovement.movement_date >= today - timedelta(days=7)
    ).count()
    
    recent_stock_outs = db.query(StockMovement).filter(
        StockMovement.movement_type == MovementType.ISSUE,
        StockMovement.movement_date >= today - timedelta(days=7)
    ).count()
    
    return {
        "dashboard_date": today.isoformat(),
        "sales_metrics": {
            "current_month": {
                "revenue": round(current_revenue, 2),
                "quantity": round(current_quantity, 2),
                "transactions": int(current_month_sales.transactions or 0),
                "revenue_growth_percentage": round(revenue_growth, 2),
                "quantity_growth_percentage": round(quantity_growth, 2)
            },
            "ytd": {
                "revenue": round(float(ytd_sales.revenue or 0), 2),
                "quantity": round(float(ytd_sales.quantity or 0), 2)
            }
        },
        "inventory_metrics": {
            "total_value_rm": round(float(total_inventory_value), 2),
            "low_stock_items": low_stock_items,
            "expired_items": expired_items,
            "expiring_soon_items": expiring_soon,
            "monthly_movements": monthly_movements,
            "requires_attention": low_stock_items + expired_items + expiring_soon > 0
        },
        "master_data": {
            "products": {"total": total_products, "active": active_products},
            "customers": {"total": total_customers, "active": active_customers},
            "suppliers": {"total": total_suppliers, "active": active_suppliers}
        },
        "forecasting": {
            "active_forecasts_30_days": active_forecasts,
            "products_with_forecasts": products_with_forecasts,
            "forecast_coverage_percentage": round(forecast_coverage, 2)
        },
        "marketing_aop": {
            "upcoming_events_30_days": upcoming_events,
            "has_current_aop": current_aop is not None,
            "aop_performance": aop_performance
        },
        "recent_activity": {
            "sales_7_days": {
                "revenue": round(float(recent_sales.revenue or 0), 2),
                "transactions": int(recent_sales.transactions or 0)
            },
            "stock_movements_7_days": {
                "stock_ins": recent_stock_ins,
                "stock_outs": recent_stock_outs
            }
        }
    }


@router.get("/sales-trends")
def get_sales_trends(
    *,
    db: Session = Depends(get_db),
    period: str = Query("monthly", description="Trend period: daily, weekly, monthly"),
    months_back: int = Query(12, description="Number of months to look back"),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get sales trends for dashboard charts."""
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=months_back * 30)
    
    if period == "daily":
        # Daily sales for last 30 days
        start_date = end_date - timedelta(days=30)
        
        daily_sales = db.query(
            SalesActual.transaction_date,
            func.sum(SalesActual.net_sales_amount).label('revenue'),
            func.sum(SalesActual.quantity_sold).label('quantity')
        ).filter(
            SalesActual.transaction_date.between(start_date, end_date)
        ).group_by(SalesActual.transaction_date).order_by(SalesActual.transaction_date).all()
        
        trends = [
            {
                "date": record.transaction_date.isoformat(),
                "revenue": round(float(record.revenue), 2),
                "quantity": round(float(record.quantity), 2)
            }
            for record in daily_sales
        ]
        
    elif period == "weekly":
        # Weekly sales for last 12 weeks
        start_date = end_date - timedelta(weeks=12)
        
        weekly_sales = db.query(
            func.date_trunc('week', SalesActual.transaction_date).label('week'),
            func.sum(SalesActual.net_sales_amount).label('revenue'),
            func.sum(SalesActual.quantity_sold).label('quantity')
        ).filter(
            SalesActual.transaction_date.between(start_date, end_date)
        ).group_by(
            func.date_trunc('week', SalesActual.transaction_date)
        ).order_by('week').all()
        
        trends = [
            {
                "period": record.week.strftime('%Y-W%U'),
                "date": record.week.isoformat(),
                "revenue": round(float(record.revenue), 2),
                "quantity": round(float(record.quantity), 2)
            }
            for record in weekly_sales
        ]
        
    else:  # monthly
        monthly_sales = db.query(
            func.date_trunc('month', SalesActual.transaction_date).label('month'),
            func.sum(SalesActual.net_sales_amount).label('revenue'),
            func.sum(SalesActual.quantity_sold).label('quantity')
        ).filter(
            SalesActual.transaction_date.between(start_date, end_date)
        ).group_by(
            func.date_trunc('month', SalesActual.transaction_date)
        ).order_by('month').all()
        
        trends = [
            {
                "period": record.month.strftime('%Y-%m'),
                "date": record.month.isoformat(),
                "revenue": round(float(record.revenue), 2),
                "quantity": round(float(record.quantity), 2)
            }
            for record in monthly_sales
        ]
    
    return {
        "period_type": period,
        "date_range": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat()
        },
        "trends": trends
    }


@router.get("/top-products")
def get_top_products(
    *,
    db: Session = Depends(get_db),
    metric: str = Query("revenue", description="Ranking metric: revenue, quantity, profit"),
    period_days: int = Query(30, description="Analysis period in days"),
    limit: int = Query(10, description="Number of top products to return"),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get top performing products for dashboard."""
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=period_days)
    
    # Base query
    query = db.query(
        SalesActual.product_id,
        func.sum(SalesActual.net_sales_amount).label('total_revenue'),
        func.sum(SalesActual.quantity_sold).label('total_quantity'),
        func.avg(SalesActual.unit_price).label('avg_price'),
        func.count(SalesActual.id).label('transaction_count')
    ).filter(
        SalesActual.transaction_date.between(start_date, end_date)
    ).group_by(SalesActual.product_id)
    
    # Order by selected metric
    if metric == "quantity":
        query = query.order_by(desc('total_quantity'))
    elif metric == "profit":
        # For profit, we'll use revenue as proxy (would need cost data for true profit)
        query = query.order_by(desc('total_revenue'))
    else:  # revenue (default)
        query = query.order_by(desc('total_revenue'))
    
    top_sales = query.limit(limit).all()
    
    top_products = []
    for record in top_sales:
        product = db.query(Product).filter(Product.id == record.product_id).first()
        
        # Calculate estimated profit margin
        if product and product.standard_cost and product.standard_cost > 0:
            avg_price = float(record.avg_price or 0)
            cost_price = float(product.standard_cost)
            profit_margin = ((avg_price - cost_price) / avg_price * 100) if avg_price > 0 else 0
        else:
            profit_margin = 0
        
        top_products.append({
            "product_id": record.product_id,
            "product_code": product.sku if product else f"PROD-{record.product_id}",
            "product_name": product.name if product else "Unknown Product",
            "total_revenue": round(float(record.total_revenue), 2),
            "total_quantity": round(float(record.total_quantity), 2),
            "avg_price": round(float(record.avg_price or 0), 2),
            "transaction_count": int(record.transaction_count),
            "estimated_profit_margin": round(profit_margin, 2)
        })
    
    return {
        "ranking_metric": metric,
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": period_days
        },
        "top_products": top_products
    }


@router.get("/inventory-alerts")
def get_inventory_alerts(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get critical inventory alerts for dashboard."""
    
    today = datetime.now().date()
    
    # Stock out items
    stock_out_items = db.query(StockOnHand).filter(
        StockOnHand.available_quantity <= 0
    ).count()
    
    # Critical low stock (below 50% of reorder level)
    critical_low_query = db.query(StockOnHand).join(Product).filter(
        StockOnHand.available_quantity <= Product.reorder_level * 0.5,
        Product.reorder_level > 0
    )
    critical_low_items = critical_low_query.count()
    critical_low_list = critical_low_query.limit(5).all()
    
    # Items at reorder level
    reorder_query = db.query(StockOnHand).join(Product).filter(
        StockOnHand.available_quantity <= Product.reorder_level,
        StockOnHand.available_quantity > Product.reorder_level * 0.5,
        Product.reorder_level > 0
    )
    reorder_items = reorder_query.count()
    reorder_list = reorder_query.limit(5).all()
    
    # Expired items
    expired_query = db.query(StockOnHand).filter(
        StockOnHand.earliest_expiry_date < today
    )
    expired_items = expired_query.count()
    expired_list = expired_query.limit(5).all()
    
    # Expiring within 7 days
    expiring_query = db.query(StockOnHand).filter(
        and_(
            StockOnHand.earliest_expiry_date.isnot(None),
            StockOnHand.earliest_expiry_date <= today + timedelta(days=7),
            StockOnHand.earliest_expiry_date >= today
        )
    )
    expiring_items = expiring_query.count()
    expiring_list = expiring_query.limit(5).all()
    
    def format_stock_alert(stock_list, alert_type):
        alerts = []
        for stock in stock_list:
            product = db.query(Product).filter(Product.id == stock.product_id).first()
            
            alert = {
                "product_id": stock.product_id,
                "product_code": product.sku if product else f"PROD-{stock.product_id}",
                "product_name": product.name if product else "Unknown Product",
                "current_stock": float(stock.available_quantity),
                "location": stock.location,
                "alert_type": alert_type
            }
            
            if alert_type in ["critical_low", "reorder"]:
                alert["reorder_level"] = float(product.reorder_level or 0)
            
            if alert_type in ["expired", "expiring"]:
                alert["expiry_date"] = stock.earliest_expiry_date.isoformat() if stock.earliest_expiry_date else None
            
            alerts.append(alert)
        
        return alerts
    
    return {
        "alert_summary": {
            "stock_out": stock_out_items,
            "critical_low": critical_low_items,
            "reorder_needed": reorder_items,
            "expired": expired_items,
            "expiring_soon": expiring_items,
            "total_alerts": stock_out_items + critical_low_items + reorder_items + expired_items + expiring_items
        },
        "critical_alerts": {
            "stock_out_count": stock_out_items,
            "critical_low_stock": format_stock_alert(critical_low_list, "critical_low"),
            "reorder_needed": format_stock_alert(reorder_list, "reorder"),
            "expired_items": format_stock_alert(expired_list, "expired"),
            "expiring_soon": format_stock_alert(expiring_list, "expiring")
        }
    }


@router.get("/forecast-accuracy")
def get_forecast_accuracy_summary(
    *,
    db: Session = Depends(get_db),
    evaluation_months: int = Query(3, description="Number of months to evaluate"),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get forecast accuracy summary for dashboard."""
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=evaluation_months * 30)
    
    # Get forecasts that can be evaluated (have corresponding actuals)
    evaluable_forecasts = db.query(DemandForecast).filter(
        DemandForecast.forecast_period_start.between(start_date, end_date),
        DemandForecast.status == ForecastStatus.APPROVED
    ).all()
    
    if not evaluable_forecasts:
        return {
            "evaluation_period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "months": evaluation_months
            },
            "summary": {
                "total_forecasts": 0,
                "evaluated_forecasts": 0,
                "average_accuracy": 0
            },
            "accuracy_by_method": {}
        }
    
    accuracy_results = []
    method_totals = {}
    
    for forecast in evaluable_forecasts:
        # Get actual sales for the forecast period
        forecast_month_start = forecast.forecast_period_start.replace(day=1)
        if forecast.forecast_period_start.month == 12:
            forecast_month_end = forecast.forecast_period_start.replace(month=12, day=31)
        else:
            forecast_month_end = (forecast_month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        actual_sales = db.query(
            func.sum(SalesActual.quantity_sold)
        ).filter(
            SalesActual.product_id == forecast.product_id,
            SalesActual.transaction_date.between(forecast_month_start, forecast_month_end)
        ).scalar()
        
        if actual_sales is not None:
            actual_quantity = float(actual_sales)
            forecast_quantity = float(forecast.final_forecast)
            
            # Calculate accuracy (100 - MAPE)
            if actual_quantity > 0:
                mape = abs(forecast_quantity - actual_quantity) / actual_quantity * 100
                accuracy = max(0, 100 - mape)
            else:
                accuracy = 100 if forecast_quantity == 0 else 0
            
            accuracy_results.append(accuracy)
            
            # Track by method
            method = forecast.forecast_method.value
            if method not in method_totals:
                method_totals[method] = {'accuracies': [], 'count': 0}
            method_totals[method]['accuracies'].append(accuracy)
            method_totals[method]['count'] += 1
    
    # Calculate summary metrics
    overall_accuracy = np.mean(accuracy_results) if accuracy_results else 0
    
    # Calculate method averages
    method_summary = {}
    for method, data in method_totals.items():
        method_summary[method] = {
            'average_accuracy': round(np.mean(data['accuracies']), 2),
            'forecast_count': data['count']
        }
    
    return {
        "evaluation_period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "months": evaluation_months
        },
        "summary": {
            "total_forecasts": len(evaluable_forecasts),
            "evaluated_forecasts": len(accuracy_results),
            "average_accuracy_percentage": round(overall_accuracy, 2),
            "accuracy_status": "Good" if overall_accuracy >= 80 else "Needs Improvement" if overall_accuracy >= 60 else "Poor"
        },
        "accuracy_by_method": method_summary
    }


@router.get("/kpis")
def get_key_performance_indicators(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get key performance indicators for executive dashboard."""
    
    today = datetime.now().date()
    current_month_start = today.replace(day=1)
    last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
    last_month_end = current_month_start - timedelta(days=1)
    ytd_start = today.replace(month=1, day=1)
    
    # === REVENUE KPIs ===
    current_month_revenue = db.query(func.sum(SalesActual.net_sales_amount)).filter(
        SalesActual.transaction_date >= current_month_start
    ).scalar() or 0
    
    last_month_revenue = db.query(func.sum(SalesActual.net_sales_amount)).filter(
        SalesActual.transaction_date.between(last_month_start, last_month_end)
    ).scalar() or 0
    
    ytd_revenue = db.query(func.sum(SalesActual.net_sales_amount)).filter(
        SalesActual.transaction_date >= ytd_start
    ).scalar() or 0
    
    # === INVENTORY KPIs ===
    total_inventory_value = db.query(func.sum(StockOnHand.total_value)).scalar() or 0
    
    # Inventory turnover (annual sales / average inventory)
    annual_sales = db.query(func.sum(SalesActual.net_sales_amount)).filter(
        SalesActual.transaction_date >= today - timedelta(days=365)
    ).scalar() or 0
    
    inventory_turnover = (float(annual_sales) / float(total_inventory_value)) if total_inventory_value > 0 else 0
    
    # Days of inventory on hand
    daily_sales = float(annual_sales) / 365 if annual_sales > 0 else 0
    days_of_inventory = (float(total_inventory_value) / daily_sales) if daily_sales > 0 else 0
    
    # === OPERATIONAL KPIs ===
    
    # Order fulfillment rate (assuming stock-outs are unfulfilled)
    stock_out_products = db.query(StockOnHand.product_id).filter(
        StockOnHand.available_quantity <= 0
    ).distinct().count()
    
    total_active_products = db.query(Product).filter(
        Product.status == ProductStatus.ACTIVE
    ).count()
    
    fulfillment_rate = ((total_active_products - stock_out_products) / total_active_products * 100) if total_active_products > 0 else 100
    
    # Forecast accuracy (last 30 days)
    recent_forecasts = db.query(DemandForecast).filter(
        DemandForecast.forecast_period_start >= today - timedelta(days=30),
        DemandForecast.forecast_period_start <= today,
        DemandForecast.status == ForecastStatus.APPROVED
    ).count()
    
    # === AOP PERFORMANCE ===
    current_year = today.year
    current_aop = db.query(AnnualOperatingPlan).filter(
        AnnualOperatingPlan.fiscal_year == current_year,
        AnnualOperatingPlan.status == AOPStatus.APPROVED
    ).first()
    
    aop_achievement = 0
    if current_aop:
        target_ytd = float(current_aop.target_revenue_rm) * ((today - ytd_start).days + 1) / (366 if current_year % 4 == 0 else 365)
        aop_achievement = (float(ytd_revenue) / target_ytd * 100) if target_ytd > 0 else 0
    
    return {
        "financial_kpis": {
            "current_month_revenue_rm": round(float(current_month_revenue), 2),
            "month_over_month_growth": round(((float(current_month_revenue) - float(last_month_revenue)) / float(last_month_revenue) * 100), 2) if last_month_revenue > 0 else 0,
            "ytd_revenue_rm": round(float(ytd_revenue), 2),
            "aop_achievement_percentage": round(aop_achievement, 2)
        },
        "inventory_kpis": {
            "total_inventory_value_rm": round(float(total_inventory_value), 2),
            "inventory_turnover_ratio": round(inventory_turnover, 2),
            "days_of_inventory_on_hand": round(days_of_inventory, 1),
            "inventory_health": "Good" if inventory_turnover >= 4 else "Average" if inventory_turnover >= 2 else "Poor"
        },
        "operational_kpis": {
            "order_fulfillment_rate": round(fulfillment_rate, 2),
            "active_products": total_active_products,
            "stock_out_products": stock_out_products,
            "forecast_coverage_products": recent_forecasts,
            "operational_efficiency": "Excellent" if fulfillment_rate >= 95 else "Good" if fulfillment_rate >= 85 else "Needs Improvement"
        },
        "performance_summary": {
            "overall_score": round((aop_achievement + fulfillment_rate + min(inventory_turnover * 25, 100)) / 3, 1),
            "areas_of_strength": [],
            "areas_for_improvement": [],
            "key_recommendations": []
        }
    }


@router.get("/system-health")
def get_system_health(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get system health and data quality indicators."""
    
    today = datetime.now().date()
    
    # Data freshness checks
    latest_sales = db.query(func.max(SalesActual.transaction_date)).scalar()
    latest_stock_movement = db.query(func.max(StockMovement.movement_date)).scalar()
    latest_forecast = db.query(func.max(DemandForecast.created_at)).scalar()
    
    # Data quality checks
    products_without_cost = db.query(Product).filter(
        Product.standard_cost.is_(None),
        Product.status == ProductStatus.ACTIVE
    ).count()
    
    products_without_reorder_level = db.query(Product).filter(
        Product.reorder_level.is_(None),
        Product.status == ProductStatus.ACTIVE
    ).count()
    
    stock_without_expiry = db.query(StockOnHand).join(Product).filter(
        StockOnHand.earliest_expiry_date.is_(None),
        Product.is_perishable == True
    ).count()
    
    # System utilization
    total_users = db.query(User).count()
    active_users_30d = db.query(User).filter(
        User.last_login >= today - timedelta(days=30)
    ).count() if hasattr(User, 'last_login') else total_users
    
    # BOMs coverage
    products_with_boms = db.query(Product).filter(
        Product.has_bom == True,
        Product.status == ProductStatus.ACTIVE
    ).count()
    
    active_products = db.query(Product).filter(
        Product.status == ProductStatus.ACTIVE
    ).count()
    
    bom_coverage = (products_with_boms / active_products * 100) if active_products > 0 else 0
    
    # Calculate overall health score
    data_quality_score = 100
    if products_without_cost > 0:
        data_quality_score -= min(20, (products_without_cost / active_products * 100))
    if products_without_reorder_level > 0:
        data_quality_score -= min(15, (products_without_reorder_level / active_products * 100))
    if stock_without_expiry > 0:
        data_quality_score -= min(10, stock_without_expiry * 2)
    
    system_health_score = (data_quality_score + min(100, bom_coverage) + min(100, (active_users_30d / total_users * 100))) / 3
    
    return {
        "data_freshness": {
            "latest_sales_date": latest_sales.isoformat() if latest_sales else None,
            "latest_stock_movement": latest_stock_movement.isoformat() if latest_stock_movement else None,
            "latest_forecast_generated": latest_forecast.isoformat() if latest_forecast else None,
            "data_current": (latest_sales and (today - latest_sales).days <= 2) if latest_sales else False
        },
        "data_quality": {
            "score": round(data_quality_score, 1),
            "products_without_cost": products_without_cost,
            "products_without_reorder_level": products_without_reorder_level,
            "perishable_stock_without_expiry": stock_without_expiry,
            "bom_coverage_percentage": round(bom_coverage, 2)
        },
        "system_utilization": {
            "total_users": total_users,
            "active_users_30_days": active_users_30d,
            "user_adoption_rate": round((active_users_30d / total_users * 100), 2) if total_users > 0 else 0
        },
        "overall_health": {
            "score": round(system_health_score, 1),
            "status": "Excellent" if system_health_score >= 90 else "Good" if system_health_score >= 75 else "Fair" if system_health_score >= 60 else "Poor",
            "recommendations": [
                "Update product cost prices" if products_without_cost > 0 else None,
                "Set reorder levels for all products" if products_without_reorder_level > 0 else None,
                "Add expiry dates for perishable inventory" if stock_without_expiry > 0 else None,
                "Increase user engagement" if (active_users_30d / total_users * 100) < 70 else None
            ]
        }
    }