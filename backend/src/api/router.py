from fastapi import APIRouter

from src.api.endpoints.auth import router as auth_router
from src.api.endpoints.mesas import router as mesas_router
from src.api.endpoints.productos import router as productos_router
from src.api.endpoints.pedidos import router as pedidos_router
from src.api.endpoints.facturas import router as facturas_router

# Agrupa todas las rutas bajo el prefijo base de la API
api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router, tags=["Autenticación"])
api_router.include_router(mesas_router, tags=["Mesas"])
api_router.include_router(productos_router, tags=["Productos"])
api_router.include_router(pedidos_router, tags=["Pedidos"])
api_router.include_router(facturas_router, tags=["Facturas"])