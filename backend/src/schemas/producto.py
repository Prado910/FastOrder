from decimal import Decimal
from pydantic import BaseModel, Field

class ProductoResponse(BaseModel):
    id_producto: int
    nombre: str
    descripcion: str | None = None
    precio: Decimal = Field(example="15000.00")
    id_categoria: int
    categoria: str
    disponible: str