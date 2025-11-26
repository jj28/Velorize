from typing import Any, List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from datetime import datetime, date, timedelta
from decimal import Decimal

from app.core.deps import get_db, get_current_verified_user, get_sop_leader_or_admin
from app.models.user import User
from app.models.product import Product
from app.models.customer import Customer
from app.models.marketing import MarketingCalendar, MarketingEventType, EventStatus
from app.models.aop import AnnualOperatingPlan, AOPStatus, PlanPeriod
from app.models.sales import SalesActual
from app.schemas.marketing import (
    MarketingCalendarCreate, MarketingCalendarUpdate, MarketingCalendarResponse
)
from app.schemas.aop import (
    AOPCreate, AOPUpdate, AOPResponse, AOPTargetCreate, AOPTargetUpdate
)

router = APIRouter()


@router.get("/calendar", response_model=List[MarketingCalendarResponse])
def read_marketing_calendar(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    event_type: MarketingEventType = None,
    status: EventStatus = None,
    date_from: date = None,
    date_to: date = None,
    search: str = None,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Retrieve marketing calendar events with filtering options."""
    
    query = db.query(MarketingCalendar)
    
    # Apply filters
    if event_type:
        query = query.filter(MarketingCalendar.event_type == event_type)
    
    if status:
        query = query.filter(MarketingCalendar.status == status)
    
    if date_from:
        query = query.filter(MarketingCalendar.start_date >= date_from)
    
    if date_to:
        query = query.filter(MarketingCalendar.end_date <= date_to)
    
    if search:
        query = query.filter(
            or_(
                MarketingCalendar.campaign_name.ilike(f"%{search}%"),
                MarketingCalendar.description.ilike(f"%{search}%")
            )
        )
    
    # Order by start date
    query = query.order_by(MarketingCalendar.start_date.desc())
    
    # Apply pagination
    events = query.offset(skip).limit(limit).all()
    return events


@router.post("/calendar", response_model=MarketingCalendarResponse, status_code=status.HTTP_201_CREATED)
def create_marketing_event(
    *,
    db: Session = Depends(get_db),
    event_in: MarketingCalendarCreate,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Create new marketing calendar event."""
    
    # Validate date range
    if event_in.end_date < event_in.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date"
        )
    
    # Check for overlapping events with same name
    existing_event = db.query(MarketingCalendar).filter(
        MarketingCalendar.campaign_name == event_in.campaign_name,
        or_(
            and_(
                MarketingCalendar.start_date <= event_in.end_date,
                MarketingCalendar.end_date >= event_in.start_date
            )
        )
    ).first()
    
    if existing_event:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Overlapping event '{event_in.campaign_name}' already exists in this period"
        )
    
    # Validate target customers if specified
    if event_in.target_customer_ids:
        customer_count = db.query(Customer).filter(
            Customer.id.in_(event_in.target_customer_ids)
        ).count()
        
        if customer_count != len(event_in.target_customer_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Some target customers do not exist"
            )
    
    # Create new event
    event_data = event_in.dict(exclude={'target_customer_ids'})
    event = MarketingCalendar(**event_data)
    
    db.add(event)
    db.flush()  # Get the event ID
    
    # Add target customers if specified
    if event_in.target_customer_ids:
        # Store as JSON for simplicity - in production you might want a separate table
        event.target_customer_ids = event_in.target_customer_ids
    
    event.created_by = current_user.id
    
    db.commit()
    db.refresh(event)
    
    return event


