from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field

# Schemas de entrada y salida para la gestión de pedidos en la API
class PedidoItemCreate(BaseModel):
    id_producto: int
    cantidad: int = Field(gt=0)
    observacion_item: Optional[str] = None


class PedidoCreate(BaseModel):
    id_mesa: int
    id_usuario_mesero: int
    items: List[PedidoItemCreate]


class PedidoItemResponse(BaseModel):
    id_producto: int
    nombre_producto: str
    cantidad: int
    precio_unitario: Decimal = Field(example="15000.00")
    subtotal: Decimal = Field(example="30000.00")
    observacion_item: Optional[str] = None


class PedidoResponse(BaseModel):
    id_pedido: int
    numero_pedido: str
    id_mesa: int
    estado: str
    total: Decimal = Field(example="45000.00")
    items: List[PedidoItemResponse]