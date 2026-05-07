from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Literal
import re

from pydantic import BaseModel, Field, field_validator

OBSERVACION_REGEX = re.compile(
    r"^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,;:()\-]*$"
)


class PedidoItemCreate(BaseModel):
    id_producto: int
    cantidad: int = Field(gt=0)
    observacion_item: Optional[str] = None

    @field_validator("observacion_item")
    def validar_observacion_item(cls, value):
        if value is None:
            return value

        value = value.strip()

        if value == "":
            return None

        if len(value) > 250:
            raise ValueError("La nota no puede superar los 250 caracteres.")

        if not OBSERVACION_REGEX.fullmatch(value):
            raise ValueError("La nota contiene caracteres no permitidos.")

        return value


class PedidoCreate(BaseModel):
    id_mesa: int
    id_usuario_mesero: int
    items: List[PedidoItemCreate]


class PedidoEstadoUpdate(BaseModel):
    estado: Literal["EN_PREPARACION", "LISTO"]


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
    numero_mesa: Optional[int] = None
    mesero: Optional[str] = None
    estado: str
    total: Decimal = Field(example="45000.00")
    fecha_hora_creacion: Optional[datetime] = None
    items: List[PedidoItemResponse]