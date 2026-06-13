from datetime import datetime
from decimal import Decimal
from typing import List

from pydantic import BaseModel, Field

from src.schemas.pedido import PedidoItemResponse


class FacturaCreate(BaseModel):
    id_pedido: int
    id_usuario_cajero: int
    propina: Decimal = Field(default=Decimal("0.00"), ge=0)


class FacturaResponse(BaseModel):
    id_factura: int
    numero_factura: str
    id_pedido: int
    numero_pedido: str
    numero_mesa: int | None = None
    mesero: str | None = None
    cajero: str | None = None
    fecha_hora_factura: datetime
    subtotal: Decimal
    propina: Decimal
    total: Decimal
    items: List[PedidoItemResponse]