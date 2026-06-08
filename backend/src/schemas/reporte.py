from datetime import date
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel


class ReporteEstadoItem(BaseModel):
    estado: str
    cantidad_pedidos: int
    total_ventas: Decimal


class ReporteProductoItem(BaseModel):
    id_producto: int
    nombre_producto: str
    cantidad_vendida: int
    total_ventas: Decimal


class ReportePedidosResponse(BaseModel):
    fecha_desde: date
    fecha_hasta: date
    estado: str
    mensaje: Optional[str] = None
    total_pedidos: int
    total_productos: int
    total_ventas: Decimal
    promedio_por_pedido: Decimal
    ventas_por_estado: List[ReporteEstadoItem]
    productos: List[ReporteProductoItem]