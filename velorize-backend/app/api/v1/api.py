from fastapi import APIRouter
# from app.api.v1.endpoints import auth, products, forecasts

api_router = APIRouter()

# Include endpoint routers here
# api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
# api_router.include_router(products.router, prefix="/products", tags=["Products"])
# api_router.include_router(forecasts.router, prefix="/forecasts", tags=["Forecasts"])

# Placeholder health endpoint
@api_router.get("/status")
def api_status():
    return {"status": "API v1 is running"}
