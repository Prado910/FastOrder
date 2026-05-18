from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from src.db import Base


class Factura(Base):
    __tablename__ = "FACTURA"

    id_factura = Column("ID_FACTURA", Integer, primary_key=True, index=True)
    numero_factura = Column("NUMERO_FACTURA", String(20), nullable=False, unique=True)
    id_pedido = Column("ID_PEDIDO", Integer, ForeignKey("PEDIDO.ID_PEDIDO"), nullable=False, unique=True)
    id_usuario_cajero = Column("ID_USUARIO_CAJERO", Integer, ForeignKey("USUARIO.ID_USUARIO"), nullable=False)
    fecha_hora_factura = Column("FECHA_HORA_FACTURA", DateTime, nullable=False)
    propina = Column("PROPINA", Numeric(10, 2), nullable=False)
    total = Column("TOTAL", Numeric(10, 2), nullable=False)

    pedido = relationship("Pedido")
    cajero = relationship("Usuario")