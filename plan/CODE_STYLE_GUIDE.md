# Velorize Code Style Guide & Development Standards

**Last Updated:** 2025-11-23
**Purpose:** Reference document for consistent code style, naming conventions, and best practices across the Velorize project.

---

## Project Naming Conventions

### Repository & Folder Names
- **Frontend:** `velorize-ui` (Next.js application)
- **Backend:** `velorize-backend` (FastAPI application)
- **Infrastructure:** `infrastructure/`
- **Documentation:** `plan/`, `docs/`

### Branch Naming
```
main                    # Production-ready code
develop                 # Integration branch
feature/feature-name    # New features
bugfix/bug-description  # Bug fixes
hotfix/critical-fix     # Production hotfixes
release/v1.0.0          # Release preparation
```

---

## Frontend (velorize-ui) - Next.js + TypeScript

### File & Folder Structure
```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Route groups
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   └── layout.tsx
├── components/              # Reusable components
│   ├── common/             # Generic components
│   │   ├── Button.tsx
│   │   └── DataTable.tsx
│   ├── dashboard/          # Feature-specific components
│   └── layout/             # Layout components
├── lib/                    # Utilities & helpers
│   ├── api/               # API client
│   ├── utils/             # Helper functions
│   └── constants.ts       # App constants
├── store/                 # Zustand stores
│   ├── useAuthStore.ts
│   └── useProductStore.ts
├── types/                 # TypeScript types/interfaces
│   ├── api.ts
│   └── models.ts
└── styles/                # Global styles
    └── theme.ts           # MUI theme
```

### Naming Conventions

#### Files
- **Components:** PascalCase (e.g., `ProductList.tsx`, `DashboardCard.tsx`)
- **Pages:** lowercase (e.g., `page.tsx`, `layout.tsx`)
- **Utilities:** camelCase (e.g., `formatCurrency.ts`, `apiClient.ts`)
- **Types:** PascalCase (e.g., `Product.ts`, `ForecastData.ts`)
- **Stores:** camelCase with `use` prefix (e.g., `useAuthStore.ts`)

#### Variables & Functions
```typescript
// Variables: camelCase
const productList = [];
const isLoading = false;

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'http://localhost:8000';
const MAX_RETRY_ATTEMPTS = 3;

// Functions: camelCase (verb-first)
function fetchProducts() {}
function calculateWMAPE() {}
const handleSubmit = () => {};

// Components: PascalCase
function ProductCard({ product }: Props) {}
const DashboardLayout = () => {};

// Interfaces/Types: PascalCase with 'I' prefix (optional) or just PascalCase
interface Product {}
interface IProductProps {}
type ForecastMethod = 'SARIMA' | 'MovingAverage';

// Enums: PascalCase
enum UserRole {
  Admin = 'admin',
  SopLeader = 'sop_leader',
  Viewer = 'viewer'
}
```

### Component Structure
```typescript
'use client'; // Only if client component

import React from 'react';
import { Box, Typography } from '@mui/material';

// Types/Interfaces at top
interface ProductCardProps {
  product: Product;
  onEdit?: (id: string) => void;
}

// Component definition
export default function ProductCard({ product, onEdit }: ProductCardProps) {
  // Hooks first
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Event handlers
  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  // Render helpers (optional)
  const renderDetails = () => {
    return <Box>...</Box>;
  };

  // Main return
  return (
    <Box>
      <Typography variant="h6">{product.name}</Typography>
      {isExpanded && renderDetails()}
    </Box>
  );
}
```

### TypeScript Best Practices
```typescript
// ✅ DO: Explicit return types for functions
function calculateMargin(cost: number, price: number): number {
  return ((price - cost) / price) * 100;
}

// ✅ DO: Use interfaces for object shapes
interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string; // Optional property
}

// ✅ DO: Use type unions for specific values
type ForecastMethod = 'SARIMA' | 'MovingAverage' | 'Exponential';

// ✅ DO: Use Partial, Pick, Omit for derived types
type ProductInput = Omit<Product, 'id'>;
type ProductUpdate = Partial<Product>;

// ❌ DON'T: Use 'any' (use 'unknown' if truly dynamic)
// const data: any = await fetch(...);  // BAD
const data: unknown = await fetch(...); // BETTER

// ✅ DO: Use generics for reusable components
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
}
```

