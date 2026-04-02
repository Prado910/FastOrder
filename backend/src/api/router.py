from fastapi import APIRouter

from src.api.endpoints.mesas import router as mesas_router
from src.api.endpoints.productos import router as productos_router
from src.api.endpoints.pedidos import router as pedidos_router

# Agrupa todas las rutas bajo el prefijo base de la API
api_router = APIRouter(prefix="/api")

api_router.include_router(mesas_router, tags=["Mesas"])
api_router.include_router(productos_router, tags=["Productos"])
api_router.include_router(pedidos_router, tags=["Pedidos"])