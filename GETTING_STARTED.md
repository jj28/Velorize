# Getting Started with Velorize

Welcome to **Velorize** - the comprehensive Sales & Operations Planning (S&OP) platform specifically designed for Malaysian F&B SMEs.

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended for easy setup)
- **Node.js 18+** and **Python 3.11+** (for local development)
- **PostgreSQL 15** and **Redis 7** (if not using Docker)

### 1. Start the Development Environment

```bash
# Navigate to project directory
cd Velorize

# Start all services with Docker Compose
docker-compose up -d

# Wait for services to be healthy (check with)
docker-compose ps
```

### 2. Initialize Database

```bash
# Create initial database migration
docker-compose exec backend python create_migration.py

# Apply migrations to create all tables
docker-compose exec backend alembic upgrade head

# Create admin user and sample data
docker-compose exec backend python create_admin_user.py
docker-compose exec backend python seed_sample_data.py
```

### 3. Access the Application

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation (Swagger)**: http://localhost:8000/docs
- **Database Admin (Adminer)**: http://localhost:8080

### 4. Login with Demo Credentials

| Role | Username | Password | Access Level |
|------|----------|----------|-------------|
| Admin | `admin` | `admin123` | Full system access, user management |
| S&OP Leader | `sop_leader` | `sop123` | Planning, forecasting, analytics |
| Viewer | `viewer` | `viewer123` | Read-only access to dashboards |

---

## 📊 What's Implemented

### ✅ Phase 1: Foundation & Infrastructure (Complete)

1. **Development Environment**
   - Docker Compose multi-container setup
   - PostgreSQL 15 database with persistent storage
   - Redis 7 for caching and sessions
   - Hot reloading for both frontend and backend
   - Automated database initialization scripts

2. **Authentication & Authorization**
   - JWT token-based authentication with refresh tokens
   - Role-based access control (RBAC)
   - Secure password hashing with bcrypt
   - Token expiration and renewal
   - Protected routes and API endpoints

3. **Database Architecture**
   - 11 comprehensive models for F&B operations
   - Alembic migrations for version control
   - F&B-specific features:
     - Perishability tracking
     - Shelf life management
     - Halal certification flags
     - Multi-unit of measure support
     - Bill of Materials (BOM) hierarchies

### ✅ Phase 2: Complete Backend API (Complete)

**13 API Modules with 150+ Endpoints:**

1. **Authentication API** (`/api/v1/auth`)
   - User registration, login, logout
   - Token refresh and validation
   - Password reset functionality

2. **User Management API** (`/api/v1/users`)
   - CRUD operations for users
   - Role assignment and permissions
   - User profile management

3. **Product Master Data API** (`/api/v1/products`)
   - Product CRUD with advanced filtering
   - Category management
   - Multi-attribute product configuration
   - Perishability and shelf life tracking

4. **Inventory Management API** (`/api/v1/inventory`)
   - Stock on hand tracking
   - Multi-location inventory
   - Stock movements and adjustments
   - Critical stock alerts
   - Expiry date monitoring

5. **BOM (Bill of Materials) API** (`/api/v1/boms`)
   - Hierarchical BOM structures
   - Component relationships
   - Cost calculation
   - Yield tracking

6. **Customer & Supplier API** (`/api/v1/customers`, `/api/v1/suppliers`)
   - Customer/supplier master data
   - Contact information management
   - Credit terms and payment tracking

7. **Sales Actuals API** (`/api/v1/sales`)
   - Historical sales recording
   - Sales by product/customer/channel
   - Time-series sales data
   - Revenue tracking

8. **Analytics API** (`/api/v1/analytics`)
   - ABC Analysis (revenue classification)
   - XYZ Analysis (demand variability)
   - ABC-XYZ Matrix (strategic inventory classification)
   - Velocity Analysis (turnover ratios)
   - Profitability Analysis

9. **Forecasting API** (`/api/v1/forecasting`)
   - SARIMA (Seasonal ARIMA) forecasting
   - Exponential smoothing
   - Linear regression
   - Moving average methods
   - Forecast accuracy metrics (MAE, MAPE, RMSE)
   - Confidence intervals

