# Velorize Development Plan
## Demand Planning & S&OP System for Malaysian SMEs

**Last Updated:** 2025-11-23
**Target Market:** Malaysian F&B SMEs
**Project Goal:** Democratize enterprise-grade demand planning for small businesses

---

## Project Overview

Velorize is a web application designed to bring MNC-level Sales & Operations Planning (S&OP) capabilities to Malaysian SMEs, starting with the Food & Beverage sector. The system addresses critical cash flow, inventory management, and forecasting challenges faced by 70% of Malaysian SMEs.

### Key Business Value
- **Cash Flow:** Unlock capital trapped in Excess & Aging stock
- **Revenue:** Maximize sales of "Class A" SKUs via inventory optimization
- **Margin:** Protect profits through data-backed planning
- **Decision Making:** Replace gut feelings with factual, data-driven discussions
- **Scalability:** Improve data quality, making businesses "Investor Ready"

---

## Technology Stack

### Frontend/UI Framework
- **Framework:** Next.js 14 (App Router) + React 18 + TypeScript
- **UI Library:** Material-UI (MUI) v5
- **State Management:** Zustand
- **Data Visualization:**
  - Recharts (primary charts/graphs)
  - TanStack Table v8 (data tables)
  - Apache ECharts (advanced visualizations)
- **HTTP Client:** Axios
- **Form Handling:** React Hook Form + Zod validation
- **Styling:** Emotion (CSS-in-JS via MUI)

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **ORM:** SQLAlchemy 2.0
- **Migrations:** Alembic
- **Authentication:** JWT (python-jose)
- **Data Processing:**
  - pandas (data manipulation)
  - numpy (numerical computations)
  - statsmodels (SARIMA, time series forecasting)
  - scipy (statistical calculations)
  - scikit-learn (ML, future expansion)
- **Validation:** Pydantic v2
- **Task Queue:** Celery (optional, for heavy computations)

### Database & Storage
- **Primary Database:** PostgreSQL 15 (AWS RDS)
- **Cache/Session:** Redis 7 (AWS ElastiCache)
- **File Storage:** AWS S3
- **Time-Series Extension:** TimescaleDB (if needed)

### DevOps & Infrastructure
- **Cloud Provider:** AWS
- **Container Runtime:** Docker
- **Orchestration:** ECS Fargate or Elastic Beanstalk
- **CI/CD:** GitHub Actions
- **IaC:** Terraform or AWS CDK
- **Monitoring:** CloudWatch, AWS X-Ray
- **CDN:** CloudFront
- **DNS:** Route 53
- **SSL:** AWS Certificate Manager

---

