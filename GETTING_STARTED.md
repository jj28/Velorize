# Getting Started with Velorize

## ✅ What's Been Set Up

### Project Structure Created
```
Velorize/
├── velorize-ui/          ✅ Next.js frontend (TypeScript)
├── velorize-backend/     ✅ FastAPI backend (Python)
├── plan/                 ✅ Project documentation
├── docker-compose.yml    ✅ Local development environment
└── README.md             ✅ Project overview
```

### Frontend (velorize-ui)
- ✅ Next.js 14 with App Router
- ✅ TypeScript configuration
- ✅ Material-UI (MUI) theme setup
- ✅ ESLint & Prettier configured
- ✅ Axios API client template
- ✅ Zustand state management setup
- ✅ TypeScript types for data models
- ✅ Package.json with all dependencies

### Backend (velorize-backend)
- ✅ FastAPI project structure
- ✅ SQLAlchemy ORM setup
- ✅ JWT authentication templates
- ✅ Database session management
- ✅ Configuration with Pydantic Settings
- ✅ Security utilities (password hashing, JWT)
- ✅ Requirements.txt with all dependencies
- ✅ Dockerfile for containerization

### Documentation
- ✅ Complete Development Plan ([plan/DEVELOPMENT_PLAN.md](./plan/DEVELOPMENT_PLAN.md))
- ✅ Code Style Guide ([plan/CODE_STYLE_GUIDE.md](./plan/CODE_STYLE_GUIDE.md))
- ✅ Frontend README
- ✅ Backend README

---

## 🚀 Quick Start Guide

### Option 1: Run with Docker (Recommended)

This is the easiest way to get everything running:

```bash
# Make sure you're in the Velorize directory
cd /home/user/Velorize

# Start all services (database, redis, backend, frontend)
docker-compose up

# To run in detached mode (background):
docker-compose up -d

# To stop services:
docker-compose down
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Option 2: Run Locally (For Development)

#### Step 1: Install Frontend Dependencies

```bash
cd velorize-ui
npm install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local if needed (default values should work)
```

#### Step 2: Install Backend Dependencies

```bash
cd ../velorize-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
```

#### Step 3: Start Database (Required)

You'll need PostgreSQL and Redis running. Use Docker for just these services:

```bash
# From the root Velorize directory
docker-compose up db redis
```

Or install PostgreSQL and Redis locally on your system.

#### Step 4: Run Database Migrations

```bash
cd velorize-backend

# Make sure virtual environment is activated
source venv/bin/activate

# Run migrations (once backend models are created)
alembic upgrade head
```

#### Step 5: Start the Backend

```bash
cd velorize-backend

# Make sure virtual environment is activated
source venv/bin/activate

# Start FastAPI server with auto-reload
uvicorn app.main:app --reload

# Server will start at http://localhost:8000
```

#### Step 6: Start the Frontend

Open a new terminal:

```bash
cd velorize-ui

# Start Next.js development server
npm run dev

# App will start at http://localhost:3000
```

---

## 📋 Next Steps (Development Tasks)

### Immediate Priority

1. **Install Dependencies**
   ```bash
   # Frontend
   cd velorize-ui && npm install

   # Backend
   cd velorize-backend && pip install -r requirements.txt
   ```

2. **Create Database Schema**
   - Design complete ERD (Entity-Relationship Diagram)
   - Create SQLAlchemy models for:
     - Users
     - Products
     - Customers/Suppliers
     - BOM (Bill of Materials)
     - Stock On Hand
     - Forecasts
     - Sales Actuals

3. **Test the Setup**
   ```bash
   # Try starting with Docker
   docker-compose up

   # Visit http://localhost:3000 (should see "Welcome to Velorize")
   # Visit http://localhost:8000/docs (should see API documentation)
   ```

### Week 1 Tasks (from Development Plan)

- [ ] Test Docker Compose setup
- [ ] Install npm dependencies (velorize-ui)
- [ ] Install pip dependencies (velorize-backend)
- [ ] Design complete database schema
- [ ] Create initial database migrations
- [ ] Build authentication system (login/register)
- [ ] Create user management endpoints
- [ ] Build login UI page

### Week 2 Tasks

- [ ] Product master data models & endpoints
- [ ] Customer/supplier models & endpoints
- [ ] BOM management backend
- [ ] Product management UI
- [ ] File upload system (CSV/Excel)

---

## 🔧 Useful Commands

### Docker Commands

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild containers (after code changes)
docker-compose up --build

# Access backend shell
docker-compose exec backend bash

# Access database
docker-compose exec db psql -U velorize -d velorize_db
```

### Frontend Commands

```bash
cd velorize-ui

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type check
npm run type-check
```

### Backend Commands

```bash
cd velorize-backend

# Activate virtual environment
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server with auto-reload
uvicorn app.main:app --reload

# Create database migration
alembic revision --autogenerate -m "description"

# Run migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Run tests
pytest

# Format code
black app/
isort app/
```

---

## 🐛 Troubleshooting

### Docker Issues

**Problem:** Port already in use
```bash
# Check what's using the port
lsof -i :8000  # or :3000, :5432, etc.

# Kill the process or change ports in docker-compose.yml
```

**Problem:** Permission errors
```bash
# Give permissions to directories
chmod -R 755 velorize-ui velorize-backend
```

### Database Issues

**Problem:** Can't connect to database
```bash
# Check if database is running
docker-compose ps

# Check database logs
docker-compose logs db

# Verify credentials in .env match docker-compose.yml
```

### Frontend Issues

**Problem:** Module not found
```bash
# Delete node_modules and reinstall
cd velorize-ui
rm -rf node_modules package-lock.json
npm install
```

### Backend Issues

**Problem:** Import errors
```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt --upgrade
```

---

## 📚 Learning Resources

- **Next.js:** https://nextjs.org/docs
- **FastAPI:** https://fastapi.tiangolo.com/
- **Material-UI:** https://mui.com/
- **SQLAlchemy:** https://docs.sqlalchemy.org/
- **Pydantic:** https://docs.pydantic.dev/

---

## 🎯 Current Project Status

### ✅ Completed
- [x] Project structure created
- [x] Frontend scaffolding (Next.js + TypeScript + MUI)
- [x] Backend scaffolding (FastAPI + SQLAlchemy)
- [x] Docker Compose configuration
- [x] Development plan documentation
- [x] Code style guide

### 🏗️ In Progress
- [ ] Installing dependencies
- [ ] Database schema design
- [ ] Authentication system

### 📅 Upcoming (This Week)
- [ ] User authentication & authorization
- [ ] Product master data management
- [ ] Basic dashboard UI
- [ ] Database migrations

---

## 💡 Tips

1. **Always check the Development Plan** ([plan/DEVELOPMENT_PLAN.md](./plan/DEVELOPMENT_PLAN.md)) for detailed task breakdown

2. **Follow the Code Style Guide** ([plan/CODE_STYLE_GUIDE.md](./plan/CODE_STYLE_GUIDE.md)) for consistent coding

3. **Use Docker for consistency** - It ensures everyone has the same environment

4. **Commit often** - Make small, focused commits with clear messages

5. **Test as you go** - Don't wait until the end to test features

6. **Read the README files** - Each subfolder has specific setup instructions

---

**Questions?** Check the documentation in `/plan` or refer to the README files in each directory.

**Ready to start coding?** Begin with installing dependencies and testing the Docker setup!
