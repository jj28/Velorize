from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, products, customers, suppliers, bom, inventory, data_import, analytics, forecasting, optimization, marketing, dashboard

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["Suppliers"])
api_router.include_router(bom.router, prefix="/bom", tags=["Bill of Materials"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory Management"])
api_router.include_router(data_import.router, prefix="/import", tags=["Data Import"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & Insights"])
api_router.include_router(forecasting.router, prefix="/forecasting", tags=["Demand Forecasting"])
api_router.include_router(optimization.router, prefix="/optimization", tags=["Inventory Optimization"])
api_router.include_router(marketing.router, prefix="/marketing", tags=["Marketing & AOP"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard & KPIs"])

# Health check endpoint
@api_router.get("/status")
def api_status():
    return {"status": "API v1 is running", "version": "0.1.0"}
