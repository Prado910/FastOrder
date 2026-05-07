from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from src.db import Base
from src.models.categoria_producto import CategoriaProducto


class Producto(Base):
    __tablename__ = "PRODUCTO"

    id_producto = Column("ID_PRODUCTO", Integer, primary_key=True, index=True)
    id_categoria = Column("ID_CATEGORIA", Integer, ForeignKey("CATEGORIA_PRODUCTO.ID_CATEGORIA"), nullable=False)
    nombre = Column("NOMBRE", String(30), nullable=False, unique=True)
    descripcion = Column("DESCRIPCION", String(250))
    precio = Column("PRECIO", Numeric(10, 2), nullable=False)
    disponible = Column("DISPONIBLE", String(1), nullable=False)

    # Relación con la categoría a la que pertenece el producto
    categoria = relationship(CategoriaProducto, back_populates="productos")