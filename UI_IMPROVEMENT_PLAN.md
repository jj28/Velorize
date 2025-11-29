# UI Improvement Plan: Velorize "ProStock" Modernization

## 1. Executive Summary
The goal is to transform the current Velorize UI into a modern, interactive, and data-rich application resembling the "ProStock Planner" reference design. The new design emphasizes clarity, actionable insights (Stock Health, Coverage), and visual trajectories (Charts) over simple data tables.

## 2. Package Status
**Status:** ✅ Up to Date
The current technology stack is modern and capable of supporting the requested UI improvements without major upgrades.
- **Framework:** Next.js 14.2 (Latest stable)
- **UI Library:** Material UI v5 (Stable, robust)
- **Charts:** Recharts 2.12 (Excellent for the requested trajectory charts)
- **Data Grid:** MUI X Data Grid v7 (Powerful table features)
- **State:** Zustand (Lightweight, modern)

## 3. Global Design System Updates
To match the "ProStock" aesthetic:
- **Color Palette:**
  - Background: Light Gray (`#F9FAFB`) for app background to make white cards pop.
  - Cards: Pure White (`#FFFFFF`) with subtle borders (`#EAECF0`) and soft shadows.
  - Primary Action: Bright Blue (e.g., `#2196F3` or `#0061FF`).
  - Status Colors:
    - **Critical/Stock Out:** Soft Red bg with Red text.
    - **Excess/Warning:** Soft Orange/Yellow bg with Orange text.
    - **Good/Optimal:** Soft Green bg with Green text.
- **Typography:** Inter or Roboto (default), focusing on distinct weights for labels vs data.
- **Layout:**
  - **Card-Based Layouts:** Use `Paper` or `Card` components with `elevation={0}` and `variant="outlined"` but with custom border styling.
  - **Interactive Elements:** Hover effects on table rows and cards.

## 4. Page-Specific Improvement Plan

### A. Dashboard / Overview (`/dashboard`)
**Current:** Basic metric cards and lists.
**Enhancement:** Implement the "ProStock Planner" Dashboard (Image 4).
1.  **Header Stats Row:**
    - 4 Key Cards: Total Stock on Hand, Critical Low Stock, Excess Inventory, Stock Health Score.
    - Use icons + big numbers + trend indicators.
2.  **Projection Parameters Section:**
    - Interactive filters for "Coverage Unit" (Days/Weeks/Months), "Excess Threshold" (Slider/Input), and "Calculation Basis".
    - This controls the data displayed in grids below.

### B. Inventory Optimization (`/optimization`) & Inventory (`/inventory`)
**Current:** Simple tables.
**Enhancement:** Implement "Inventory Projection Matrix" (Images 1 & 3).
*This is the core feature request.*

1.  **View Modes:** Toggle between **Card View** (Image 1) and **Table View** (Image 3).
2.  **Card View (Image 1):**
    - Create a `ProductProjectionCard` component.
    - **Header:** SKU, Name, Status Chip (e.g., "EXCESS").
    - **Key Metrics:** SOH, Coverage (Days), Next Demand.
    - **Chart:** Mini-trajectory chart showing Demand (Bar), Supply (Bar/Line), and Projected SOH (Dotted Line).
    - **Footer:** Safety Stock, Reorder Pt, Projected M3 Stock.
3.  **Table View (Image 3):**
    - **Complex Header:** Grouped columns:
        - *Product Details* (SKU, Name, Category)
        - *Stock Health* (Coverage, Status, Action)
        - *Incoming Stocks* (M0, M1, M2, M3)
        - *Rolling Forecast* (M0, M1, M2, M3)
        - *Inventory Projection* (M0, M1, M2, M3) - Color coded (Red for negative/low).
    - **Interactive:** Clicking a row opens the "Analysis" details.

### C. Product Details / Analysis (`/products` or Modal)
**Current:** Basic form.
**Enhancement:** "Analysis for [Product]" View (Image 2).
1.  **Layout:** Split view.
    - **Left Panel:** Input parameters for Safety Stock and Reorder Point (Allow simulation/what-if analysis). Display "Projected M3 Stock" with health commentary.
    - **Right Panel:** Large "Inventory & Coverage Trajectory" Chart.
        - X-Axis: Months (M0, M1, M2...).
        - Y-Axis: Units.
        - Series: Forecast (Bar), Incoming (Bar), Projected SOH (Line with dots).

## 5. Implementation Roadmap

### Phase 1: Components & Layout
- [x] Update `Sidebar` and `AppLayout` to use the new light gray background style.
- [x] Create `StatCard` component (for Dashboard).
- [ ] Create `TrajectoryChart` component using Recharts (reusable for Cards and Details).

### Phase 2: Inventory Projection Matrix
- [ ] Build `ProductProjectionCard` with the mini-chart.
- [ ] Build `ProjectionTable` with grouped headers and conditional cell formatting (Red/Green text).
- [ ] Create a new route or update `/optimization` to host this matrix.

### Phase 3: Dashboard Integration
- [x] Replace `/dashboard` content with the "ProStock Planner" summary view.
- [ ] Connect "Projection Parameters" filters to the data state.

### Phase 4: Interactive Details
- [ ] Create the "Analysis" view (Image 2) as a drawer or modal when clicking a product.
- [ ] Connect inputs (Safety Stock) to update the chart in real-time (client-side simulation).
