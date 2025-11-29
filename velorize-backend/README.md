# Velorize Backend

FastAPI backend for Velorize - Demand Planning & S&OP System for Malaysian SMEs.

## Tech Stack

- **Framework:** FastAPI
- **Language:** Python 3.11+
- **ORM:** SQLAlchemy 2.0
- **Database:** PostgreSQL 15
- **Cache:** Redis
- **Analytics:** pandas, numpy, statsmodels (SARIMA)
- **Authentication:** JWT (python-jose)

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis (optional for local dev)

### Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Update .env with your database credentials
```

### Database Setup

```bash
# Create database (PostgreSQL)
createdb velorize_db

# Run migrations
alembic upgrade head
```

### Development

```bash
# Run development server with auto-reload
uvicorn app.main:app --reload

# API will be available at http://localhost:8000
# API docs at http://localhost:8000/docs
# Alternative docs at http://localhost:8000/redoc
```

### Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description of changes"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1
```

### Code Quality

```bash
# Format code
black app/
isort app/

# Type checking
mypy app/

# Run tests
pytest

# Run tests with coverage
pytest --cov=app tests/
```

## Project Structure

```
app/
├── api/                    # API routes
│   └── v1/
│       ├── endpoints/      # Endpoint modules
│       └── api.py         # API router aggregation
├── core/                  # Core configuration
│   ├── config.py         # Settings (Pydantic)
│   ├── security.py       # JWT, password hashing
│   └── deps.py           # Dependencies (DB, auth)
├── models/               # SQLAlchemy models
├── schemas/              # Pydantic schemas
├── services/             # Business logic
├── analytics/            # Forecasting & algorithms
│   ├── abc_analysis.py
│   ├── forecasting.py    # SARIMA, etc.
│   └── wmape.py
├── db/                   # Database
│   ├── base.py          # Base model
│   └── session.py       # DB session
└── main.py              # FastAPI app
```

## Key Features

- **Authentication:** JWT-based auth with role-based access
- **Master Data:** Product, Customer, Supplier, BOM management
- **Dynamic Data:** SOH tracking, forecast management, sales data
- **Analytics:**
  - ABC/XYZ classification
  - SARIMA-based forecasting
  - WMAPE & forecast accuracy
  - Aging & Excess detection
  - Safety stock calculations
- **File Import:** CSV/Excel data ingestion
- **Reporting:** Generate analysis reports

## API Documentation

Once the server is running:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Environment Variables

See `.env.example` for required variables.

## Code Style

- Follow conventions in `/plan/CODE_STYLE_GUIDE.md`
- Use type hints for all functions
- Write docstrings for public functions
- Follow PEP 8 style guide

## Learn More

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Project Development Plan](/plan/DEVELOPMENT_PLAN.md)