## AWS Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     AWS Cloud                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────┐         ┌──────────────────┐       │
│  │  CloudFront    │────────▶│   S3 Bucket      │       │
│  │  (CDN)         │         │  (Static Assets) │       │
│  └────────────────┘         └──────────────────┘       │
│         │                                               │
│         ▼                                               │
│  ┌────────────────────────────────────────┐            │
│  │     Application Load Balancer (ALB)    │            │
│  └────────────────────────────────────────┘            │
│         │                                               │
│         ▼                                               │
│  ┌────────────────────────────────────────┐            │
│  │   ECS Fargate / Elastic Beanstalk      │            │
│  │   (FastAPI Backend + Next.js SSR)      │            │
│  │   - Auto-scaling                        │            │
│  │   - Docker containers                   │            │
│  └────────────────────────────────────────┘            │
│         │              │                                │
│         ▼              ▼                                │
│  ┌─────────────┐  ┌──────────────┐                    │
│  │  RDS        │  │ ElastiCache  │                    │
│  │ PostgreSQL  │  │   (Redis)    │                    │
│  └─────────────┘  └──────────────┘                    │
│                                                          │
│  ┌──────────────────────────────────────┐              │
│  │  Lambda Functions (Scheduled Jobs)    │              │
│  │  - Nightly forecast calculations      │              │
│  │  - Report generation                  │              │
│  │  - Data cleanup                       │              │
│  └──────────────────────────────────────┘              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
Velorize/
├── velorize-ui/           # Next.js frontend application
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # Reusable components
│   │   ├── lib/           # Utilities, API clients
│   │   ├── store/         # Zustand stores
│   │   ├── types/         # TypeScript types
│   │   └── styles/        # Global styles
│   ├── public/            # Static assets
│   ├── package.json
│   └── tsconfig.json
│
├── velorize-backend/      # FastAPI backend application
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── core/          # Config, security
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   ├── analytics/     # Forecasting, ABC/XYZ, etc.
│   │   └── main.py        # FastAPI app
│   ├── alembic/           # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
│
├── plan/                  # Project documentation
│   ├── DEVELOPMENT_PLAN.md
│   ├── CODE_STYLE_GUIDE.md
│   └── DATABASE_SCHEMA.md
│
├── infrastructure/        # AWS/Terraform configs
│   ├── terraform/
│   └── docker-compose.yml
│
├── docs/                  # User documentation
│   ├── user-guide/
│   └── api-docs/
│
└── README.md
```

---

## Development Phases

### **Phase 1: Foundation & Setup (Weeks 1-2)**

#### Week 1: Project Initialization
- [x] Create project repository structure
- [ ] Initialize Next.js (velorize-ui) with TypeScript
- [ ] Initialize FastAPI project structure
- [ ] Configure ESLint, Prettier, pre-commit hooks
- [ ] Set up Docker & Docker Compose for local development
- [ ] Create AWS account and configure IAM roles
- [ ] Set up development, staging, production environments

#### Week 2: Database & Core Infrastructure
- [ ] Design complete database schema
- [ ] Set up PostgreSQL (local via Docker)
- [ ] Set up Redis (local via Docker)
- [ ] Create initial database migrations
- [ ] Set up AWS S3 buckets (dev, staging, prod)
- [ ] Configure CI/CD pipeline (GitHub Actions)
- [ ] Create project documentation structure

---

### **Phase 2: Core Backend Development (Weeks 3-6)**

#### Week 3-4: Authentication & Master Data Management
- [ ] Implement JWT authentication & authorization
- [ ] User management system (roles: Admin, S&OP Leader, Viewer)
- [ ] API endpoints for Master Data:
  - Product Master Data CRUD
  - Customer/Supplier CRUD
  - BOM management (F&B specific)
  - Product lifecycle (PIPO) management
- [ ] Data validation with Pydantic models
- [ ] Unit tests for all endpoints
- [ ] API documentation (FastAPI auto-docs)

#### Week 5-6: Dynamic Data & Data Ingestion
- [ ] Stock On Hand (SOH) tracking API
- [ ] Sales data import (CSV/Excel → S3 → Parse)
- [ ] Forecast data entry APIs
- [ ] Marketing calendar management
- [ ] AOP targets management
- [ ] Data cleaning & validation logic
- [ ] Batch import functionality
- [ ] Error handling & logging

---

### **Phase 3: Analytics Engine Development (Weeks 7-10)**

#### Week 7: Core Analytics Algorithms
- [ ] ABC/XYZ Analysis implementation:
  - ABC: Product classification by value (Pareto)
  - XYZ: Classification by demand variability
- [ ] Gross Margin calculations (SKU/Category level)
- [ ] Inventory health metrics:
  - Days On Hand (DOH)
  - Inventory turnover rate
  - Stock-to-sales ratio

#### Week 8: Forecasting Engine
- [ ] Time-series forecasting:
  - SARIMA models (statsmodels)
  - Seasonal pattern detection
  - Moving average fallback for new products
- [ ] Demand forecasting API endpoints
- [ ] Store forecast snapshots (Forecast Lag X)
- [ ] Automated forecast generation (scheduled jobs)

#### Week 9: Forecast Accuracy & Performance Metrics
- [ ] WMAPE calculation (Weighted Mean Absolute Percentage Error)
- [ ] Bias trend analysis
- [ ] Forecast vs. Actuals comparison logic
- [ ] Top error contributors identification
- [ ] Performance metrics aggregation

#### Week 10: Inventory Optimization
- [ ] Aging & Excess (A&E) detection:
  - SOH vs. forecast demand comparison
  - Shelf life integration (perishables)
  - Slow-moving SKU identification
- [ ] Safety stock calculation:
  - Based on demand variability & lead time
  - Service level targets (95%, 98%, 99%)
- [ ] Reorder point recommendations
- [ ] Cash flow impact calculator

---

### **Phase 4: Frontend Development (Weeks 11-14)**

#### Week 11: Core UI & Authentication
- [ ] MUI theme setup (brand colors, typography)
- [ ] Login/Registration pages
- [ ] Dashboard layout & navigation
- [ ] Responsive design implementation
- [ ] Zustand state management setup
- [ ] Axios API client configuration
- [ ] Protected routes & role-based access

#### Week 12: Data Entry & Management UI
- [ ] Master Data management forms:
  - Product management interface (CRUD)
  - BOM builder (interactive form)
  - Customer/Supplier management
- [ ] File upload interface (CSV/Excel imports)
- [ ] Data validation feedback (client-side)
- [ ] Data tables with sorting, filtering, pagination

#### Week 13: Analytics Dashboards
- [ ] **Overview Dashboard:**
  - Key metrics cards (cash flow, service level)
  - ABC/XYZ matrix visualization
  - Top A&E items table
- [ ] **Inventory Health Dashboard:**
  - SOH by category (bar charts)
  - DOH trends (line charts)
  - Stock alerts (notifications)
- [ ] **Forecast Dashboard:**
  - Demand curves (line charts)
  - Forecast vs. Actuals (combo charts)
  - WMAPE trends (area charts)

#### Week 14: Reports & Advanced Features
- [ ] **Gross Margin Report:**
  - Sortable data tables
  - Export to Excel/PDF
- [ ] **A&E Report:**
  - Actionable insights table
  - Cash flow impact visualization
- [ ] **Marketing Calendar View:**
  - Interactive calendar component
  - Promo impact overlay
- [ ] AOP vs. Actuals tracking page
- [ ] Export functionality (Excel, PDF, CSV)
- [ ] Print-friendly report layouts

---

### **Phase 5: Integration & Testing (Weeks 15-16)**

#### Week 15: Integration Testing
- [ ] End-to-end testing (Playwright/Cypress)
- [ ] API integration testing
- [ ] Database integrity testing
- [ ] BOM calculation validation (F&B scenarios)
- [ ] Forecast accuracy validation with historical data
- [ ] User flow testing (onboarding → reporting)

#### Week 16: Performance & Security
- [ ] Load testing (k6 or Locust):
  - 100 concurrent users
  - 1000+ products
  - Multiple forecasts
- [ ] Database query optimization
- [ ] Redis caching strategy implementation
- [ ] Security audit:
  - SQL injection prevention
  - XSS prevention
  - CSRF protection
  - Rate limiting (API throttling)
- [ ] Penetration testing
- [ ] GDPR/data privacy compliance review

---

### **Phase 6: AWS Deployment (Weeks 17-18)**

#### Week 17: Infrastructure Setup
- [ ] Set up AWS resources with Terraform:
  - VPC, subnets, security groups
  - RDS PostgreSQL (Multi-AZ for prod)
  - ElastiCache Redis cluster
  - S3 buckets (with versioning)
  - Application Load Balancer
  - ECS Fargate cluster or Elastic Beanstalk environment
- [ ] Configure CloudFront for CDN
- [ ] Set up Route 53 DNS records
- [ ] SSL/TLS certificates (ACM)
- [ ] Secrets Manager for credentials

#### Week 18: Deployment & Monitoring
- [ ] Build Docker images (multi-stage builds)
- [ ] Deploy backend to ECS Fargate/Beanstalk
- [ ] Deploy frontend to S3 + CloudFront (or Vercel)
- [ ] Set up CloudWatch:
  - Application logs (structured logging)
  - Performance metrics (CPU, memory, latency)
  - Custom metrics (forecast runs, API errors)
  - Alarms (critical thresholds)
- [ ] Set up AWS Lambda for scheduled jobs:
  - Nightly forecast recalculation (CloudWatch Events)
  - A&E report generation
  - Data cleanup jobs
- [ ] Backup strategy:
  - RDS automated backups (point-in-time recovery)
  - S3 versioning & lifecycle policies
- [ ] Disaster Recovery plan documentation

---

### **Phase 7: Pilot Launch & Training (Weeks 19-20)**

#### Week 19: F&B Pilot Onboarding
- [ ] Data migration from pilot client (Poke Bowl F&B)
- [ ] User acceptance testing (UAT) with pilot users
- [ ] Bug fixes based on feedback
- [ ] Performance tuning based on real data volumes
- [ ] Customization for specific F&B needs

#### Week 20: Training & Documentation
- [ ] User documentation:
  - Getting Started guide
  - How to import data (step-by-step)
  - How to read and interpret reports
  - S&OP meeting structure guide
- [ ] Training materials:
  - Video tutorials (screen recordings)
  - Live training sessions
- [ ] Admin documentation (system maintenance)
- [ ] API documentation finalization
- [ ] Handover to S&OP Leader (Key User)

---

### **Phase 8: Post-Launch & Iteration (Week 21+)**

#### Ongoing Activities
- [ ] Monitor system performance & errors
- [ ] Collect user feedback (surveys, interviews)
- [ ] Monthly feature releases
- [ ] Scale to additional SME clients
- [ ] Advanced features:
  - AI/ML enhancements (demand sensing)
  - Anomaly detection
  - What-if scenario modeling
- [ ] Mobile app (React Native) - future
- [ ] Integrations:
  - Malaysian accounting software (SQL Account, AutoCount)
  - POS systems
  - E-commerce platforms

---

## Key Technical Deliverables

### 1. Master Data Management
- Product catalog with categories, costing, UOM, TRLT, shelf life
- BOM builder (F&B specific: Poke Bowl → Salmon, Corn, Rice)
- Customer/Supplier database
- Product lifecycle tracking (Phase-In/Phase-Out)

### 2. Dynamic Data Processing
- Real-time Stock On Hand (SOH) tracking
- Rolling Forecast (ROFO) management
- Sales order tracking with delivery dates
- Marketing calendar with promo impacts
- Automated CSV/Excel data import

### 3. Analytics & Reporting
- **ABC/XYZ Analysis** - Product segmentation
- **Gross Margin Report** - Profitability analysis
- **Inventory Health** - SOH, DOH, turnover metrics
- **Demand Forecasting** - SARIMA-based projections
- **Forecast Accuracy** - WMAPE, Bias, error analysis
- **A&E Report** - Cash flow alerts, risk identification
- **AOP vs. Actuals** - Performance tracking

### 4. F&B-Specific Features
- Perishability alerts (shelf-life countdown)
- Seasonal demand pattern detection
- BOM-based inventory requirements
- Waste tracking & reduction
- First-In-First-Out (FIFO) compliance

---

## Development Environment Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.11+
- Docker & Docker Compose
- Git
- AWS CLI (configured)
- PostgreSQL client (optional, for debugging)

### Frontend Setup (velorize-ui)
```bash
npx create-next-app@latest velorize-ui --typescript
cd velorize-ui
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install recharts
npm install @tanstack/react-table
npm install axios
npm install zustand
npm install react-hook-form zod @hookform/resolvers
npm install date-fns
npm install -D eslint prettier eslint-config-prettier
```

### Backend Setup (velorize-backend)
```bash
mkdir velorize-backend
cd velorize-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install fastapi uvicorn[standard]
pip install sqlalchemy alembic psycopg2-binary
pip install pydantic pydantic-settings
pip install pandas numpy scipy statsmodels scikit-learn
pip install python-jose[cryptography] passlib[bcrypt]
pip install python-multipart aiofiles boto3
pip install redis celery
pip install pytest pytest-asyncio httpx
```

### Docker Compose (Local Development)
```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./velorize-backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://velorize:password@db:5432/velorize_db
      REDIS_URL: redis://redis:6379
      SECRET_KEY: dev-secret-key-change-in-prod
    volumes:
      - ./velorize-backend:/app
    depends_on:
      - db
      - redis
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  ui:
    build: ./velorize-ui
    ports:
      - "3000:3000"
    volumes:
      - ./velorize-ui:/app
      - /app/node_modules
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    depends_on:
      - backend
    command: npm run dev

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: velorize_db
      POSTGRES_USER: velorize
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## Database Schema Overview