### API Client Pattern
```typescript
// lib/api/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add auth token)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (handle errors)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401, refresh token, etc.
    return Promise.reject(error);
  }
);

export default apiClient;

// lib/api/products.ts
export const productApi = {
  getAll: () => apiClient.get<Product[]>('/api/v1/products'),
  getById: (id: string) => apiClient.get<Product>(`/api/v1/products/${id}`),
  create: (data: ProductInput) => apiClient.post<Product>('/api/v1/products', data),
  update: (id: string, data: ProductUpdate) => apiClient.put<Product>(`/api/v1/products/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/v1/products/${id}`),
};
```

### State Management (Zustand)
```typescript
// store/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const response = await authApi.login(email, password);
        set({
          user: response.data.user,
          accessToken: response.data.accessToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ accessToken: state.accessToken }), // Only persist token
    }
  )
);
```

### Styling (MUI + Emotion)
```typescript
// Prefer sx prop over styled components for simple styles
<Box
  sx={{
    display: 'flex',
    gap: 2,
    p: 3,
    backgroundColor: 'primary.light',
  }}
>
  ...
</Box>

// Use styled for complex, reusable components
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  '&:hover': {
    boxShadow: theme.shadows[8],
  },
}));
```

---

## Backend (velorize-backend) - FastAPI + Python

### File & Folder Structure
```
app/
├── api/                    # API routes
│   └── v1/
│       ├── endpoints/
│       │   ├── auth.py
│       │   ├── products.py
│       │   └── forecasts.py
│       └── api.py         # API router aggregation
├── core/                  # Core config
│   ├── config.py         # Settings (Pydantic Settings)
│   ├── security.py       # JWT, password hashing
│   └── deps.py           # Dependencies (DB session, auth)
├── models/               # SQLAlchemy models
│   ├── user.py
│   ├── product.py
│   └── forecast.py
├── schemas/              # Pydantic schemas
│   ├── user.py
│   ├── product.py
│   └── forecast.py
├── services/             # Business logic
│   ├── auth_service.py
│   ├── product_service.py
│   └── forecast_service.py
├── analytics/            # Analytics & algorithms
│   ├── abc_analysis.py
│   ├── forecasting.py    # SARIMA, etc.
│   └── wmape.py
├── db/                   # Database
│   ├── base.py          # Base model
│   └── session.py       # DB session
└── main.py              # FastAPI app
```

### Naming Conventions

#### Files
- **Modules:** snake_case (e.g., `product_service.py`, `abc_analysis.py`)
- **Models:** snake_case, singular (e.g., `product.py`, `user.py`)
- **Schemas:** snake_case, singular (e.g., `product.py`)

#### Variables & Functions
```python
# Variables: snake_case
product_list = []
is_active = True

# Constants: UPPER_SNAKE_CASE
DATABASE_URL = "postgresql://..."
MAX_CONNECTIONS = 10

# Functions: snake_case (verb-first)
def get_product_by_id(product_id: str) -> Product:
    pass

def calculate_wmape(forecasts: list, actuals: list) -> float:
    pass

# Classes: PascalCase
class Product(Base):
    pass

class ProductService:
    pass

# Private methods/variables: leading underscore
def _validate_forecast_data(data):
    pass
```

### SQLAlchemy Model Structure
```python
# app/models/product.py
from sqlalchemy import Column, String, Numeric, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
import uuid
from datetime import datetime

class Product(Base):
    __tablename__ = "products"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Required fields
    sku_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)

    # Optional fields
    category = Column(String(100), nullable=True)
    unit_cost = Column(Numeric(10, 2), nullable=True)
    rrp = Column(Numeric(10, 2), nullable=True)
    uom = Column(String(20), nullable=True)
    trlt_days = Column(Integer, nullable=True)  # Total Replenishment Lead Time
    shelf_life_days = Column(Integer, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Product(sku_code='{self.sku_code}', name='{self.name}')>"
```

### Pydantic Schema Structure
```python
# app/schemas/product.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal

# Base schema (shared fields)
class ProductBase(BaseModel):
    sku_code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    unit_cost: Optional[Decimal] = Field(None, ge=0)
    rrp: Optional[Decimal] = Field(None, ge=0)
    uom: Optional[str] = Field(None, max_length=20)
    trlt_days: Optional[int] = Field(None, ge=0)
    shelf_life_days: Optional[int] = Field(None, ge=0)

    @field_validator('sku_code')
    @classmethod
    def sku_code_must_be_uppercase(cls, v: str) -> str:
        return v.upper()

# Schema for creating (no id, timestamps)
class ProductCreate(ProductBase):
    pass

# Schema for updating (all fields optional)
class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = None
    unit_cost: Optional[Decimal] = None
    rrp: Optional[Decimal] = None
    # ... other fields

# Schema for responses (includes id, timestamps)
class Product(ProductBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Pydantic v2 (was orm_mode in v1)
```

