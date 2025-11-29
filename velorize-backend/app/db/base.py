# Import all models for Alembic auto-generation
from app.models.base import Base
from app.models.user import User
from app.models.product import Product
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.models.bom import BillOfMaterials, BOMComponent
from app.models.inventory import StockOnHand
from app.models.forecast import DemandForecast
from app.models.sales import SalesActual, SalesOrder
from app.models.marketing import MarketingCalendar
from app.models.aop import AOPTarget
