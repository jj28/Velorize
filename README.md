# Velorize

**Democratizing Demand Planning for Malaysian SMEs**

Velorize is a web-based S&OP (Sales & Operations Planning) system that brings enterprise-grade demand planning capabilities to small and medium enterprises in Malaysia, starting with the F&B sector.

## 🎯 Project Overview

### The Problem
- 70% of Malaysian SMEs struggle with cash flow
- Most lack dedicated demand planning resources
- Inventory mismanagement leads to trapped capital and lost sales
- Founders rely on "gut feeling" instead of data-driven decisions

### The Solution
Velorize provides:
- **Automated Forecasting** - SARIMA-based demand predictions
- **Inventory Optimization** - ABC/XYZ analysis, safety stock calculations
- **Cash Flow Insights** - Aging & Excess (A&E) detection
- **Data-Driven Reporting** - WMAPE accuracy, margin analysis
- **S&OP Framework** - Structured planning process for SMEs

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (App Router) + TypeScript
- Material-UI (MUI) v5
- Recharts for visualizations
- TanStack Table for data grids
- Zustand for state management

**Backend:**
- FastAPI (Python 3.11+)
- SQLAlchemy 2.0 ORM
- PostgreSQL 15 database
- Redis for caching
- statsmodels for SARIMA forecasting

**Infrastructure:**
- Docker & Docker Compose
- AWS (ECS Fargate, RDS, ElastiCache, S3)
- GitHub Actions CI/CD

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Running with Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd Velorize

# Start all services
docker-compose up

# Access the application:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

### Local Development (Without Docker)

#### Backend Setup

```bash
cd velorize-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

#### Frontend Setup

```bash
cd velorize-ui

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local

# Start development server
npm run dev
```

## 📁 Project Structure

```
Velorize/
├── velorize-ui/           # Next.js frontend
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities & API client
│   │   ├── store/        # Zustand stores
│   │   ├── types/        # TypeScript types
│   │   └── styles/       # MUI theme
│   └── package.json
│
├── velorize-backend/     # FastAPI backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── core/        # Config & security
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   ├── analytics/   # Forecasting algorithms
│   │   └── main.py      # FastAPI app
│   ├── alembic/         # Database migrations
│   └── requirements.txt
│
├── plan/                # Project documentation
│   ├── DEVELOPMENT_PLAN.md
│   └── CODE_STYLE_GUIDE.md
│
├── infrastructure/      # AWS/Terraform configs (future)
├── docs/               # User documentation
└── docker-compose.yml  # Local development stack
```

## 📊 Key Features

### Master Data Management
- Product catalog with SKUs, categories, costing
- Bill of Materials (BOM) builder for F&B
- Customer & supplier databases
- Product lifecycle tracking (Phase-In/Phase-Out)

### Dynamic Data Processing
- Real-time Stock On Hand (SOH) tracking
- Rolling forecast (ROFO) management
- Sales order tracking with delivery dates
- Marketing calendar with promo impacts
- CSV/Excel data import

### Analytics & Forecasting
- **ABC/XYZ Analysis** - Product segmentation by value & variability
- **Demand Forecasting** - SARIMA for seasonal patterns
- **Forecast Accuracy** - WMAPE, Bias trending
- **Inventory Health** - DOH, turnover metrics
- **A&E Report** - Aging & Excess identification
- **Margin Analysis** - SKU-level profitability

### F&B-Specific Features
- Perishability tracking (shelf-life alerts)
- BOM-based inventory requirements
- Seasonal demand pattern detection
- FIFO compliance

## 📖 Documentation

- **[Development Plan](./plan/DEVELOPMENT_PLAN.md)** - Complete project roadmap
- **[Code Style Guide](./plan/CODE_STYLE_GUIDE.md)** - Coding standards & conventions
- **[Frontend README](./velorize-ui/README.md)** - UI setup & development
- **[Backend README](./velorize-backend/README.md)** - API setup & development

## 🧪 Testing

### Backend Tests
```bash
cd velorize-backend
pytest
pytest --cov=app tests/  # With coverage
```

### Frontend Tests
```bash
cd velorize-ui
npm run test
```

## 📦 Deployment

### AWS Deployment (Production)

See [DEVELOPMENT_PLAN.md](./plan/DEVELOPMENT_PLAN.md) Phase 6 for detailed AWS deployment instructions.

Key AWS services:
- **ECS Fargate** - Container hosting
- **RDS PostgreSQL** - Database (Multi-AZ)
- **ElastiCache Redis** - Caching
- **S3** - File storage
- **CloudFront** - CDN for frontend
- **Route 53** - DNS
- **Lambda** - Scheduled jobs (forecast calculation)

## 🤝 Contributing

1. Follow the code style guide in `/plan/CODE_STYLE_GUIDE.md`
2. Create feature branches: `feature/your-feature-name`
3. Write tests for new features
4. Submit pull requests with clear descriptions

## 📝 License

[Add license information]

## 👥 Team

- **Project Lead:** [Your Name]
- **Target Market:** Malaysian F&B SMEs
- **Pilot Client:** [F&B Business Name]

## 🎯 Roadmap

### Phase 1 (Current) - MVP Development
- [x] Project initialization
- [x] Frontend & backend scaffolding
- [ ] Database schema design
- [ ] Authentication & user management
- [ ] Master data CRUD operations
- [ ] Basic forecasting engine
- [ ] Dashboard UI

### Phase 2 - F&B Pilot Launch
- [ ] Pilot client onboarding
- [ ] BOM management
- [ ] SARIMA forecasting
- [ ] A&E reporting
- [ ] User training

### Phase 3 - Scale & Enhance
- [ ] Multi-client support
- [ ] Advanced AI/ML features
- [ ] Mobile app
- [ ] Accounting software integrations

---

**From Chaos to Clarity. Your First Lap of S&OP.**

For detailed implementation steps, see [DEVELOPMENT_PLAN.md](./plan/DEVELOPMENT_PLAN.md).