### API Endpoint Structure
```python
# app/api/v1/endpoints/products.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.deps import get_db, get_current_user
from app.schemas import product as schemas
from app.services import product_service
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[schemas.Product])
def get_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all products with pagination.

    - **skip**: Number of records to skip (for pagination)
    - **limit**: Maximum number of records to return
    """
    products = product_service.get_multi(db, skip=skip, limit=limit)
    return products

@router.get("/{product_id}", response_model=schemas.Product)
def get_product(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a single product by ID."""
    product = product_service.get(db, product_id=product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product

@router.post("/", response_model=schemas.Product, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new product."""
    # Check if SKU already exists
    existing = product_service.get_by_sku(db, sku_code=product_in.sku_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product with this SKU already exists"
        )

    product = product_service.create(db, obj_in=product_in)
    return product

@router.put("/{product_id}", response_model=schemas.Product)
def update_product(
    product_id: UUID,
    product_in: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a product."""
    product = product_service.get(db, product_id=product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    product = product_service.update(db, db_obj=product, obj_in=product_in)
    return product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a product."""
    product = product_service.get(db, product_id=product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    product_service.remove(db, product_id=product_id)
    return None
```

### Service Layer Pattern
```python
# app/services/product_service.py
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate

class ProductService:
    def get(self, db: Session, product_id: UUID) -> Optional[Product]:
        return db.query(Product).filter(Product.id == product_id).first()

    def get_by_sku(self, db: Session, sku_code: str) -> Optional[Product]:
        return db.query(Product).filter(Product.sku_code == sku_code).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[Product]:
        return db.query(Product).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: ProductCreate) -> Product:
        db_obj = Product(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: Product, obj_in: ProductUpdate) -> Product:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, product_id: UUID) -> None:
        obj = db.query(Product).filter(Product.id == product_id).first()
        db.delete(obj)
        db.commit()

# Singleton instance
product_service = ProductService()
```

### Type Hints Best Practices
```python
from typing import List, Dict, Optional, Union, Any
from decimal import Decimal

# ✅ DO: Use type hints for all function signatures
def calculate_margin(cost: Decimal, price: Decimal) -> Decimal:
    return ((price - cost) / price) * 100

# ✅ DO: Use Optional for nullable values
def get_product_category(product_id: str) -> Optional[str]:
    pass

# ✅ DO: Use Union for multiple possible types
def process_data(data: Union[dict, list]) -> None:
    pass

# ✅ DO: Use generics for flexibility
from typing import TypeVar, Generic

T = TypeVar('T')

def get_first_item(items: List[T]) -> Optional[T]:
    return items[0] if items else None
```

---

## Database Standards

### Table Naming
- **Lowercase, plural, snake_case:** `products`, `sales_orders`, `forecast_accuracy_logs`
- **Junction tables:** `product_categories` or `products_categories`

### Column Naming
- **Lowercase, snake_case:** `created_at`, `unit_cost`, `sku_code`
- **Boolean fields:** `is_active`, `has_shelf_life`
- **Foreign keys:** `{table}_id` (e.g., `product_id`, `customer_id`)

### Indexes
```sql
-- Always index foreign keys
CREATE INDEX idx_bom_finished_good_id ON bom(finished_good_id);
CREATE INDEX idx_bom_component_id ON bom(component_id);

-- Index frequently queried fields
CREATE INDEX idx_products_sku_code ON products(sku_code);
CREATE INDEX idx_products_category ON products(category);

-- Composite indexes for common queries
CREATE INDEX idx_sales_actuals_product_date ON sales_actuals(product_id, sale_date);
```

---

## Testing Standards

### Frontend Testing (Jest + React Testing Library)
```typescript
// ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from './ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '123',
    name: 'Test Product',
    sku: 'TEST-001',
    category: 'Food',
  };

  it('renders product name', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const handleEdit = jest.fn();
    render(<ProductCard product={mockProduct} onEdit={handleEdit} />);

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(handleEdit).toHaveBeenCalledWith('123');
  });
});
```

### Backend Testing (pytest)
```python
# tests/test_products.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_product():
    response = client.post(
        "/api/v1/products/",
        json={
            "sku_code": "TEST-001",
            "name": "Test Product",
            "unit_cost": "10.50",
            "rrp": "15.00",
        },
        headers={"Authorization": f"Bearer {get_test_token()}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["sku_code"] == "TEST-001"
    assert data["name"] == "Test Product"

def test_get_product_not_found():
    response = client.get(
        "/api/v1/products/00000000-0000-0000-0000-000000000000",
        headers={"Authorization": f"Bearer {get_test_token()}"}
    )
    assert response.status_code == 404
```

