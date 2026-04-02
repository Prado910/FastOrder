from sqlalchemy import Column, Integer, String, Numeric

from src.db import Base


class Producto(Base):
    __tablename__ = "PRODUCTO"

    id_producto = Column("ID_PRODUCTO", Integer, primary_key=True, index=True)
    id_categoria = Column("ID_CATEGORIA", Integer, nullable=False)
    nombre = Column("NOMBRE", String(30), nullable=False, unique=True)
    descripcion = Column("DESCRIPCION", String(250))
    precio = Column("PRECIO", Numeric(10, 2), nullable=False)
    disponible = Column("DISPONIBLE", String(1), nullable=False)