@router.get("/calendar/{event_id}", response_model=MarketingCalendarResponse)
def read_marketing_event(
    *,
    db: Session = Depends(get_db),
    event_id: int,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get marketing event by ID."""
    
    event = db.query(MarketingCalendar).filter(MarketingCalendar.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Marketing event not found"
        )
    
    return event


@router.put("/calendar/{event_id}", response_model=MarketingCalendarResponse)
def update_marketing_event(
    *,
    db: Session = Depends(get_db),
    event_id: int,
    event_in: MarketingCalendarUpdate,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Update a marketing event."""
    
    event = db.query(MarketingCalendar).filter(MarketingCalendar.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Marketing event not found"
        )
    
    # Validate date range if being updated
    if event_in.start_date and event_in.end_date:
        if event_in.end_date < event_in.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be after start date"
            )
    
    # Update event fields
    update_data = event_in.dict(exclude_unset=True, exclude={'target_customer_ids'})
    for field, value in update_data.items():
        setattr(event, field, value)
    
    # Update target customers if specified
    if event_in.target_customer_ids is not None:
        if event_in.target_customer_ids:
            customer_count = db.query(Customer).filter(
                Customer.id.in_(event_in.target_customer_ids)
            ).count()
            
            if customer_count != len(event_in.target_customer_ids):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Some target customers do not exist"
                )
        
        event.target_customer_ids = event_in.target_customer_ids
    
    db.commit()
    db.refresh(event)
    
    return event


@router.delete("/calendar/{event_id}")
def delete_marketing_event(
    *,
    db: Session = Depends(get_db),
    event_id: int,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Delete a marketing event (soft delete by setting inactive)."""
    
    event = db.query(MarketingCalendar).filter(MarketingCalendar.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Marketing event not found"
        )
    
    # Soft delete by setting status to cancelled
    event.status = EventStatus.CANCELLED
    event.is_active = False
    
    db.commit()
    
    return {"message": "Marketing event cancelled successfully"}


@router.get("/calendar/upcoming")
def get_upcoming_events(
    *,
    db: Session = Depends(get_db),
    days_ahead: int = Query(30, description="Number of days to look ahead"),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get upcoming marketing events."""
    
    start_date = datetime.now().date()
    end_date = start_date + timedelta(days=days_ahead)
    
    events = db.query(MarketingCalendar).filter(
        MarketingCalendar.start_date.between(start_date, end_date),
        MarketingCalendar.is_active == True,
        MarketingCalendar.status != EventStatus.CANCELLED
    ).order_by(MarketingCalendar.start_date).all()
    
    return {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": days_ahead
        },
        "upcoming_events": events,
        "total_events": len(events)
    }