---

## Git Commit Messages

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Build process, dependencies, tooling

### Examples
```
feat(products): add BOM management endpoints

- Implement CRUD operations for Bill of Materials
- Add validation for component quantities
- Create database migrations

Closes #123

---

fix(forecasting): correct WMAPE calculation for zero actuals

Previously, division by zero caused crashes when actual sales were 0.
Now returns null for those periods and excludes from aggregate WMAPE.

Fixes #456

---

docs(api): update product API documentation

Add examples for BOM creation and query parameters.
```

---

## Code Review Checklist

### General
- [ ] Code follows style guide (no linting errors)
- [ ] All functions have appropriate type hints
- [ ] No hardcoded credentials or secrets
- [ ] Error handling is appropriate
- [ ] Logging is adequate (info, warning, error levels)

### Frontend
- [ ] Components are properly typed (TypeScript)
- [ ] No console.log in production code
- [ ] Loading and error states are handled
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Responsive design tested

### Backend
- [ ] Database queries are optimized (no N+1 queries)
- [ ] Input validation (Pydantic schemas)
- [ ] Authentication/authorization checks
- [ ] API documentation is accurate
- [ ] Tests cover happy path + edge cases

---

## Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=Velorize
NEXT_PUBLIC_ENV=development
```

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://velorize:password@localhost:5432/velorize_db

# Redis
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-secret-key-min-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AWS (optional for local dev)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# Environment
ENVIRONMENT=development
DEBUG=True
```

**⚠️ NEVER commit .env files to Git!**

---

## Performance Guidelines

### Frontend
- Use `React.memo()` for expensive components
- Implement virtual scrolling for large lists (TanStack Virtual)
- Lazy load routes with `next/dynamic`
- Optimize images with `next/image`
- Debounce search inputs (300ms)

### Backend
- Use database indexes for common queries
- Implement pagination (default limit: 100)
- Cache frequently accessed data (Redis)
- Use async/await for I/O operations
- Batch database operations where possible

---

## Security Checklist

- [ ] All API endpoints require authentication (except login/register)
- [ ] Input validation on both client and server
- [ ] SQL injection prevention (use ORM, parameterized queries)
- [ ] XSS prevention (sanitize user input, use CSP headers)
- [ ] CSRF protection (SameSite cookies, CSRF tokens)
- [ ] Rate limiting on API endpoints
- [ ] Passwords hashed with bcrypt (min 12 rounds)
- [ ] HTTPS only in production
- [ ] Secrets stored in environment variables, not code
- [ ] Regular dependency updates (npm audit, pip-audit)

---

## Documentation Standards

### Code Comments
```python
# ✅ DO: Explain WHY, not WHAT
# Calculate WMAPE excluding periods with zero actuals to avoid division by zero
if actual > 0:
    mape = abs((forecast - actual) / actual)

# ❌ DON'T: Redundant comments
# Add 1 to counter
counter += 1
```

### Docstrings (Python)
```python
def calculate_wmape(forecasts: List[float], actuals: List[float]) -> float:
    """
    Calculate Weighted Mean Absolute Percentage Error.

    WMAPE measures forecast accuracy by weighting errors by actual values.
    This is more robust than MAPE for datasets with low or zero values.

    Args:
        forecasts: List of forecasted values
        actuals: List of actual values (must match forecasts length)

    Returns:
        WMAPE as a percentage (0-100). Lower is better.
        Returns None if all actuals are zero.

    Raises:
        ValueError: If forecasts and actuals have different lengths

    Example:
        >>> calculate_wmape([100, 200, 150], [110, 190, 160])
        6.52
    """
    pass
```

---

## Recommended VS Code Extensions

### Frontend
- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense (if using Tailwind)
- ES7+ React/Redux/React-Native snippets

### Backend
- Python
- Pylance
- autopep8 or Black Formatter
- autoDocstring

### General
- GitLens
- Docker
- Better Comments
- Error Lens

---

## Quick Reference Commands

### Frontend
```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Test
npm run test

# Type check
npm run type-check
```

### Backend
```bash
# Run server (development)
uvicorn app.main:app --reload

# Run tests
pytest

# Create migration
alembic revision --autogenerate -m "description"

# Run migrations
alembic upgrade head

# Format code
black app/
isort app/

# Type check
mypy app/
```

---

**Last Updated:** 2025-11-23
**Version:** 1.0.0

This guide is a living document. Update it as the project evolves!