10. **Optimization API** (`/api/v1/optimization`)
    - EOQ (Economic Order Quantity) analysis
    - Reorder point optimization
    - Safety stock calculations
    - Stock level recommendations
    - Cost optimization

11. **Marketing Calendar API** (`/api/v1/marketing`)
    - Campaign planning and scheduling
    - Event management (promotions, launches, festivals)
    - Budget tracking
    - Impact analysis
    - AOP (Annual Operating Plan) management

12. **Dashboard API** (`/api/v1/dashboard`)
    - Real-time KPI metrics
    - Trend analysis
    - Critical alerts
    - Executive overview
    - Performance indicators

13. **Settings API** (`/api/v1/settings`)
    - System configuration
    - User preferences
    - Company information
    - Notification settings

### ✅ Phase 3: Complete Frontend Application (Complete)

**Comprehensive React/Next.js UI with Material-UI:**

1. **Authentication & Layout**
   - Login page with form validation
   - JWT token management with Zustand
   - Protected routes with AuthGuard
   - Responsive navigation sidebar
   - App bar with user profile
   - Role-based menu visibility

2. **Dashboard** (`/dashboard`)
   - Executive overview with key metrics
   - Real-time inventory status
   - Sales trends visualization
   - Critical alerts and notifications
   - Quick action cards
   - Revenue and profit indicators

3. **Product Management** (`/products`)
   - Advanced data grid with sorting and filtering
   - Product creation and editing forms
   - Category management
   - Perishability tracking
   - BOM associations
   - Bulk operations

4. **Inventory Management** (`/inventory`)
   - Stock on hand monitoring
   - Multi-location tracking
   - Expiry date alerts
   - Stock movement history
   - Critical stock notifications
   - Reorder suggestions

5. **Analytics & Insights** (`/analytics`)
   - ABC Analysis with visualizations
   - XYZ Analysis for demand patterns
   - ABC-XYZ Matrix strategy mapping
   - Velocity Analysis for turnover
   - Profitability metrics
   - Interactive charts and graphs

6. **Demand Forecasting** (`/forecasting`)
   - AI-powered forecast generation
   - Multiple forecasting methods
   - Forecast accuracy tracking
   - Confidence interval visualization
   - Historical vs predicted comparison
   - Forecast horizon configuration

7. **Inventory Optimization** (`/optimization`)
   - EOQ analysis with cost savings
   - Reorder point recommendations
   - Safety stock calculations
   - Stock level optimization
   - Cost reduction opportunities
   - Implementation roadmap

8. **Data Import/Export** (`/import-export`)
   - Drag-and-drop file upload
   - CSV/Excel import support
   - Template downloads
   - Data validation and error reporting
   - Bulk export functionality
   - Multiple format support (CSV, Excel, JSON, PDF)

9. **Marketing Management** (`/marketing`)
   - Campaign calendar
   - Event planning and scheduling
   - Budget tracking and allocation
   - AOP (Annual Operating Plan) management
   - Performance metrics
   - Impact analysis

10. **Settings & User Management** (`/settings`)
    - User profile management
    - Password change
    - Notification preferences
    - System settings (language, timezone, currency)
    - Company information
    - User administration (admin only)

---

## 🏗️ Project Structure