### Master Data Tables
- `users` - User accounts & authentication
- `products` - Product master data (SKU, category, costing, TRLT, shelf life)
- `customers` - Customer master data (outlets, sold-to parties)
- `suppliers` - Supplier master data
- `bom` - Bill of Materials (finished goods → components)
- `product_lifecycle` - Phase-in/Phase-out tracking

### Dynamic Data Tables
- `stock_on_hand` - Current inventory levels by location
- `demand_forecasts` - Forecasted demand (various methods)
- `sales_actuals` - Historical sales data (outlet-level granularity)
- `sales_orders` - Open orders with delivery dates
- `marketing_calendar` - Promotion periods & tactics
- `aop_targets` - Annual Operating Plan financial targets

### Analytics Tables
- `forecast_accuracy_log` - Historical accuracy metrics (WMAPE, Bias)
- `aging_excess_snapshots` - A&E reports over time
- `inventory_health_metrics` - DOH, turnover calculations
- `abc_xyz_classification` - Product segmentation results

---

## Estimated Resources & Timeline

| Phase | Duration | Team Composition |
|-------|----------|------------------|
| Phase 1-2 | 6 weeks | 1 Backend Dev, 1 DevOps Engineer |
| Phase 3 | 4 weeks | 1-2 Backend Devs (Data/ML focus) |
| Phase 4 | 4 weeks | 2 Frontend Devs, 1 UI/UX Designer |
| Phase 5-6 | 4 weeks | Full team (QA, DevOps, Devs) |
| Phase 7-8 | 2+ weeks | Product Manager, Support Engineer |

