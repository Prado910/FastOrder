from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from src.db import Base


class DetallePedido(Base):
    __tablename__ = "DETALLE_PEDIDO"

    id_detalle_pedido = Column("ID_DETALLE_PEDIDO", Integer, primary_key=True, index=True)
    id_pedido = Column("ID_PEDIDO", Integer, ForeignKey("PEDIDO.ID_PEDIDO"), nullable=False)
    id_producto = Column("ID_PRODUCTO", Integer, ForeignKey("PRODUCTO.ID_PRODUCTO"), nullable=False)
    cantidad = Column("CANTIDAD", Integer, nullable=False)
    precio_unitario = Column("PRECIO_UNITARIO", Numeric(10, 2), nullable=False)
    subtotal = Column("SUBTOTAL", Numeric(10, 2), nullable=False)
    observacion_item = Column("OBSERVACION_ITEM", String(250))

    # Relación con el pedido al que pertenece el detalle
    pedido = relationship("Pedido", back_populates="detalles")
    # Relación con el producto asociado al detalle
    producto = relationship("Producto")