```
Velorize/
├── velorize-ui/                      # Next.js Frontend Application
│   ├── src/
│   │   ├── app/                      # App Router Pages
│   │   │   ├── login/                # Login page
│   │   │   ├── dashboard/            # Dashboard page
│   │   │   ├── products/             # Product management
│   │   │   ├── inventory/            # Inventory management
│   │   │   ├── analytics/            # Analytics & insights
│   │   │   ├── forecasting/          # Demand forecasting
│   │   │   ├── optimization/         # Inventory optimization
│   │   │   ├── import-export/        # Data import/export
│   │   │   ├── marketing/            # Marketing calendar & AOP
│   │   │   └── settings/             # Settings & user management
│   │   ├── components/               # Reusable Components
│   │   │   ├── layout/               # Layout components
│   │   │   └── dashboard/            # Dashboard components
│   │   ├── store/                    # Zustand State Management
│   │   │   └── authStore.ts          # Authentication state
│   │   └── lib/api/                  # API Client
│   │       └── apiClient.ts          # Comprehensive API client
│   ├── package.json
│   └── tsconfig.json
│
├── velorize-backend/                 # FastAPI Backend Application
│   ├── app/
│   │   ├── api/v1/                   # API Routes
│   │   │   ├── api.py                # Main API router
│   │   │   └── endpoints/            # Individual endpoint modules
│   │   │       ├── auth.py           # Authentication endpoints
│   │   │       ├── users.py          # User management
│   │   │       ├── products.py       # Product management
│   │   │       ├── inventory.py      # Inventory operations
│   │   │       ├── boms.py           # BOM management
│   │   │       ├── customers.py      # Customer management
│   │   │       ├── suppliers.py      # Supplier management
│   │   │       ├── sales.py          # Sales actuals
│   │   │       ├── analytics.py      # Analytics & insights
│   │   │       ├── forecasting.py    # Demand forecasting
│   │   │       ├── optimization.py   # Inventory optimization
│   │   │       ├── marketing.py      # Marketing calendar
│   │   │       ├── dashboard.py      # Dashboard metrics
│   │   │       └── settings.py       # System settings
│   │   ├── models/                   # SQLAlchemy Models
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   ├── inventory.py
│   │   │   ├── bom.py
│   │   │   ├── customer.py
│   │   │   ├── supplier.py
│   │   │   ├── sales.py
│   │   │   ├── forecast.py
│   │   │   └── marketing.py
│   │   ├── schemas/                  # Pydantic Schemas
│   │   │   └── (corresponding schemas for all models)
│   │   ├── core/                     # Core Configuration
│   │   │   ├── config.py             # Settings
│   │   │   ├── security.py           # JWT & password hashing
│   │   │   └── deps.py               # Dependencies
│   │   ├── db/                       # Database
│   │   │   ├── base.py               # Base model imports
│   │   │   └── session.py            # Database session
│   │   └── main.py                   # FastAPI app
│   ├── alembic/                      # Database Migrations
│   ├── create_admin_user.py          # Admin user creation script
│   ├── seed_sample_data.py           # Sample data seeding
│   ├── create_migration.py           # Migration helper
│   ├── requirements.txt
│   └── alembic.ini
│
├── scripts/                          # Database Scripts
│   └── init-db.sql                   # Initial database setup
│
├── plan/                             # Project Documentation
│   ├── DEVELOPMENT_PLAN.md           # Detailed development plan
│   ├── CODE_STYLE_GUIDE.md           # Coding standards
│   └── deployment_plan.md            # Deployment checklist
│
├── docker-compose.yml                # Docker services configuration
├── .gitignore                        # Git ignore rules
├── GETTING_STARTED.md                # This file
└── README.md                         # Project README
```

---

## 🔧 Development Setup

### Option 1: Docker (Recommended)

The easiest way to get started:

```bash
# Start all services
docker-compose up -d

# Initialize database
docker-compose exec backend python create_migration.py
docker-compose exec backend alembic upgrade head
docker-compose exec backend python create_admin_user.py
docker-compose exec backend python seed_sample_data.py

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Local Development

#### Frontend Setup

```bash
cd velorize-ui

# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:3000
```

#### Backend Setup

```bash
cd velorize-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Create admin user
python create_admin_user.py

# Start server
uvicorn app.main:app --reload

# Access at http://localhost:8000
```

---

## 🔑 Key Features

### For Malaysian F&B SMEs

1. **Halal Compliance Tracking**
   - Halal certification flags on products
   - Supplier halal status monitoring
   - Compliance reporting

2. **Perishability Management**
   - Shelf life tracking
   - Expiry date monitoring
   - FIFO/FEFO rotation support
   - Critical stock alerts

3. **Multi-Currency Support**
   - Malaysian Ringgit (MYR) as default
   - Support for SGD, USD, and other currencies
   - Currency conversion tracking

4. **Local Market Features**
   - Festival campaign planning (CNY, Ramadan, Hari Raya, Deepavali)
   - Seasonal demand patterns
   - Local supplier integration

### Advanced S&OP Capabilities

1. **ABC-XYZ Classification**
   - Strategic inventory segmentation
   - Resource allocation optimization
   - Focused management strategies

2. **AI-Powered Forecasting**
   - SARIMA for seasonal patterns
   - Multiple forecasting algorithms
   - Accuracy tracking and continuous improvement

3. **Inventory Optimization**
   - Economic Order Quantity (EOQ)
   - Reorder point optimization
   - Safety stock calculations
   - Cost reduction recommendations

4. **Marketing Integration**
   - Campaign planning aligned with inventory
   - AOP budgeting and tracking
   - Impact analysis on sales

---

## 📚 API Documentation

### Complete API Reference

Access the interactive API documentation at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```bash
# Login to get token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Use token in requests
curl -X GET http://localhost:8000/api/v1/products \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Example API Calls

