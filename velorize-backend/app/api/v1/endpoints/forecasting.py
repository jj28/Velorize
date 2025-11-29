from typing import Any, List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from datetime import datetime, date, timedelta
import numpy as np
import pandas as pd
from scipy import stats
from collections import defaultdict
import logging
import json

from app.core.deps import get_db, get_current_verified_user, get_sop_leader_or_admin
from app.models.user import User
from app.models.product import Product
from app.models.sales import SalesActual
from app.models.forecast import DemandForecast, ForecastMethod, ForecastStatus
from app.models.marketing import MarketingCalendar, MarketingEventType
from app.schemas.forecast import (
    DemandForecastCreate, DemandForecastUpdate, DemandForecastResponse,
    ForecastGenerationRequest, ForecastAccuracyResponse
)

router = APIRouter()
logger = logging.getLogger(__name__)


class ForecastingEngine:
    """Core forecasting engine with multiple algorithms."""
    
    @staticmethod
    def moving_average(data: List[float], periods: int = 3) -> float:
        """Simple moving average forecast."""
        if len(data) < periods:
            return np.mean(data) if data else 0
        return np.mean(data[-periods:])
    
    @staticmethod
    def exponential_smoothing(data: List[float], alpha: float = 0.3) -> float:
        """Exponential smoothing forecast."""
        if not data:
            return 0
        
        if len(data) == 1:
            return data[0]
        
        # Initialize with first value
        smoothed = data[0]
        
        # Apply exponential smoothing
        for value in data[1:]:
            smoothed = alpha * value + (1 - alpha) * smoothed
        
        return smoothed
    
    @staticmethod
    def linear_trend(data: List[float], periods_ahead: int = 1) -> float:
        """Linear trend forecast using least squares regression."""
        if len(data) < 2:
            return data[0] if data else 0
        
        x = np.arange(len(data))
        y = np.array(data)
        
        # Calculate linear regression
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
        
        # Forecast for next period
        next_period = len(data) + periods_ahead - 1
        forecast = slope * next_period + intercept
        
        return max(0, forecast)  # Ensure non-negative
    
    @staticmethod
    def seasonal_naive(data: List[float], season_length: int = 12) -> float:
        """Seasonal naive forecast (same period last year)."""
        if len(data) < season_length:
            return np.mean(data) if data else 0
        return data[-season_length]
    
    @staticmethod
    def sarima_simple(data: List[float], seasonal_periods: int = 12) -> Dict[str, Any]:
        """Simplified SARIMA-like forecast with basic seasonal adjustment."""
        if len(data) < seasonal_periods * 2:
            # Not enough data for seasonal analysis
            return {
                'forecast': ForecastingEngine.linear_trend(data),
                'confidence_lower': 0,
                'confidence_upper': 0,
                'method': 'linear_trend_fallback'
            }
        
        # Decompose into trend and seasonal components
        # Simple seasonal decomposition
        seasonal_data = []
        trend_data = []
        
        # Calculate seasonal averages
        seasonal_avgs = {}
        for i in range(seasonal_periods):
            season_values = []
            for j in range(i, len(data), seasonal_periods):
                season_values.append(data[j])
            seasonal_avgs[i] = np.mean(season_values) if season_values else 0
        
        # Calculate overall average
        overall_avg = np.mean(data)
        
        # Create seasonal indices
        seasonal_indices = {}
        for i in range(seasonal_periods):
            seasonal_indices[i] = seasonal_avgs[i] / overall_avg if overall_avg > 0 else 1
        
        # De-seasonalize the data
        deseasonalized = []
        for i, value in enumerate(data):
            season_idx = i % seasonal_periods
            deseasonalized_value = value / seasonal_indices[season_idx] if seasonal_indices[season_idx] > 0 else value
            deseasonalized.append(deseasonalized_value)
        
        # Apply trend forecast to deseasonalized data
        trend_forecast = ForecastingEngine.linear_trend(deseasonalized)
        
        # Re-seasonalize the forecast
        next_season_idx = len(data) % seasonal_periods
        seasonal_forecast = trend_forecast * seasonal_indices[next_season_idx]
        
        # Calculate confidence intervals (simple approximation)
        recent_errors = []
        for i in range(min(len(data) - 1, 24)):  # Last 24 periods or less
            actual = data[-(i+1)]
            if i < len(data) - seasonal_periods:
                predicted = data[-(i+1+seasonal_periods)] * seasonal_indices[((len(data) - i - 1) % seasonal_periods)]
                error = abs(actual - predicted)
                recent_errors.append(error)
        
        if recent_errors:
            error_std = np.std(recent_errors)
            confidence_lower = max(0, seasonal_forecast - 1.96 * error_std)
            confidence_upper = seasonal_forecast + 1.96 * error_std
        else:
            confidence_lower = seasonal_forecast * 0.8
            confidence_upper = seasonal_forecast * 1.2
        
        return {
            'forecast': max(0, seasonal_forecast),
            'confidence_lower': max(0, confidence_lower),
            'confidence_upper': confidence_upper,
            'seasonal_index': seasonal_indices[next_season_idx],
            'method': 'sarima_simple'
        }