@router.get("/calendar/impact-analysis")
def get_marketing_impact_analysis(
    *,
    db: Session = Depends(get_db),
    event_id: Optional[int] = Query(None, description="Specific event ID"),
    analysis_months: int = Query(6, description="Number of months to analyze"),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Analyze the impact of marketing events on sales."""
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=analysis_months * 30)
    
    # Get marketing events in the analysis period
    events_query = db.query(MarketingCalendar).filter(
        MarketingCalendar.start_date.between(start_date, end_date),
        MarketingCalendar.status == EventStatus.COMPLETED
    )
    
    if event_id:
        events_query = events_query.filter(MarketingCalendar.id == event_id)
    
    events = events_query.all()
    
    impact_analysis = []
    
    for event in events:
        # Define analysis windows
        event_start = event.start_date
        event_end = event.end_date
        event_duration = (event_end - event_start).days + 1
        
        # Pre-event period (same duration before event)
        pre_start = event_start - timedelta(days=event_duration)
        pre_end = event_start - timedelta(days=1)
        
        # Post-event period (same duration after event)
        post_start = event_end + timedelta(days=1)
        post_end = event_end + timedelta(days=event_duration)
        
        # Get sales data for each period
        def get_period_sales(start_dt, end_dt):
            sales = db.query(
                func.sum(SalesActual.quantity_sold).label('total_quantity'),
                func.sum(SalesActual.net_amount).label('total_revenue'),
                func.count(SalesActual.id).label('transaction_count')
            ).filter(
                SalesActual.sale_date.between(start_dt, end_dt)
            )
            
            # Filter by target customers if specified
            if event.target_customer_ids:
                sales = sales.filter(SalesActual.customer_id.in_(event.target_customer_ids))
            
            return sales.first()
        
        pre_sales = get_period_sales(pre_start, pre_end)
        event_sales = get_period_sales(event_start, event_end)
        post_sales = get_period_sales(post_start, post_end)
        
        # Calculate impact metrics
        def calculate_impact(baseline, event_period):
            if not baseline or not event_period:
                return {
                    'quantity_uplift': 0,
                    'revenue_uplift': 0,
                    'quantity_uplift_percentage': 0,
                    'revenue_uplift_percentage': 0
                }
            
            baseline_qty = float(baseline.total_quantity or 0)
            baseline_rev = float(baseline.total_revenue or 0)
            event_qty = float(event_period.total_quantity or 0)
            event_rev = float(event_period.total_revenue or 0)
            
            qty_uplift = event_qty - baseline_qty
            rev_uplift = event_rev - baseline_rev
            
            qty_uplift_pct = (qty_uplift / baseline_qty * 100) if baseline_qty > 0 else 0
            rev_uplift_pct = (rev_uplift / baseline_rev * 100) if baseline_rev > 0 else 0
            
            return {
                'quantity_uplift': round(qty_uplift, 2),
                'revenue_uplift': round(rev_uplift, 2),
                'quantity_uplift_percentage': round(qty_uplift_pct, 2),
                'revenue_uplift_percentage': round(rev_uplift_pct, 2)
            }
        
        impact_metrics = calculate_impact(pre_sales, event_sales)
        
        # Calculate ROI if budget is specified
        roi_analysis = None
        if event.budget_rm and event.budget_rm > 0:
            revenue_uplift = impact_metrics['revenue_uplift']
            roi = ((revenue_uplift - float(event.budget_rm)) / float(event.budget_rm) * 100)
            
            roi_analysis = {
                'budget_rm': float(event.budget_rm),
                'revenue_uplift_rm': revenue_uplift,
                'roi_percentage': round(roi, 2),
                'cost_per_unit_sold': round(float(event.budget_rm) / float(event_sales.total_quantity), 2) if event_sales and event_sales.total_quantity else 0
            }
        
        impact_analysis.append({
            "event_id": event.id,
            "campaign_name": event.campaign_name,
            "event_type": event.event_type.value,
            "event_period": {
                "start_date": event_start.isoformat(),
                "end_date": event_end.isoformat(),
                "duration_days": event_duration
            },
            "sales_metrics": {
                "pre_event": {
                    "period": f"{pre_start.isoformat()} to {pre_end.isoformat()}",
                    "quantity": float(pre_sales.total_quantity or 0),
                    "revenue": float(pre_sales.total_revenue or 0),
                    "transactions": int(pre_sales.transaction_count or 0)
                },
                "during_event": {
                    "period": f"{event_start.isoformat()} to {event_end.isoformat()}",
                    "quantity": float(event_sales.total_quantity or 0),
                    "revenue": float(event_sales.total_revenue or 0),
                    "transactions": int(event_sales.transaction_count or 0)
                },
                "post_event": {
                    "period": f"{post_start.isoformat()} to {post_end.isoformat()}",
                    "quantity": float(post_sales.total_quantity or 0),
                    "revenue": float(post_sales.total_revenue or 0),
                    "transactions": int(post_sales.transaction_count or 0)
                }
            },
            "impact_analysis": impact_metrics,
            "roi_analysis": roi_analysis
        })
    
    # Calculate overall summary
    total_budget = sum(float(event.budget_rm or 0) for event in events)
    total_revenue_uplift = sum(analysis["impact_analysis"]["revenue_uplift"] for analysis in impact_analysis)
    average_uplift_percentage = np.mean([analysis["impact_analysis"]["revenue_uplift_percentage"] for analysis in impact_analysis]) if impact_analysis else 0
    
    return {
        "analysis_period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "months": analysis_months
        },
        "summary": {
            "total_events_analyzed": len(impact_analysis),
            "total_budget_rm": round(total_budget, 2),
            "total_revenue_uplift_rm": round(total_revenue_uplift, 2),
            "overall_roi_percentage": round(((total_revenue_uplift - total_budget) / total_budget * 100), 2) if total_budget > 0 else 0,
            "average_uplift_percentage": round(average_uplift_percentage, 2)
        },
        "event_analysis": impact_analysis
    }


@router.get("/types", response_model=List[str])
def get_marketing_event_types(
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get list of all marketing event types."""
    return [event_type.value for event_type in MarketingEventType]


# AOP (Annual Operating Plan) Management


@router.get("/aop", response_model=List[AOPResponse])
def read_aop_plans(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: AOPStatus = None,
    plan_year: int = None,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Retrieve Annual Operating Plans with filtering options."""
    
    query = db.query(AnnualOperatingPlan)
    
    # Apply filters
    if status:
        query = query.filter(AnnualOperatingPlan.status == status)
    
    if plan_year:
        query = query.filter(AnnualOperatingPlan.plan_year == plan_year)
    
    # Order by plan year descending
    query = query.order_by(AnnualOperatingPlan.plan_year.desc())
    
    # Apply pagination
    plans = query.offset(skip).limit(limit).all()
    return plans


@router.post("/aop", response_model=AOPResponse, status_code=status.HTTP_201_CREATED)
def create_aop_plan(
    *,
    db: Session = Depends(get_db),
    aop_in: AOPCreate,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Create new Annual Operating Plan."""
    
    # Check if AOP already exists for this year
    existing_aop = db.query(AnnualOperatingPlan).filter(
        AnnualOperatingPlan.plan_year == aop_in.plan_year
    ).first()
    
    if existing_aop:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"AOP for year {aop_in.plan_year} already exists"
        )
    
    # Create new AOP
    aop_data = aop_in.dict()
    aop = AnnualOperatingPlan(**aop_data)
    aop.created_by = current_user.id
    
    db.add(aop)
    db.commit()
    db.refresh(aop)
    
    return aop


@router.get("/aop/{aop_id}", response_model=AOPResponse)
def read_aop_plan(
    *,
    db: Session = Depends(get_db),
    aop_id: int,
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get AOP plan by ID."""
    
    aop = db.query(AnnualOperatingPlan).filter(AnnualOperatingPlan.id == aop_id).first()
    if not aop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AOP plan not found"
        )
    
    return aop


@router.put("/aop/{aop_id}", response_model=AOPResponse)
def update_aop_plan(
    *,
    db: Session = Depends(get_db),
    aop_id: int,
    aop_in: AOPUpdate,
    current_user: User = Depends(get_sop_leader_or_admin)
) -> Any:
    """Update an AOP plan."""
    
    aop = db.query(AnnualOperatingPlan).filter(AnnualOperatingPlan.id == aop_id).first()
    if not aop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AOP plan not found"
        )
    
    # Update AOP fields
    update_data = aop_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(aop, field, value)
    
    db.commit()
    db.refresh(aop)
    
    return aop


@router.get("/aop/{aop_id}/performance")
def get_aop_performance(
    *,
    db: Session = Depends(get_db),
    aop_id: int,
    period: PlanPeriod = Query(PlanPeriod.YEARLY, description="Performance period"),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get AOP performance analysis against actual results."""
    
    aop = db.query(AnnualOperatingPlan).filter(AnnualOperatingPlan.id == aop_id).first()
    if not aop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AOP plan not found"
        )
    
    # Define period dates
    plan_year = aop.plan_year
    
    if period == PlanPeriod.YEARLY:
        start_date = date(plan_year, 1, 1)
        end_date = date(plan_year, 12, 31)
        period_label = f"Full Year {plan_year}"
    elif period == PlanPeriod.QUARTERLY:
        # Get current quarter
        current_quarter = (datetime.now().month - 1) // 3 + 1
        start_date = date(plan_year, (current_quarter - 1) * 3 + 1, 1)
        if current_quarter == 4:
            end_date = date(plan_year, 12, 31)
        else:
            end_date = date(plan_year, current_quarter * 3, 1) - timedelta(days=1)
        period_label = f"Q{current_quarter} {plan_year}"
    else:  # Monthly
        current_month = datetime.now().month
        start_date = date(plan_year, current_month, 1)
        if current_month == 12:
            end_date = date(plan_year, 12, 31)
        else:
            end_date = date(plan_year, current_month + 1, 1) - timedelta(days=1)
        period_label = f"{datetime.now().strftime('%B')} {plan_year}"
    
    # Get actual sales data for the period
    actual_sales = db.query(
        func.sum(SalesActual.quantity_sold).label('total_quantity'),
        func.sum(SalesActual.net_amount).label('total_revenue')
    ).filter(
        SalesActual.sale_date.between(start_date, end_date)
    ).first()
    
    actual_quantity = float(actual_sales.total_quantity or 0)
    actual_revenue = float(actual_sales.total_revenue or 0)
    
    # Calculate targets based on period
    if period == PlanPeriod.YEARLY:
        target_revenue = float(aop.target_revenue_rm)
        target_volume = float(aop.target_volume_units or 0)
    elif period == PlanPeriod.QUARTERLY:
        target_revenue = float(aop.target_revenue_rm) / 4  # Assume even distribution
        target_volume = float(aop.target_volume_units or 0) / 4
    else:  # Monthly
        target_revenue = float(aop.target_revenue_rm) / 12
        target_volume = float(aop.target_volume_units or 0) / 12
    
    # Calculate variances
    revenue_variance = actual_revenue - target_revenue
    revenue_variance_pct = (revenue_variance / target_revenue * 100) if target_revenue > 0 else 0
    
    volume_variance = actual_quantity - target_volume
    volume_variance_pct = (volume_variance / target_volume * 100) if target_volume > 0 else 0
    
    # Calculate achievement rates
    revenue_achievement = (actual_revenue / target_revenue * 100) if target_revenue > 0 else 0
    volume_achievement = (actual_quantity / target_volume * 100) if target_volume > 0 else 0
    
    # Performance status
    if revenue_achievement >= 100:
        performance_status = "EXCEEDING"
    elif revenue_achievement >= 90:
        performance_status = "ON_TRACK"
    elif revenue_achievement >= 75:
        performance_status = "BELOW_TARGET"
    else:
        performance_status = "SIGNIFICANTLY_BELOW"
    
    return {
        "aop_details": {
            "id": aop.id,
            "plan_year": aop.plan_year,
            "status": aop.status.value
        },
        "period": {
            "type": period.value,
            "label": period_label,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "targets": {
            "revenue_rm": round(target_revenue, 2),
            "volume_units": round(target_volume, 2)
        },
        "actuals": {
            "revenue_rm": round(actual_revenue, 2),
            "volume_units": round(actual_quantity, 2)
        },
        "performance": {
            "revenue_achievement_percentage": round(revenue_achievement, 2),
            "volume_achievement_percentage": round(volume_achievement, 2),
            "revenue_variance_rm": round(revenue_variance, 2),
            "revenue_variance_percentage": round(revenue_variance_pct, 2),
            "volume_variance_units": round(volume_variance, 2),
            "volume_variance_percentage": round(volume_variance_pct, 2),
            "overall_status": performance_status
        }
    }


@router.get("/aop/current/dashboard")
def get_current_aop_dashboard(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get dashboard view of current year AOP performance."""
    
    current_year = datetime.now().year
    
    # Get current AOP
    current_aop = db.query(AnnualOperatingPlan).filter(
        AnnualOperatingPlan.plan_year == current_year,
        AnnualOperatingPlan.status == AOPStatus.ACTIVE
    ).first()
    
    if not current_aop:
        return {
            "message": f"No active AOP found for {current_year}",
            "has_aop": False
        }
    
    # Calculate year-to-date performance
    ytd_start = date(current_year, 1, 1)
    ytd_end = datetime.now().date()
    days_elapsed = (ytd_end - ytd_start).days + 1
    days_in_year = 366 if current_year % 4 == 0 else 365
    year_progress_pct = (days_elapsed / days_in_year) * 100
    
    # Get YTD actuals
    ytd_sales = db.query(
        func.sum(SalesActual.quantity_sold).label('total_quantity'),
        func.sum(SalesActual.net_amount).label('total_revenue')
    ).filter(
        SalesActual.sale_date.between(ytd_start, ytd_end)
    ).first()
    
    ytd_revenue = float(ytd_sales.total_revenue or 0)
    ytd_volume = float(ytd_sales.total_quantity or 0)
    
    # Calculate expected vs actual based on time elapsed
    expected_revenue = float(current_aop.target_revenue_rm) * (year_progress_pct / 100)
    expected_volume = float(current_aop.target_volume_units or 0) * (year_progress_pct / 100)
    
    # Monthly performance trend
    monthly_performance = []
    for month in range(1, datetime.now().month + 1):
        month_start = date(current_year, month, 1)
        if month == 12:
            month_end = date(current_year, 12, 31)
        else:
            month_end = date(current_year, month + 1, 1) - timedelta(days=1)
        
        if month_end > datetime.now().date():
            month_end = datetime.now().date()
        
        monthly_sales = db.query(
            func.sum(SalesActual.net_amount).label('revenue')
        ).filter(
            SalesActual.sale_date.between(month_start, month_end)
        ).scalar() or 0
        
        monthly_target = float(current_aop.target_revenue_rm) / 12
        achievement_pct = (float(monthly_sales) / monthly_target * 100) if monthly_target > 0 else 0
        
        monthly_performance.append({
            "month": month,
            "month_name": month_start.strftime('%B'),
            "actual_revenue": round(float(monthly_sales), 2),
            "target_revenue": round(monthly_target, 2),
            "achievement_percentage": round(achievement_pct, 2)
        })
    
    return {
        "has_aop": True,
        "aop_details": {
            "id": current_aop.id,
            "plan_year": current_aop.plan_year,
            "target_revenue_rm": float(current_aop.target_revenue_rm),
            "target_volume_units": float(current_aop.target_volume_units or 0),
            "target_profit_margin": float(current_aop.target_profit_margin_percentage or 0)
        },
        "year_progress": {
            "days_elapsed": days_elapsed,
            "days_remaining": days_in_year - days_elapsed,
            "progress_percentage": round(year_progress_pct, 1)
        },
        "ytd_performance": {
            "actual_revenue": round(ytd_revenue, 2),
            "actual_volume": round(ytd_volume, 2),
            "expected_revenue": round(expected_revenue, 2),
            "expected_volume": round(expected_volume, 2),
            "revenue_vs_expected_pct": round((ytd_revenue / expected_revenue * 100), 2) if expected_revenue > 0 else 0,
            "volume_vs_expected_pct": round((ytd_volume / expected_volume * 100), 2) if expected_volume > 0 else 0
        },
        "monthly_trend": monthly_performance,
        "key_metrics": {
            "revenue_on_track": ytd_revenue >= expected_revenue * 0.95,  # Within 5% of expected
            "volume_on_track": ytd_volume >= expected_volume * 0.95,
            "ahead_of_plan": ytd_revenue > expected_revenue * 1.05,  # More than 5% ahead
            "requires_attention": ytd_revenue < expected_revenue * 0.85  # More than 15% behind
        }
    }


@router.get("/stats")
def get_marketing_statistics(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user)
) -> Any:
    """Get marketing and AOP statistics summary."""
    
    # Marketing calendar stats
    total_events = db.query(MarketingCalendar).count()
    active_events = db.query(MarketingCalendar).filter(
        MarketingCalendar.is_active == True,
        MarketingCalendar.status != EventStatus.CANCELLED
    ).count()
    
    # Current month events
    current_month_start = datetime.now().date().replace(day=1)
    next_month_start = (current_month_start + timedelta(days=32)).replace(day=1)
    current_month_events = db.query(MarketingCalendar).filter(
        MarketingCalendar.start_date >= current_month_start,
        MarketingCalendar.start_date < next_month_start,
        MarketingCalendar.is_active == True
    ).count()
    
    # Events by type
    event_type_stats = {}
    for event_type in MarketingEventType:
        count = db.query(MarketingCalendar).filter(
            MarketingCalendar.event_type == event_type,
            MarketingCalendar.is_active == True
        ).count()
        event_type_stats[event_type.value] = count
    
    # AOP stats
    current_year = datetime.now().year
    current_aop = db.query(AnnualOperatingPlan).filter(
        AnnualOperatingPlan.plan_year == current_year,
        AnnualOperatingPlan.status == AOPStatus.ACTIVE
    ).first()
    
    has_current_aop = current_aop is not None
    total_aops = db.query(AnnualOperatingPlan).count()
    
    return {
        "marketing_calendar": {
            "total_events": total_events,
            "active_events": active_events,
            "current_month_events": current_month_events,
            "event_type_breakdown": event_type_stats
        },
        "aop_status": {
            "has_current_year_aop": has_current_aop,
            "current_year": current_year,
            "total_aop_plans": total_aops
        }
    }