```bash
# Get all products
GET /api/v1/products

# Create a product
POST /api/v1/products
{
  "product_code": "PRD-001",
  "name": "Nasi Lemak Sauce",
  "category": "SAUCE",
  "unit_price": 8.50,
  "is_perishable": true,
  "shelf_life_days": 180,
  "is_halal": true
}

# Get ABC analysis
GET /api/v1/analytics/abc-analysis?analysis_period_days=90

# Generate forecast
POST /api/v1/forecasting/generate
{
  "product_id": 1,
  "forecast_method": "SARIMA",
  "forecast_horizon_days": 30
}

# Get EOQ recommendations
GET /api/v1/optimization/eoq?analysis_period_days=90
```

---

## 🧪 Testing

### Run Backend Tests

```bash
cd velorize-backend
source venv/bin/activate
pytest
```

### Run Frontend Tests

```bash
cd velorize-ui
npm test
```

---

## 🐛 Troubleshooting

### Common Issues

**Database connection errors:**
```bash
# Check if database is running
docker-compose ps

# Reset database
docker-compose down -v
docker-compose up -d
```

**Frontend module not found:**
```bash
cd velorize-ui
rm -rf node_modules package-lock.json
npm install
```

**Backend import errors:**
```bash
cd velorize-backend
source venv/bin/activate
pip install -r requirements.txt --upgrade
```

**Port conflicts:**
```bash
# Check what's using the port
# Windows:
netstat -ano | findstr :3000

# Linux/Mac:
lsof -i :3000

# Change ports in docker-compose.yml if needed
```

---

## 📖 Additional Resources

- [Development Plan](./plan/DEVELOPMENT_PLAN.md) - Detailed implementation roadmap
- [Code Style Guide](./plan/CODE_STYLE_GUIDE.md) - Coding standards and best practices
- [Deployment Plan](./plan/deployment_plan.md) - Production deployment checklist

### Technology Documentation

- **Next.js**: https://nextjs.org/docs
- **FastAPI**: https://fastapi.tiangolo.com/
- **Material-UI**: https://mui.com/
- **SQLAlchemy**: https://docs.sqlalchemy.org/
- **Alembic**: https://alembic.sqlalchemy.org/
- **Zustand**: https://github.com/pmndrs/zustand

---

## 🎯 Current Status

### ✅ Completed (100%)

- ✅ Complete backend API with 150+ endpoints
- ✅ Full frontend application with 10 main modules
- ✅ Authentication and authorization
- ✅ Database models and migrations
- ✅ Docker development environment
- ✅ Advanced analytics and forecasting
- ✅ Inventory optimization
- ✅ Marketing calendar and AOP
- ✅ Data import/export
- ✅ User management and settings

### 🚀 Ready for Deployment

The application is feature-complete and ready for:
- Production deployment
- User acceptance testing (UAT)
- Performance optimization
- Security hardening
- Monitoring and logging setup

See [deployment_plan.md](./plan/deployment_plan.md) for next steps.

---

## 💡 Quick Tips

1. **Use Docker** for consistent development environment
2. **Check API docs** at http://localhost:8000/docs for endpoint details
3. **Review the Development Plan** for architectural decisions
4. **Follow the Code Style Guide** for consistent code quality
5. **Test thoroughly** before deploying to production
6. **Monitor logs** with `docker-compose logs -f`

---

**Questions or Issues?** Check the documentation in `/plan` or review the README files in each directory.

**Ready to deploy?** See [deployment_plan.md](./plan/deployment_plan.md) for production deployment instructions.