@router.post("/generate")
async def generate_forecasts(
    *,
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks,
    request: ForecastGenerationRequest,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Generate demand forecasts for specified products and periods."""
    
    # Validate request
    if request.forecast_periods < 1 or request.forecast_periods > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Forecast periods must be between 1 and 12"
        )
    
    if request.historical_periods < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Historical periods must be at least 6 for meaningful forecasts"
        )
    
    # Start background forecast generation
    background_tasks.add_task(
        _generate_forecasts_background,
        db,
        request,
        current_user.id
    )
    
    return {
        "message": "Forecast generation started in background",
        "forecast_periods": request.forecast_periods,
        "method": request.method.value if request.method else "AUTO",
        "estimated_completion": "5-10 minutes"
    }


async def _generate_forecasts_background(
    db: Session,
    request: ForecastGenerationRequest,
    user_id: int
):
    """Background task to generate forecasts."""
    
    try:
        # Get products to forecast
        if request.product_ids:
            products = db.query(Product).filter(Product.id.in_(request.product_ids)).all()
        else:
            # Get all active products with sales history
            products = db.query(Product).filter(Product.status.in_(['ACTIVE'])).all()
        
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=request.historical_periods * 30)
        
        forecasting_engine = ForecastingEngine()
        generated_count = 0
        
        for product in products:
            try:
                # Get historical sales data
                sales_data = db.query(
                    func.date_trunc('month', SalesActual.sale_date).label('month'),
                    func.sum(SalesActual.quantity_sold).label('total_quantity')
                ).filter(
                    SalesActual.product_id == product.id,
                    SalesActual.sale_date.between(start_date, end_date)
                ).group_by(
                    func.date_trunc('month', SalesActual.sale_date)
                ).order_by('month').all()
                
                if not sales_data or len(sales_data) < 3:
                    logger.warning(f"Insufficient sales data for product {product.product_code}")
                    continue
                
                # Prepare historical data
                historical_quantities = [float(record.total_quantity) for record in sales_data]
                
                # Generate forecasts for each future period
                for period in range(1, request.forecast_periods + 1):
                    forecast_date = end_date + timedelta(days=30 * period)  # Approximate monthly periods
                    
                    # Remove existing forecasts for this period and product
                    db.query(DemandForecast).filter(
                        DemandForecast.product_id == product.id,
                        func.date_trunc('month', DemandForecast.forecast_period) == func.date_trunc('month', forecast_date)
                    ).delete()
                    
                    # Calculate forecast based on selected method
                    if request.method == ForecastMethod.MOVING_AVERAGE:
                        forecast_quantity = forecasting_engine.moving_average(historical_quantities, 3)
                        method_params = {"periods": 3}
                    
                    elif request.method == ForecastMethod.EXPONENTIAL_SMOOTHING:
                        forecast_quantity = forecasting_engine.exponential_smoothing(historical_quantities, 0.3)
                        method_params = {"alpha": 0.3}
                    
                    elif request.method == ForecastMethod.LINEAR_TREND:
                        forecast_quantity = forecasting_engine.linear_trend(historical_quantities, period)
                        method_params = {"periods_ahead": period}
                    
                    elif request.method == ForecastMethod.SEASONAL_NAIVE:
                        forecast_quantity = forecasting_engine.seasonal_naive(historical_quantities, 12)
                        method_params = {"season_length": 12}
                    
                    elif request.method == ForecastMethod.SARIMA or request.method is None:
                        # Use SARIMA as default for auto
                        sarima_result = forecasting_engine.sarima_simple(historical_quantities, 12)
                        forecast_quantity = sarima_result['forecast']
                        method_params = {
                            "seasonal_periods": 12,
                            "confidence_lower": sarima_result['confidence_lower'],
                            "confidence_upper": sarima_result['confidence_upper'],
                            "seasonal_index": sarima_result.get('seasonal_index', 1.0)
                        }
                    
                    else:
                        # Auto method - choose best based on data characteristics
                        if len(historical_quantities) >= 24:  # 2 years of data
                            sarima_result = forecasting_engine.sarima_simple(historical_quantities, 12)
                            forecast_quantity = sarima_result['forecast']
                            method_params = {"auto_selected": "sarima_simple"}
                            selected_method = ForecastMethod.SARIMA
                        elif len(historical_quantities) >= 12:  # 1 year of data
                            forecast_quantity = forecasting_engine.linear_trend(historical_quantities, period)
                            method_params = {"auto_selected": "linear_trend"}
                            selected_method = ForecastMethod.LINEAR_TREND
                        else:
                            forecast_quantity = forecasting_engine.exponential_smoothing(historical_quantities, 0.3)
                            method_params = {"auto_selected": "exponential_smoothing"}
                            selected_method = ForecastMethod.EXPONENTIAL_SMOOTHING
                    
                    # Adjust for marketing events if available
                    marketing_adjustments = _calculate_marketing_adjustments(
                        db, product.id, forecast_date, forecast_quantity
                    )
                    
                    adjusted_quantity = forecast_quantity * marketing_adjustments.get('adjustment_factor', 1.0)
                    
                    # Create forecast record
                    forecast_record = DemandForecast(
                        product_id=product.id,
                        forecast_period=forecast_date,
                        forecast_quantity=max(0, adjusted_quantity),
                        method=request.method or selected_method,
                        confidence_level=95.0,
                        status=ForecastStatus.ACTIVE,
                        created_by=user_id,
                        method_parameters=json.dumps(method_params),
                        notes=f"Auto-generated forecast using {method_params.get('auto_selected', request.method.value if request.method else 'SARIMA')}"
                    )
                    
                    db.add(forecast_record)
                    generated_count += 1
                
            except Exception as e:
                logger.error(f"Error generating forecast for product {product.product_code}: {str(e)}")
                continue
        
        db.commit()
        logger.info(f"Successfully generated {generated_count} forecasts")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error in forecast generation: {str(e)}")


def _calculate_marketing_adjustments(
    db: Session, 
    product_id: int, 
    forecast_date: date, 
    base_forecast: float
) -> Dict[str, Any]:
    """Calculate marketing event adjustments to base forecast."""
    
    # Look for marketing events in the forecast month
    month_start = forecast_date.replace(day=1)
    month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
    
    marketing_events = db.query(MarketingCalendar).filter(
        and_(
            MarketingCalendar.start_date >= month_start,
            MarketingCalendar.end_date <= month_end,
            MarketingCalendar.is_active == True
        )
    ).all()
    
    adjustment_factor = 1.0
    events_impact = []
    
    for event in marketing_events:
        # Apply different uplift factors based on event type
        if event.event_type == MarketingEventType.PROMOTION:
            event_factor = 1.2  # 20% uplift for promotions
        elif event.event_type == MarketingEventType.NEW_PRODUCT_LAUNCH:
            event_factor = 1.5  # 50% uplift for new product launches
        elif event.event_type == MarketingEventType.SEASONAL_CAMPAIGN:
            event_factor = 1.3  # 30% uplift for seasonal campaigns
        elif event.event_type == MarketingEventType.TRADE_SHOW:
            event_factor = 1.1  # 10% uplift for trade shows
        else:
            event_factor = 1.15  # 15% default uplift
        
        # Calculate duration-based impact
        event_duration = (event.end_date - event.start_date).days + 1
        month_days = (month_end - month_start).days + 1
        duration_factor = min(event_duration / month_days, 1.0)
        
        # Apply weighted impact
        weighted_factor = 1.0 + (event_factor - 1.0) * duration_factor
        adjustment_factor *= weighted_factor
        
        events_impact.append({
            "event_name": event.campaign_name,
            "event_type": event.event_type.value,
            "duration_days": event_duration,
            "impact_factor": weighted_factor
        })
    
    return {
        "adjustment_factor": adjustment_factor,
        "events_impact": events_impact,
        "base_forecast": base_forecast,
        "adjusted_forecast": base_forecast * adjustment_factor
    }


@router.get("/", response_model=List[DemandForecastResponse])
def read_forecasts(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    product_id: int = None,
    method: ForecastMethod = None,
    status: ForecastStatus = None,
    period_from: date = None,
    period_to: date = None,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Retrieve demand forecasts with filtering options."""
    
    query = db.query(DemandForecast)
    
    # Apply filters
    if product_id:
        query = query.filter(DemandForecast.product_id == product_id)
    
    if method:
        query = query.filter(DemandForecast.method == method)
    
    if status:
        query = query.filter(DemandForecast.status == status)
    
    if period_from:
        query = query.filter(DemandForecast.forecast_period >= period_from)
    
    if period_to:
        query = query.filter(DemandForecast.forecast_period <= period_to)
    
    # Order by forecast period
    query = query.order_by(DemandForecast.forecast_period.desc())
    
    # Apply pagination
    forecasts = query.offset(skip).limit(limit).all()
    return forecasts


@router.get("/accuracy")
def get_forecast_accuracy(
    *,
    db: Session = Depends(get_db),
    evaluation_periods: int = Query(6, description="Number of past periods to evaluate"),
    product_id: Optional[int] = Query(None, description="Specific product ID"),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Calculate forecast accuracy metrics."""
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=evaluation_periods * 30)
    
    # Get forecasts for evaluation period
    forecast_query = db.query(DemandForecast).filter(
        DemandForecast.forecast_period.between(start_date, end_date),
        DemandForecast.status == ForecastStatus.ACTIVE
    )
    
    if product_id:
        forecast_query = forecast_query.filter(DemandForecast.product_id == product_id)
    
    forecasts = forecast_query.all()
    
    accuracy_results = []
    overall_metrics = {
        'total_forecasts': 0,
        'evaluated_forecasts': 0,
        'mae_sum': 0,
        'mse_sum': 0,
        'mape_sum': 0,
        'valid_mape_count': 0
    }
    
    for forecast in forecasts:
        # Find actual sales for the forecast period
        forecast_month_start = forecast.forecast_period.replace(day=1)
        forecast_month_end = (forecast_month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        actual_sales = db.query(
            func.sum(SalesActual.quantity_sold).label('total_actual')
        ).filter(
            SalesActual.product_id == forecast.product_id,
            SalesActual.sale_date.between(forecast_month_start, forecast_month_end)
        ).scalar()
        
        if actual_sales is not None:
            actual_quantity = float(actual_sales)
            forecast_quantity = float(forecast.forecast_quantity)
            
            # Calculate accuracy metrics
            error = forecast_quantity - actual_quantity
            absolute_error = abs(error)
            squared_error = error ** 2
            
            if actual_quantity > 0:
                percentage_error = (error / actual_quantity) * 100
                absolute_percentage_error = abs(percentage_error)
            else:
                percentage_error = 0 if error == 0 else float('inf')
                absolute_percentage_error = float('inf')
            
            # Get product details
            product = db.query(Product).filter(Product.id == forecast.product_id).first()
            
            accuracy_results.append({
                "forecast_id": forecast.id,
                "product_id": forecast.product_id,
                "product_code": product.product_code if product else f"PROD-{forecast.product_id}",
                "product_name": product.name if product else "Unknown Product",
                "forecast_period": forecast.forecast_period.isoformat(),
                "forecast_quantity": forecast_quantity,
                "actual_quantity": actual_quantity,
                "error": round(error, 2),
                "absolute_error": round(absolute_error, 2),
                "percentage_error": round(percentage_error, 2) if percentage_error != float('inf') else None,
                "absolute_percentage_error": round(absolute_percentage_error, 2) if absolute_percentage_error != float('inf') else None,
                "method": forecast.method.value
            })
            
            # Update overall metrics
            overall_metrics['evaluated_forecasts'] += 1
            overall_metrics['mae_sum'] += absolute_error
            overall_metrics['mse_sum'] += squared_error
            
            if absolute_percentage_error != float('inf'):
                overall_metrics['mape_sum'] += absolute_percentage_error
                overall_metrics['valid_mape_count'] += 1
        
        overall_metrics['total_forecasts'] += 1
    
    # Calculate overall accuracy metrics
    if overall_metrics['evaluated_forecasts'] > 0:
        mae = overall_metrics['mae_sum'] / overall_metrics['evaluated_forecasts']
        mse = overall_metrics['mse_sum'] / overall_metrics['evaluated_forecasts']
        rmse = np.sqrt(mse)
        
        if overall_metrics['valid_mape_count'] > 0:
            mape = overall_metrics['mape_sum'] / overall_metrics['valid_mape_count']
        else:
            mape = None
    else:
        mae = mse = rmse = mape = None
    
    # Calculate accuracy by method
    method_accuracy = {}
    for result in accuracy_results:
        method = result['method']
        if method not in method_accuracy:
            method_accuracy[method] = {
                'count': 0,
                'mae_sum': 0,
                'mape_sum': 0,
                'valid_mape_count': 0
            }
        
        method_accuracy[method]['count'] += 1
        method_accuracy[method]['mae_sum'] += result['absolute_error']
        
        if result['absolute_percentage_error'] is not None:
            method_accuracy[method]['mape_sum'] += result['absolute_percentage_error']
            method_accuracy[method]['valid_mape_count'] += 1
    
    # Calculate averages for each method
    method_summary = {}
    for method, metrics in method_accuracy.items():
        if metrics['count'] > 0:
            mae_avg = metrics['mae_sum'] / metrics['count']
            mape_avg = metrics['mape_sum'] / metrics['valid_mape_count'] if metrics['valid_mape_count'] > 0 else None
            
            method_summary[method] = {
                'forecast_count': metrics['count'],
                'mae': round(mae_avg, 2),
                'mape': round(mape_avg, 2) if mape_avg is not None else None
            }
    
    return {
        "evaluation_period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "months": evaluation_periods
        },
        "summary": {
            "total_forecasts": overall_metrics['total_forecasts'],
            "evaluated_forecasts": overall_metrics['evaluated_forecasts'],
            "mae": round(mae, 2) if mae is not None else None,
            "rmse": round(rmse, 2) if rmse is not None else None,
            "mape": round(mape, 2) if mape is not None else None
        },
        "accuracy_by_method": method_summary,
        "detailed_results": accuracy_results
    }


@router.put("/{forecast_id}", response_model=DemandForecastResponse)
def update_forecast(
    *,
    db: Session = Depends(get_db),
    forecast_id: int,
    forecast_in: DemandForecastUpdate,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Update a demand forecast."""
    
    forecast = db.query(DemandForecast).filter(DemandForecast.id == forecast_id).first()
    if not forecast:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Forecast not found"
        )
    
    # Update forecast fields
    update_data = forecast_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(forecast, field, value)
    
    # Add update note
    if forecast.notes:
        forecast.notes += f"\nUpdated by {current_user.username} on {datetime.now().isoformat()}"
    else:
        forecast.notes = f"Updated by {current_user.username} on {datetime.now().isoformat()}"
    
    db.commit()
    db.refresh(forecast)
    
    return forecast


@router.delete("/{forecast_id}")
def delete_forecast(
    *,
    db: Session = Depends(get_db),
    forecast_id: int,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Delete a forecast (set as inactive)."""
    
    forecast = db.query(DemandForecast).filter(DemandForecast.id == forecast_id).first()
    if not forecast:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Forecast not found"
        )
    
    # Soft delete by setting status to inactive
    forecast.status = ForecastStatus.INACTIVE
    
    db.commit()
    
    return {"message": "Forecast deactivated successfully"}


@router.get("/methods", response_model=List[str])
def get_forecast_methods(
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get list of available forecasting methods."""
    return [method.value for method in ForecastMethod]


@router.get("/stats")
def get_forecasting_statistics(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get forecasting statistics summary."""
    
    # Total forecasts
    total_forecasts = db.query(DemandForecast).count()
    active_forecasts = db.query(DemandForecast).filter(DemandForecast.status == ForecastStatus.ACTIVE).count()
    
    # Forecasts by method
    method_stats = {}
    for method in ForecastMethod:
        count = db.query(DemandForecast).filter(
            DemandForecast.method == method,
            DemandForecast.status == ForecastStatus.ACTIVE
        ).count()
        method_stats[method.value] = count
    
    # Recent forecast generation
    recent_date = datetime.now().date() - timedelta(days=7)
    recent_forecasts = db.query(DemandForecast).filter(
        DemandForecast.created_at >= recent_date
    ).count()
    
    # Products with forecasts
    products_with_forecasts = db.query(DemandForecast.product_id).distinct().count()
    
    return {
        "total_forecasts": total_forecasts,
        "active_forecasts": active_forecasts,
        "method_breakdown": method_stats,
        "recent_forecasts_7_days": recent_forecasts,
        "products_with_forecasts": products_with_forecasts
    }