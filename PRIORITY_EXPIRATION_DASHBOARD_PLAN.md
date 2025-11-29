# Priority Expiration Dashboard - Implementation Plan

**Project**: Velorize S&OP Platform  
**Feature**: Priority Expiration Dashboard (F&B Critical)  
**Date**: November 28, 2025  
**Status**: Planning Phase - CRITICAL

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Theme Color System](#2-theme-color-system)
3. [Dashboard Component Analysis](#3-dashboard-component-analysis)
4. [PRM System Research & Best Practices](#4-prm-system-research--best-practices)
5. [Data Architecture & Backend Design](#5-data-architecture--backend-design)
6. [Frontend Button Functionality Audit](#6-frontend-button-functionality-audit)
7. [Implementation Roadmap](#7-implementation-roadmap)
8. [Technical Specifications](#8-technical-specifications)
9. [Testing & Quality Assurance](#9-testing--quality-assurance)

---

## 1. Executive Summary

### 1.1 Objective
Implement a real-time Priority Expiration Dashboard that analyzes shelf life versus replenishment lead times (TRLT), helping F&B businesses prevent waste, minimize value at risk, and optimize inventory clearance strategies.

### 1.2 Key Features
- **Immediate Value at Risk Tracking**: Real-time monitoring of products requiring immediate clearance
- **Projected Risk Analysis**: 7-day forward-looking risk assessment
- **Action Required Table**: Prioritized list with countdown timers and recommended actions
- **Strategic Ordering Visualization**: Scatter plot comparing TRLT vs. shelf life for strategic insights
- **Risk Calculation Logic Display**: Transparent methodology for business decisions

### 1.3 Business Value
- **Reduce Waste**: Proactive expiration management prevents spoilage
- **Optimize Cash Flow**: Strategic clearance actions (dispose, urgent sale, promo) minimize losses
- **Improve Decision Making**: Data-driven insights on when to order vs. clear inventory
- **Enhance Customer Satisfaction**: Ensures fresh products through better rotation

---

## 2. Theme Color System

### 2.1 Color Palette Analysis (from Screenshot)

Based on the provided screenshot, the theme follows a **professional, high-contrast design** suitable for critical inventory management:

#### Primary Colors
```typescript
{
  // Dark Navy Sidebar
  sidebarBackground: '#0F172A',     // slate-900
  sidebarText: '#E2E8F0',          // slate-200
  sidebarActive: '#3B82F6',         // blue-500
  
  // Main Content Area
  contentBackground: '#FFFFFF',     // white
  contentSecondary: '#F8FAFC',      // slate-50
  
  // Status Colors - Critical System
  critical: '#DC2626',              // red-600 (Immediate action)
  criticalLight: '#FEF2F2',         // red-50 (background)
  criticalBorder: '#FCA5A5',        // red-300 (border)
  
  warning: '#F59E0B',               // amber-500 (Projected risk)
  warningLight: '#FFFBEB',          // amber-50 (background)
  warningBorder: '#FCD34D',         // amber-300 (border)
  
  success: '#10B981',               // emerald-500
  successLight: '#D1FAE5',          // emerald-100
  
  // Text Hierarchy
  textPrimary: '#0F172A',           // slate-900
  textSecondary: '#64748B',         // slate-500
  textTertiary: '#94A3B8',          // slate-400
  
  // UI Elements
  border: '#E2E8F0',                // slate-200
  divider: '#F1F5F9',               // slate-100
  cardShadow: '0 1px 3px rgba(0,0,0,0.1)',
  
  // Interactive Elements
  buttonPrimary: '#DC2626',         // red-600 (action buttons)
  buttonSecondary: '#3B82F6',       // blue-500
  buttonOutline: '#E2E8F0',         // slate-200
}
```

### 2.2 MUI Theme Configuration

```typescript
// theme.ts
import { createTheme } from '@mui/material/styles';

export const velorizeTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3B82F6',      // Blue
      light: '#60A5FA',
      dark: '#2563EB',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#64748B',      // Slate
      light: '#94A3B8',
      dark: '#475569',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#DC2626',      // Red - Critical
      light: '#FCA5A5',
      dark: '#B91C1C',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F59E0B',      // Amber - Warning
      light: '#FCD34D',
      dark: '#D97706',
      contrastText: '#000000',
    },
    success: {
      main: '#10B981',      // Emerald
      light: '#6EE7B7',
      dark: '#059669',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
      disabled: '#CBD5E1',
    },
    divider: '#E2E8F0',
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h4: {
      fontSize: '1.75rem',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 1px 3px 0 rgba(0,0,0,0.1)',
    '0 4px 6px -1px rgba(0,0,0,0.1)',
    '0 10px 15px -3px rgba(0,0,0,0.1)',
    // ... rest of shadow values
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
        contained: {
          '&.MuiButton-containedError': {
            background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.75rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderRadius: 12,
        },
      },
    },
  },
});
```

---

## 3. Dashboard Component Analysis

### 3.1 Dashboard Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Priority Expiration Dashboard [F&B CRITICAL Badge] │
│ Subtitle: Real-time analysis of shelf life vs. TRLT        │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐  ┌─────────────────────────────┐ │
│ │ Safety Buffer: 5 Days│  │ Risk Calculation Logic       │ │
│ │ [Slider Control]     │  │ • Replenishment Time (Avg)   │ │
│ └──────────────────────┘  │ • Safety Buffer              │ │
│                           │ • Critical Action Threshold   │ │
│ ┌──────────────────────────┐ └─────────────────────────│ │
│ │ IMMEDIATE VALUE AT RISK  │                             │ │
│ │ $498                     │ PROJECTED RISK (NEXT 7 DAYS)│ │
│ │ 3 items require clearance│ $363                        │ │
│ └──────────────────────────┘ 2 items entering window    │ │
│                                                           │ │
├─────────────────────────────────────────────────────────────┤
│ Action Required Table                                     │ │
│ ┌─────┬──────────┬──────┬──────────┬───────┬────────┐   │ │
│ │Prod │Batch Det.│To Clr│Countdown │Value  │Action  │   │ │
│ │     │          │      │          │Loss   │        │   │ │
│ ├─────┼──────────┼──────┼──────────┼───────┼────────┤   │ │
│ │ ... │          │      │1 DAYS LFT│ $60   │DISPOSE │   │ │
│ │ ... │          │      │3 DAYS LFT│ $338  │RUN PROM│   │ │
│ └─────┴──────────┴──────┴──────────┴───────┴────────┘   │ │
├─────────────────────────────────────────────────────────────┤
│ Strategic Ordering (Scatter Plot)                        │ │
│ TRLT (Lead Time) vs. Shelf Life Analysis                 │ │
│ • Red Zone: Operationally difficult items                │ │
│ • Safe Zone: Strategic ordering window available         │ │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Component Breakdown

#### 3.2.1 Header Section
- **Badge**: "F&B CRITICAL" chip in red
- **Title**: "Priority Expiration Dashboard"
- **Subtitle**: "Real-time analysis of shelf life vs. replenishment lead times (TRLT)"
- **Safety Buffer Control**: Interactive slider (0-30 days range)

#### 3.2.2 Risk Summary Cards
1. **Immediate Value at Risk Card**
   - Large monetary value ($XXX)
   - Item count with urgency indicator
   - Red/pink background gradient
   - Alert icon

2. **Projected Risk Card**
   - Large monetary value ($XXX)
   - Item count with 7-day window
   - Yellow/amber background gradient
   - Warning icon

3. **Risk Calculation Logic Panel** (Right-side info box)
   - Replenishment Time (Avg): X.X Days
   - Safety Buffer: +X Days
   - Critical Action Threshold: -X.X Days

#### 3.2.3 Action Required Table
Columns:
- **Product**: Name and category
- **Batch Details**: LOT number, Expiry date
- **To Clear**: Quantity in units/kg
- **Countdown**: Days left with TRLT reference
- **Value Loss**: Monetary impact
- **Action**: Recommended action buttons (DISPOSE, RUN PROMO/MENU SPECIAL)

Features:
- Color-coded countdown (Red: 1 day, Orange: 3 days, etc.)
- Sortable by urgency
- Action buttons trigger workflows

#### 3.2.4 Strategic Ordering Chart
- **Type**: Scatter plot
- **X-Axis**: TRLT (Lead Time in days)
- **Y-Axis**: Replenishment Time vs. Shelf Life
- **Data Points**: Each product plotted by their TRLT ratio
- **Zones**:
  - Red Zone (Bottom-left): Items in red zone are operationally difficult
  - Safe Zone (Top-right): Strategic ordering window available

---

## 4. PRM System Research & Best Practices

### 4.1 Industry-Leading Systems Analysis

#### 4.1.1 SAP IBP (Integrated Business Planning)
**Expiration Management Features:**
- Real-time shelf life tracking with batch-level granularity
- Automated alerts for items approaching expiration
- FEFO (First Expired, First Out) inventory allocation
- Integration with demand planning to optimize replenishment

**Key Learnings:**
- Use batch/lot-level tracking for precise expiration management
- Implement multi-tier alerting (Critical, High, Medium)
- Provide "what-if" scenarios for clearance strategies
- Connect expiration data with sales planning

#### 4.1.2 Blue Yonder (formerly JDA)
**Fresh Item Management Module:**
- Shelf life vs. lead time gap analysis
- Automated markdown suggestions for near-expiry items
- Waste prediction algorithms
- Cross-functional visibility (procurement, sales, operations)

**Key Learnings:**
- Calculate "critical window" = Lead Time - Shelf Life Remaining
- Suggest pricing strategies (markdown %, BOGO, etc.)
- Track waste metrics to measure effectiveness
- Provide supply chain visibility across stakeholders

#### 4.1.3 Oracle Retail Demand Forecasting Cloud Service
**Perishable Goods Module:**
- Age-based inventory optimization
- Dynamic reorder points adjusted for shelf life
- Spoilage cost modeling
- Freshness-weighted demand forecasts

**Key Learnings:**
- Adjust safety stock based on remaining shelf life
- Model spoilage costs in inventory optimization
- Use historical waste data to improve forecasts
- Implement "freshness scores" for customer satisfaction

#### 4.1.4 Infor CloudSuite Food & Beverage
**Food Safety & Expiration Tracking:**
- Lot traceability and recall management
- Expiration-based allocation rules
- Quality assurance integration
- Compliance reporting (FDA, HACCP)

**Key Learnings:**
- Maintain full lot traceability for compliance
- Integrate quality scores with expiration data
- Automate compliance reporting
- Provide audit trails for food safety

### 4.2 Best Practices Summary

1. **Real-Time Visibility**: Update expiration data continuously, not batch
2. **Multi-Tier Alerting**: Critical (1-3 days), High (4-7 days), Medium (8-14 days)
3. **Action Recommendations**: Don't just alert - suggest specific actions
4. **Cost Modeling**: Show financial impact of different clearance strategies
5. **Integration**: Connect with procurement, sales, and operations systems
6. **Predictive Analytics**: Use ML to predict waste and optimize orders
7. **Mobile Access**: Enable warehouse staff to take action immediately
8. **Audit Trail**: Track all expiration-related decisions for compliance

---

## 5. Data Architecture & Backend Design

### 5.1 Database Schema

#### 5.1.1 New Tables Required

```sql
-- Expiration tracking table (lot/batch level)
CREATE TABLE inventory_lots (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    lot_number VARCHAR(50) NOT NULL UNIQUE,
    production_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_available DECIMAL(10,2) NOT NULL,
    quantity_allocated DECIMAL(10,2) DEFAULT 0,
    quantity_cleared DECIMAL(10,2) DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL,
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, NEAR_EXPIRY, EXPIRED, CLEARED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_quantity CHECK (quantity_available >= quantity_allocated + quantity_cleared)
);

CREATE INDEX idx_inventory_lots_expiry ON inventory_lots(expiry_date);
CREATE INDEX idx_inventory_lots_status ON inventory_lots(status);
CREATE INDEX idx_inventory_lots_product ON inventory_lots(product_id);

-- Expiration alerts/actions table
CREATE TABLE expiration_alerts (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER NOT NULL REFERENCES inventory_lots(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    alert_type VARCHAR(20) NOT NULL, -- CRITICAL, HIGH, MEDIUM
    risk_value DECIMAL(10,2) NOT NULL, -- Monetary value at risk
    days_to_expiry INTEGER NOT NULL,
    recommended_action VARCHAR(50), -- DISPOSE, URGENT_SALE, PROMO, MARKDOWN
    action_taken VARCHAR(50),
    action_taken_at TIMESTAMP,
    action_taken_by INTEGER REFERENCES users(id),
    cleared_quantity DECIMAL(10,2),
    cleared_value DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX idx_alerts_type ON expiration_alerts(alert_type);
CREATE INDEX idx_alerts_resolved ON expiration_alerts(resolved_at);

-- Clearance actions tracking
CREATE TABLE clearance_actions (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER REFERENCES expiration_alerts(id),
    lot_id INTEGER NOT NULL REFERENCES inventory_lots(id),
    action_type VARCHAR(50) NOT NULL, -- DISPOSE, SALE, PROMO, DONATE, MARKDOWN
    quantity DECIMAL(10,2) NOT NULL,
    original_value DECIMAL(10,2) NOT NULL,
    recovered_value DECIMAL(10,2) DEFAULT 0,
    loss_value DECIMAL(10,2) GENERATED ALWAYS AS (original_value - recovered_value) STORED,
    discount_percentage DECIMAL(5,2),
    customer_id INTEGER REFERENCES customers(id),
    sale_order_id INTEGER,
    notes TEXT,
    performed_by INTEGER REFERENCES users(id),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System configuration for expiration rules
CREATE TABLE expiration_config (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100), -- Product category or global
    safety_buffer_days INTEGER DEFAULT 5,
    critical_threshold_days INTEGER DEFAULT 3,
    high_threshold_days INTEGER DEFAULT 7,
    medium_threshold_days INTEGER DEFAULT 14,
    avg_replenishment_lead_time_days DECIMAL(5,2) DEFAULT 3.8,
    auto_alert_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Waste tracking and analytics
CREATE TABLE waste_analytics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    product_id INTEGER REFERENCES products(id),
    category VARCHAR(100),
    expired_quantity DECIMAL(10,2),
    expired_value DECIMAL(10,2),
    disposed_quantity DECIMAL(10,2),
    disposed_value DECIMAL(10,2),
    clearance_quantity DECIMAL(10,2),
    clearance_revenue DECIMAL(10,2),
    waste_percentage DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, product_id)
);
```

#### 5.1.2 Existing Table Extensions

```sql
-- Add expiration-related fields to products table
ALTER TABLE products ADD COLUMN shelf_life_days INTEGER;
ALTER TABLE products ADD COLUMN has_expiration BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN perishable_category VARCHAR(50); -- FROZEN, CHILLED, AMBIENT
ALTER TABLE products ADD COLUMN min_shelf_life_on_receipt_days INTEGER; -- Minimum acceptable shelf life when receiving

-- Add supplier lead time tracking
ALTER TABLE suppliers ADD COLUMN avg_lead_time_days DECIMAL(5,2);
ALTER TABLE suppliers ADD COLUMN min_order_quantity DECIMAL(10,2);
```

### 5.2 API Endpoints Design

#### 5.2.1 Priority Expiration Dashboard APIs

```typescript
// GET /api/expiration/dashboard
// Returns: Dashboard summary data
interface ExpirationDashboardResponse {
  summary: {
    immediateRisk: {
      totalValue: number;      // $498
      itemCount: number;        // 3 items
      lots: ExpirationLot[];
    };
    projectedRisk: {
      totalValue: number;      // $363
      itemCount: number;        // 2 items
      horizon_days: number;    // 7 days
      lots: ExpirationLot[];
    };
    safetyBuffer: number;      // 5 days (current setting)
  };
  riskCalculation: {
    avgReplenishmentTime: number;  // 3.8 days
    safetyBuffer: number;          // +5 days
    criticalThreshold: number;     // -8.8 days
  };
  config: ExpirationConfig;
}

interface ExpirationLot {
  lotId: number;
  lotNumber: string;
  productId: number;
  productCode: string;
  productName: string;
  category: string;
  batchDetails: {
    lotNumber: string;
    expiryDate: string;
    productionDate: string;
  };
  quantityToClear: number;
  unit: string;
  countdown: {
    daysLeft: number;
    trlt: string;          // "TRLT: 3d"
    urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  };
  valueLoss: number;
  recommendedAction: 'DISPOSE' | 'URGENT_SALE' | 'RUN_PROMO' | 'MARKDOWN' | 'DONATE';
  location: string;
}

// GET /api/expiration/action-required
// Returns: List of items requiring action (table data)
interface ActionRequiredResponse {
  items: ExpirationLot[];
  totalCount: number;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// GET /api/expiration/strategic-ordering
// Returns: Data for TRLT scatter plot
interface StratategicOrderingResponse {
  products: Array<{
    productId: number;
    productCode: string;
    productName: string;
    trlt: number;                // Lead time in days
    shelfLife: number;           // Total shelf life in days
    replenishmentTime: number;   // Avg replenishment time
    trltRatio: number;          // TRLT / Shelf Life
    riskZone: 'RED' | 'YELLOW' | 'GREEN';
    currentStock: number;
    nearExpiryValue: number;
  }>;
}

// POST /api/expiration/take-action
// Executes clearance action
interface TakeActionRequest {
  alertId?: number;
  lotId: number;
  actionType: 'DISPOSE' | 'URGENT_SALE' | 'RUN_PROMO' | 'MARKDOWN' | 'DONATE';
  quantity: number;
  discountPercentage?: number;
  notes?: string;
}

interface TakeActionResponse {
  success: boolean;
  actionId: number;
  message: string;
  updatedLot: ExpirationLot;
}

// PUT /api/expiration/config
// Updates configuration (safety buffer, thresholds)
interface UpdateConfigRequest {
  safetyBufferDays?: number;
  criticalThresholdDays?: number;
  highThresholdDays?: number;
  mediumThresholdDays?: number;
  category?: string;  // Apply to specific category or global
}

// GET /api/expiration/history
// Returns historical waste and clearance data
interface ExpirationHistoryResponse {
  period: string;  // 'daily' | 'weekly' | 'monthly'
  data: Array<{
    date: string;
    expiredValue: number;
    disposedValue: number;
    clearanceRevenue: number;
    wastePercentage: number;
  }>;
}

// GET /api/expiration/alerts
// Returns all active alerts with pagination
interface AlertsResponse {
  alerts: Array<{
    id: number;
    lotId: number;
    productName: string;
    alertType: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    riskValue: number;
    daysToExpiry: number;
    recommendedAction: string;
    createdAt: string;
  }>;
  summary: {
    critical: number;
    high: number;
    medium: number;
  };
}
```

### 5.3 Backend Logic & Calculations

#### 5.3.1 Risk Calculation Algorithm

```python
# backend/services/expiration_service.py

from datetime import datetime, timedelta
from typing import List, Dict

class ExpirationRiskCalculator:
    """Calculates expiration risk and generates alerts"""
    
    def __init__(self, config: ExpirationConfig):
        self.safety_buffer = config.safety_buffer_days
        self.critical_threshold = config.critical_threshold_days
        self.high_threshold = config.high_threshold_days
        self.medium_threshold = config.medium_threshold_days
        self.avg_lead_time = config.avg_replenishment_lead_time_days
    
    def calculate_days_to_expiry(self, expiry_date: datetime) -> int:
        """Calculate days remaining until expiry"""
        today = datetime.now().date()
        return (expiry_date - today).days
    
    def calculate_critical_window(self, expiry_date: datetime) -> float:
        """
        Critical Window = Days to Expiry - (Avg Lead Time + Safety Buffer)
        If negative, item is in critical zone
        """
        days_to_expiry = self.calculate_days_to_expiry(expiry_date)
        return days_to_expiry - (self.avg_lead_time + self.safety_buffer)
    
    def determine_urgency(self, days_to_expiry: int) -> str:
        """Determine alert urgency level"""
        if days_to_expiry <= self.critical_threshold:
            return 'CRITICAL'
        elif days_to_expiry <= self.high_threshold:
            return 'HIGH'
        elif days_to_expiry <= self.medium_threshold:
            return 'MEDIUM'
        else:
            return 'NORMAL'
    
    def recommend_action(self, lot: InventoryLot, days_to_expiry: int) -> str:
        """Recommend clearance action based on urgency and value"""
        urgency = self.determine_urgency(days_to_expiry)
        value = lot.quantity_available * lot.unit_cost
        
        if urgency == 'CRITICAL':
            if days_to_expiry <= 1:
                return 'DISPOSE'  # No time to sell
            elif value < 100:
                return 'DONATE'   # Low value, dispose or donate
            else:
                return 'URGENT_SALE'  # High value, try to recover
        
        elif urgency == 'HIGH':
            return 'RUN_PROMO'  # Run promo/menu special
        
        elif urgency == 'MEDIUM':
            return 'MARKDOWN'  # Apply markdown pricing
        
        return 'MONITOR'
    
    def calculate_risk_value(self, lot: InventoryLot, 
                            recovery_percentage: float = 0.0) -> Dict:
        """
        Calculate monetary risk
        Recovery % depends on action:
        - DISPOSE: 0%
        - URGENT_SALE: 50-70%
        - RUN_PROMO: 70-90%
        - MARKDOWN: 80-95%
        """
        original_value = lot.quantity_available * lot.unit_cost
        recovered_value = original_value * recovery_percentage
        loss_value = original_value - recovered_value
        
        return {
            'original_value': original_value,
            'recovered_value': recovered_value,
            'loss_value': loss_value,
            'recovery_percentage': recovery_percentage * 100
        }
    
    def generate_dashboard_data(self, db_session) -> Dict:
        """Generate complete dashboard data"""
        
        # Query all active lots
        lots = db_session.query(InventoryLot).filter(
            InventoryLot.status == 'ACTIVE',
            InventoryLot.quantity_available > 0
        ).all()
        
        immediate_risk_items = []
        projected_risk_items = []
        
        today = datetime.now().date()
        
        for lot in lots:
            days_to_expiry = self.calculate_days_to_expiry(lot.expiry_date)
            
            # Skip if expiry is far in the future
            if days_to_expiry > 30:
                continue
            
            urgency = self.determine_urgency(days_to_expiry)
            action = self.recommend_action(lot, days_to_expiry)
            risk = self.calculate_risk_value(lot)
            
            lot_data = {
                'lot': lot,
                'days_to_expiry': days_to_expiry,
                'urgency': urgency,
                'recommended_action': action,
                'risk_value': risk['loss_value']
            }
            
            # Categorize by urgency
            if urgency == 'CRITICAL' and days_to_expiry <= self.critical_threshold:
                immediate_risk_items.append(lot_data)
            elif days_to_expiry <= 7:  # Next 7 days
                projected_risk_items.append(lot_data)
        
        # Calculate totals
        immediate_total = sum(item['risk_value'] for item in immediate_risk_items)
        projected_total = sum(item['risk_value'] for item in projected_risk_items)
        
        return {
            'summary': {
                'immediateRisk': {
                    'totalValue': immediate_total,
                    'itemCount': len(immediate_risk_items),
                    'lots': immediate_risk_items
                },
                'projectedRisk': {
                    'totalValue': projected_total,
                    'itemCount': len(projected_risk_items),
                    'horizon_days': 7,
                    'lots': projected_risk_items
                },
                'safetyBuffer': self.safety_buffer
            },
            'riskCalculation': {
                'avgReplenishmentTime': self.avg_lead_time,
                'safetyBuffer': self.safety_buffer,
                'criticalThreshold': -(self.avg_lead_time + self.safety_buffer)
            }
        }
```

#### 5.3.2 Automated Alert Generation (Background Job)

```python
# backend/jobs/expiration_alert_job.py

from celery import shared_task
from datetime import datetime

@shared_task
def generate_expiration_alerts():
    """
    Scheduled job to scan inventory and generate alerts
    Run frequency: Every 6 hours
    """
    db = get_db_session()
    config = get_expiration_config()
    calculator = ExpirationRiskCalculator(config)
    
    # Query all active lots
    lots = db.query(InventoryLot).filter(
        InventoryLot.status == 'ACTIVE',
        InventoryLot.quantity_available > 0
    ).all()
    
    alerts_created = 0
    
    for lot in lots:
        days_to_expiry = calculator.calculate_days_to_expiry(lot.expiry_date)
        
        # Only alert for items within alert window
        if days_to_expiry > config.medium_threshold_days:
            continue
        
        urgency = calculator.determine_urgency(days_to_expiry)
        action = calculator.recommend_action(lot, days_to_expiry)
        risk = calculator.calculate_risk_value(lot)
        
        # Check if alert already exists
        existing_alert = db.query(ExpirationAlert).filter(
            ExpirationAlert.lot_id == lot.id,
            ExpirationAlert.resolved_at.is_(None)
        ).first()
        
        if existing_alert:
            # Update existing alert
            existing_alert.alert_type = urgency
            existing_alert.days_to_expiry = days_to_expiry
            existing_alert.risk_value = risk['loss_value']
            existing_alert.recommended_action = action
        else:
            # Create new alert
            new_alert = ExpirationAlert(
                lot_id=lot.id,
                product_id=lot.product_id,
                alert_type=urgency,
                risk_value=risk['loss_value'],
                days_to_expiry=days_to_expiry,
                recommended_action=action
            )
            db.add(new_alert)
            alerts_created += 1
            
            # Send notification if critical
            if urgency == 'CRITICAL':
                send_critical_alert_notification(lot, days_to_expiry)
    
    db.commit()
    return f"Generated {alerts_created} new alerts"

def send_critical_alert_notification(lot: InventoryLot, days_left: int):
    """Send email/SMS notification for critical alerts"""
    # Implementation for notifications
    pass
```

---

## 6. Frontend Button Functionality Audit

### 6.1 Audit Summary

After comprehensive code review, the following buttons require implementation:

#### 6.1.1 **Dashboard Page** (`/dashboard/page.tsx`)
✅ **Working**:
- No action buttons currently (projection parameters update local state only)

#### 6.1.2 **Optimization Page** (`/optimization/page.tsx`)
❌ **Non-functional**:
- **"Filters" button** (line 175): No onClick handler, needs filter dialog
- **"Export CSV" button** (line 178): No onClick handler, needs CSV export logic

**Implementation Required**:
```typescript
const handleFilters = () => {
  setFilterDialogOpen(true);
};

const handleExportCSV = () => {
  const csv = generateCSV(products);
  downloadCSV(csv, 'inventory-projection.csv');
};
```

#### 6.1.3 **Settings Page** (`/settings/page.tsx`)
✅ **Working**:
- All buttons have onClick handlers and show toast notifications
- Form submission buttons work correctly

❌ **Non-functional**:
- **"Change Photo" button** (line 362): No onClick handler
- **"Enable" (2FA) button** (line 536): No onClick handler

**Implementation Required**:
```typescript
const handleChangePhoto = () => {
  // Open file picker
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      await uploadProfilePhoto(file);
    }
  };
  input.click();
};

const handleEnable2FA = () => {
  set2FADialogOpen(true);
};
```

#### 6.1.4 **Products Page** (`/products/page.tsx`)
❌ **Non-functional** (Empty state buttons):
- **"Add First Product" button**: Likely no onClick (needs verification)

#### 6.1.5 **Customers Page** (`/customers/page.tsx`)
❌ **Non-functional** (Empty state):
- **"Add First Customer" button** (line 70): No onClick handler

#### 6.1.6 **Suppliers Page** (`/suppliers/page.tsx`)
❌ **Non-functional** (Empty state):
- **"Add First Supplier" button** (line 70): No onClick handler

#### 6.1.7 **Bill of Materials Page** (`/bom/page.tsx`)
❌ **Non-functional** (Empty state):
- **"Create First BOM" button** (line 70): No onClick handler

#### 6.1.8 **Users Page** (`/users/page.tsx`)
❌ **Non-functional** (Empty state):
- **"Add New User" button** (line 80): No onClick handler

#### 6.1.9 **Marketing Calendar** (`/marketing/calendar/page.tsx`)
❌ **Non-functional** (Empty state):
- **"Create Marketing Event" button** (line 80): No onClick handler

#### 6.1.10 **Marketing AOP** (`/marketing/aop/page.tsx`)
❌ **Non-functional** (Empty state):
- **"Create AOP Target" button** (line 90): No onClick handler

#### 6.1.11 **Import Page** (`/import/page.tsx`)
❌ **Non-functional**:
- **"Upload File" button** (line 65): No onClick handler
- **"Download Templates" button** (line 101): No onClick handler

#### 6.1.12 **Import-Export Page** (`/import-export/page.tsx`)
✅ **Partially Working**:
- **"Start Export" button** (line 710): Has onClick handler (`handleExport`)

**Need to verify**: Check if `handleExport` function is fully implemented

#### 6.1.13 **Forecasting Page** (`/forecasting/page.tsx`)
✅ **Working**:
- **"Refresh" button**: Has `loadForecastingData` handler
- **"Generate Forecast" button**: Opens dialog correctly
- **"Generate Forecast" (dialog)**: Has `handleGenerateForecast` handler

#### 6.1.14 **Inventory Page** (`/inventory/page.tsx`)
❓ **Need to verify**: Button implementations

### 6.2 Priority Fix List

**HIGH PRIORITY** (Blocking core workflows):
1. ✅ Optimization page: Filters & Export CSV
2. ✅ Products: Add/Edit/Delete product buttons
3. ✅ Customers: Add/Edit/Delete customer buttons
4. ✅ Suppliers: Add/Edit/Delete supplier buttons
5. ✅ Import: Upload file & download templates

**MEDIUM PRIORITY** (Nice to have):
6. Settings: Change photo & Enable 2FA
7. BOM: Create/Edit BOM
8. Users: User management CRUD
9. Marketing: Event and AOP creation

**LOW PRIORITY** (Future enhancements):
10. Advanced filtering across all data grids
11. Bulk actions for inventory management

---

## 7. Implementation Roadmap

### Phase 1: Foundation & Theme (Week 1)
**Duration**: 5 days

#### Tasks:
1. **Theme Implementation** (Day 1-2)
   - [ ] Update `theme.ts` with new color palette
   - [ ] Create custom MUI components (Button, Card, Chip styles)
   - [ ] Update Sidebar to use dark navy background
   - [ ] Test theme consistency across all pages

2. **Database Schema** (Day 2-3)
   - [ ] Create migration for new tables (inventory_lots, expiration_alerts, etc.)
   - [ ] Add indexes for performance
   - [ ] Seed with sample data for development
   - [ ] Write database documentation

3. **Backend API Structure** (Day 3-5)
   - [ ] Create `expiration_service.py` with risk calculator
   - [ ] Implement `/api/expiration/dashboard` endpoint
   - [ ] Implement `/api/expiration/action-required` endpoint
   - [ ] Implement `/api/expiration/strategic-ordering` endpoint
   - [ ] Write unit tests for risk calculations
   - [ ] Set up Celery job for automated alerts

**Deliverables**:
- ✅ Updated theme applied globally
- ✅ Database schema deployed to dev environment
- ✅ API endpoints documented in Swagger/OpenAPI
- ✅ Automated alert job running on schedule

---

### Phase 2: Priority Expiration Dashboard (Week 2)
**Duration**: 7 days

#### Tasks:
1. **Dashboard Layout** (Day 1-2)
   - [ ] Create new route: `/expiration` (or update `/dashboard`)
   - [ ] Implement header with "F&B CRITICAL" badge
   - [ ] Add Safety Buffer slider control
   - [ ] Create Risk Calculation Logic info panel
   - [ ] Implement responsive grid layout

2. **Risk Summary Cards** (Day 2-3)
   - [ ] Build "Immediate Value at Risk" card component
   - [ ] Build "Projected Risk (Next 7 Days)" card component
   - [ ] Connect to `/api/expiration/dashboard` endpoint
   - [ ] Add loading states and error handling
   - [ ] Implement real-time updates (websockets or polling)

3. **Action Required Table** (Day 3-5)
   - [ ] Create table component with sortable columns
   - [ ] Implement countdown timer with color coding
   - [ ] Add action buttons (DISPOSE, RUN PROMO, URGENT SALE)
   - [ ] Build action confirmation dialogs
   - [ ] Connect to `/api/expiration/take-action` endpoint
   - [ ] Add pagination and filtering

4. **Strategic Ordering Chart** (Day 5-6)
   - [ ] Implement scatter plot using Recharts
   - [ ] Add TRLT vs. Shelf Life axes
   - [ ] Color-code data points by risk zone
   - [ ] Add tooltips for product details
   - [ ] Implement zoom and pan interactions

5. **Testing & Refinement** (Day 6-7)
   - [ ] Write integration tests for all components
   - [ ] Test with various data scenarios
   - [ ] Performance optimization (virtualization for large tables)
   - [ ] Accessibility audit (WCAG 2.1 AA compliance)
   - [ ] User acceptance testing with stakeholders

**Deliverables**:
- ✅ Fully functional Priority Expiration Dashboard
- ✅ All components connected to backend APIs
- ✅ Action workflows operational
- ✅ User documentation prepared

---

### Phase 3: Button Functionality Implementation (Week 3)
**Duration**: 5 days

#### Tasks:
1. **Master Data CRUD Operations** (Day 1-2)
   - [ ] Products: Implement add/edit/delete dialogs
   - [ ] Customers: Implement add/edit/delete dialogs
   - [ ] Suppliers: Implement add/edit/delete dialogs
   - [ ] Connect to existing backend APIs
   - [ ] Add form validation

2. **Import/Export Functionality** (Day 2-3)
   - [ ] Implement file upload for Import page
   - [ ] Create template download links
   - [ ] Build CSV/Excel parser
   - [ ] Add data validation and error reporting
   - [ ] Implement progress tracking for large imports

3. **Optimization Page Enhancements** (Day 3)
   - [ ] Build filter dialog for Inventory Projection Matrix
   - [ ] Implement CSV export functionality
   - [ ] Add bulk actions (if needed)

4. **Settings Page Enhancements** (Day 3-4)
   - [ ] Implement photo upload for profile
   - [ ] Build 2FA setup dialog
   - [ ] Connect to backend authentication APIs

5. **BOM & Marketing Modules** (Day 4-5)
   - [ ] BOM: Create/edit BOM dialogs
   - [ ] Marketing Calendar: Event creation form
   - [ ] Marketing AOP: Target setting form

**Deliverables**:
- ✅ All HIGH priority buttons functional
- ✅ MEDIUM priority buttons implemented
- ✅ LOW priority buttons documented for future work
- ✅ Updated user guide with new features

---

### Phase 4: Integration & Polish (Week 4)
**Duration**: 5 days

#### Tasks:
1. **System Integration** (Day 1-2)
   - [ ] Connect expiration dashboard with procurement workflows
   - [ ] Integrate with sales/promotions module
   - [ ] Add notifications for critical alerts
   - [ ] Set up email/SMS notifications

2. **Advanced Features** (Day 2-3)
   - [ ] Implement "what-if" scenario modeling
   - [ ] Add historical waste analytics
   - [ ] Build mobile-responsive views
   - [ ] Add export reports feature

3. **Performance Optimization** (Day 3-4)
   - [ ] Optimize database queries (explain plans)
   - [ ] Implement caching for dashboard data
   - [ ] Compress and lazy-load images
   - [ ] Code splitting for faster page loads

4. **Documentation & Training** (Day 4-5)
   - [ ] Write technical documentation
   - [ ] Create user training materials
   - [ ] Record video tutorials
   - [ ] Conduct training sessions with end-users

**Deliverables**:
- ✅ Production-ready Priority Expiration Dashboard
- ✅ All systems integrated and tested
- ✅ Complete documentation package
- ✅ Training completed

---

## 8. Technical Specifications

### 8.1 Frontend Technology Stack

```typescript
{
  "framework": "Next.js 14 (App Router)",
  "uiLibrary": "MUI (Material-UI) v5",
  "charting": "Recharts v2.12",
  "stateManagement": "Zustand v4.5",
  "dataFetching": "TanStack Query v5",
  "forms": "React Hook Form v7 + Zod",
  "notifications": "react-hot-toast v2",
  "dateHandling": "date-fns v3",
  "styling": "MUI sx prop + Emotion"
}
```

### 8.2 Backend Technology Stack

```python
{
  "framework": "FastAPI (Python)",
  "database": "PostgreSQL 15",
  "orm": "SQLAlchemy 2.0",
  "authentication": "JWT with httpOnly cookies",
  "backgroundJobs": "Celery + Redis",
  "apiDocumentation": "OpenAPI/Swagger",
  "testing": "pytest + pytest-cov",
  "deployment": "Docker + Docker Compose"
}
```

### 8.3 Component Architecture

```
src/
├── app/
│   ├── expiration/                    # New dashboard route
│   │   ├── page.tsx                  # Main dashboard page
│   │   ├── layout.tsx                # Layout wrapper
│   │   └── loading.tsx               # Loading state
│   └── ...
├── components/
│   ├── expiration/                    # Dashboard-specific components
│   │   ├── RiskSummaryCard.tsx       # Immediate/Projected risk cards
│   │   ├── ActionRequiredTable.tsx   # Table with action buttons
│   │   ├── StratategicOrderingChart.tsx # TRLT scatter plot
│   │   ├── SafetyBufferControl.tsx   # Slider control
│   │   ├── RiskCalculationPanel.tsx  # Info panel
│   │   ├── ActionDialog.tsx          # Confirmation dialog for actions
│   │   └── ExpirationAlerts.tsx      # Alert notification component
│   ├── shared/                        # Reusable components
│   │   ├── StatusChip.tsx            # Color-coded status chips
│   │   ├── CountdownTimer.tsx        # Animated countdown display
│   │   └── ValueDisplay.tsx          # Monetary value formatter
│   └── ...
├── lib/
│   ├── api/
│   │   ├── expirationApi.ts          # API client for expiration endpoints
│   │   └── ...
│   ├── utils/
│   │   ├── expirationCalculations.ts # Frontend risk calculations
│   │   ├── csvExport.ts              # CSV export utilities
│   │   └── dateFormatters.ts         # Date display utilities
│   └── ...
└── store/
    ├── expirationStore.ts             # Zustand store for dashboard state
    └── ...
```

### 8.4 Performance Requirements

- **Dashboard Load Time**: < 2 seconds (initial load)
- **Data Refresh Rate**: Every 5 minutes (automatic polling)
- **Table Rendering**: Support up to 1000 rows with virtualization
- **Chart Rendering**: < 500ms for up to 200 data points
- **API Response Time**: < 200ms (p95)
- **Database Query Time**: < 100ms (p95)

### 8.5 Security Considerations

1. **Role-Based Access Control (RBAC)**:
   - Admin: Full access to all features
   - SOP Leader: View + take actions
   - Viewer: Read-only access

2. **Action Audit Trail**:
   - Log all clearance actions with user, timestamp, and reason
   - Maintain compliance records for 7 years

3. **Data Validation**:
   - Validate all user inputs (quantity, dates, etc.)
   - Prevent SQL injection with parameterized queries
   - Sanitize exported data

4. **API Security**:
   - Rate limiting: 100 requests/minute per user
   - JWT token expiration: 1 hour
   - CORS: Whitelist only allowed origins

---

## 9. Testing & Quality Assurance

### 9.1 Test Coverage Requirements

- **Unit Tests**: > 80% coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user workflows
- **Performance Tests**: Load testing for 100 concurrent users

### 9.2 Test Scenarios

#### 9.2.1 Dashboard Data Accuracy
```
Test Case: Dashboard displays correct risk values
Given: 5 lots with various expiry dates
When: Dashboard loads
Then:
  - Immediate risk total = sum of lots expiring in ≤3 days
  - Projected risk total = sum of lots expiring in 4-7 days
  - Item counts match filtered results
```

#### 9.2.2 Action Execution
```
Test Case: DISPOSE action updates inventory
Given: Lot with 100 units expiring in 1 day
When: User clicks "DISPOSE" and confirms
Then:
  - Lot quantity_available decreases by disposal amount
  - Clearance action record created
  - Alert marked as resolved
  - Notification sent to warehouse
```

#### 9.2.3 Countdown Timer Accuracy
```
Test Case: Countdown displays correct urgency
Given: Current date is 2024-11-28
And: Lot expires on 2024-11-30 (2 days)
When: Dashboard renders
Then:
  - Countdown shows "2 DAYS LEFT"
  - Urgency level = CRITICAL
  - Background color = red
```

#### 9.2.4 Strategic Ordering Chart
```
Test Case: Chart identifies high-risk products
Given: Product A has TRLT = 10 days, Shelf Life = 15 days
And: Product B has TRLT = 20 days, Shelf Life = 30 days
When: Chart renders
Then:
  - Product A appears in yellow/red zone (TRLT/Shelf Life > 0.6)
  - Product B appears in green zone (TRLT/Shelf Life < 0.6)
```

### 9.3 User Acceptance Testing (UAT)

**Participants**: 3-5 warehouse managers, procurement staff

**Test Scenarios**:
1. Identify critical items and take disposal action
2. Run promotional campaign for near-expiry items
3. Adjust safety buffer and observe impact
4. Generate waste analytics report
5. Export action-required list to CSV

**Success Criteria**:
- 100% of critical tasks completed successfully
- Average task completion time < 2 minutes
- User satisfaction score > 4/5

---

## 10. Rollout Plan

### 10.1 Environment Strategy

1. **Development** (Week 1-3)
   - Feature development and unit testing
   - API integration testing

2. **Staging** (Week 4)
   - UAT with pilot users
   - Performance testing
   - Bug fixes and refinements

3. **Production** (Week 5)
   - Gradual rollout (10% → 50% → 100%)
   - Monitor metrics closely
   - Hotfix deployment plan ready

### 10.2 Monitoring & Metrics

**Key Metrics to Track**:
1. **Waste Reduction**: % decrease in expired inventory value
2. **Recovery Rate**: % of near-expiry value recovered through sales
3. **Alert Response Time**: Average time from alert to action
4. **Dashboard Usage**: Daily active users, session duration
5. **System Performance**: API latency, error rates

**Success Targets** (3 months post-launch):
- 30% reduction in waste value
- 70% recovery rate for near-expiry items
- < 4 hours average alert response time
- 90% user adoption rate

### 10.3 Training Plan

**Training Sessions**:
1. **Warehouse Managers** (2 hours)
   - Dashboard navigation
   - Taking clearance actions
   - Interpreting risk calculations

2. **Procurement Team** (1 hour)
   - Strategic ordering insights
   - Adjusting safety buffers
   - Reviewing waste analytics

3. **Executive Team** (30 minutes)
   - High-level dashboard overview
   - Business impact metrics
   - ROI reporting

**Training Materials**:
- Video tutorials (5-10 min each)
- Quick reference guides (1-2 pages)
- FAQ document
- In-app tooltips and help text

---

## 11. Budget & Resources

### 11.1 Resource Allocation

**Team Composition**:
- 1 Full-Stack Developer (4 weeks)
- 1 Backend Developer (2 weeks, part-time)
- 1 UI/UX Designer (1 week, part-time)
- 1 QA Engineer (2 weeks)
- 1 DevOps Engineer (3 days, deployment)

**Total Effort**: ~10 person-weeks

### 11.2 Infrastructure Costs

- **Database**: PostgreSQL storage increase (~10GB): $5/month
- **Background Jobs**: Redis instance: $10/month
- **Monitoring**: Application monitoring tools: $20/month
- **Total**: ~$35/month additional infrastructure cost

### 11.3 Expected ROI

**Assumptions**:
- Current monthly waste: $10,000
- Expected waste reduction: 30%

**Monthly Savings**: $3,000
**Annual Savings**: $36,000
**Payback Period**: < 1 month (considering development cost)

---

## 12. Risk Assessment & Mitigation

### 12.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Database performance degrades with large data volumes | Medium | High | Implement indexing, query optimization, archiving strategy |
| Real-time updates cause UI lag | Low | Medium | Use debouncing, optimize rendering, implement virtual scrolling |
| Incorrect risk calculations lead to bad decisions | Low | Critical | Extensive unit testing, validation with business users, audit trail |
| Integration issues with existing systems | Medium | Medium | Comprehensive API testing, staged rollout |

### 12.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Users don't adopt the system | Medium | High | Thorough training, clear value demonstration, user feedback loop |
| Compliance issues with food safety regulations | Low | Critical | Legal review, audit trail implementation, compliance reporting |
| Inaccurate expiry data in system | Medium | High | Data validation rules, regular data audits, source system integration |

---

## 13. Next Steps & Action Items

### Immediate Actions (This Week)
1. [ ] Review and approve this plan with stakeholders
2. [ ] Set up development environment for new dashboard
3. [ ] Schedule kickoff meeting with development team
4. [ ] Begin database schema design and migration scripts
5. [ ] Start theme implementation in parallel

### Week 1 Priorities
1. [ ] Complete theme rollout
2. [ ] Database schema deployed to dev
3. [ ] Backend API structure set up
4. [ ] Begin frontend component development

### Success Checkpoints
- **Week 1**: Theme and foundation complete
- **Week 2**: Dashboard 70% functional
- **Week 3**: All buttons working, dashboard 100% functional
- **Week 4**: UAT complete, production-ready

---

## 14. Appendices

### Appendix A: Button Implementation Checklist

```markdown
## HIGH PRIORITY
- [ ] Optimization: Filters button
- [ ] Optimization: Export CSV button
- [ ] Products: Add product
- [ ] Products: Edit product
- [ ] Products: Delete product
- [ ] Customers: Add customer
- [ ] Customers: Edit customer
- [ ] Customers: Delete customer
- [ ] Suppliers: Add supplier
- [ ] Suppliers: Edit supplier
- [ ] Suppliers: Delete supplier
- [ ] Import: Upload file
- [ ] Import: Download templates

## MEDIUM PRIORITY
- [ ] Settings: Change photo
- [ ] Settings: Enable 2FA
- [ ] BOM: Create BOM
- [ ] BOM: Edit BOM
- [ ] Users: Add user (Admin only)
- [ ] Users: Edit user (Admin only)
- [ ] Marketing: Create event
- [ ] Marketing: Create AOP target

## LOW PRIORITY
- [ ] Inventory: Advanced filters
- [ ] Analytics: Export analysis
- [ ] Forecasting: Bulk operations
```

### Appendix B: API Endpoint Reference

See Section 5.2 for complete API specifications.

### Appendix C: Color Palette Swatches

See Section 2.1 for detailed color definitions.

### Appendix D: Database ER Diagram

```
[Products] 1---N [Inventory_Lots]
                      |
                      | 1
                      |
                      N
                [Expiration_Alerts]
                      |
                      | 1
                      |
                      N
                [Clearance_Actions]
```

---

**Document Version**: 1.0  
**Last Updated**: November 28, 2025  
**Author**: AI Development Team  
**Reviewed By**: Pending  
**Status**: PENDING APPROVAL - CRITICAL

---

**Note**: This is a comprehensive planning document. Before implementation begins, please review with all stakeholders and obtain formal approval. Any changes to requirements should be documented and version-controlled.