**Total MVP Timeline: ~20 weeks (5 months)**

---

## Success Metrics (F&B Pilot)

### Pilot KPIs
- [ ] Reduce Excess & Aging inventory by 20%
- [ ] Improve forecast accuracy (WMAPE) to <15%
- [ ] Increase service level (in-stock rate) to >95%
- [ ] Free up RM50,000+ in working capital (trapped in wrong stock)
- [ ] Achieve S&OP meeting cadence (monthly consensus forecast)

### Technical KPIs
- [ ] System uptime: 99.5%
- [ ] API response time: <500ms (95th percentile)
- [ ] Page load time: <2s (Lighthouse score >90)
- [ ] Zero critical security vulnerabilities
- [ ] Test coverage: >80% (backend), >70% (frontend)

---

## Risk Mitigation

| Risk | Impact | Mitigation Strategy |
|------|--------|---------------------|
| Poor data quality from SMEs | High | Data validation layer, guided import wizard, data cleaning service |
| Low user adoption | High | Extensive training, simple UX, quick wins (A&E report) |
| Complex forecasting algorithms | Medium | Start simple (moving average), iterate to SARIMA |
| AWS costs exceed budget | Medium | Right-size instances, use Spot/Fargate, implement caching |
| Security breach | High | Penetration testing, WAF, regular audits, bug bounty |
| Pilot client dropout | High | Clear value proposition, monthly check-ins, dedicated support |

---

## Next Steps (Immediate Actions)

1. ✅ **Finalize tech stack** - Confirmed: Next.js + FastAPI + PostgreSQL
2. ✅ **Repository structure** - Created plan folder
3. [ ] **Database schema design** - Detailed ERD (next task)
4. [ ] **UI wireframes** - Key dashboards (ABC/XYZ, A&E, Forecast)
5. [ ] **Initialize repositories** - velorize-ui, velorize-backend
6. [ ] **Set up local dev environment** - Docker Compose
7. [ ] **Sprint 1 kickoff** - Authentication & Product Master Data

---

## Contact & Support

- **Project Lead:** [Your Name]
- **Repository:** https://github.com/[org]/Velorize
- **Documentation:** https://docs.velorize.app (future)
- **Support Email:** support@velorize.app (future)

---

**Last Updated:** 2025-11-23
**Version:** 1.0.0
