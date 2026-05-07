from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from src.db import Base


class CategoriaProducto(Base):
    __tablename__ = "CATEGORIA_PRODUCTO"

    id_categoria = Column("ID_CATEGORIA", Integer, primary_key=True, index=True)
    nombre = Column("NOMBRE", String(20), nullable=False, unique=True)

    # Una categoría puede tener varios productos asociados
    productos = relationship("Producto", back_populates="categoria")