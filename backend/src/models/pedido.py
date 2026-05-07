from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from src.db import Base


class Pedido(Base):
    __tablename__ = "PEDIDO"

    id_pedido = Column("ID_PEDIDO", Integer, primary_key=True, index=True)
    numero_pedido = Column("NUMERO_PEDIDO", String(20), nullable=False, unique=True)
    id_mesa = Column("ID_MESA", Integer, ForeignKey("MESA.ID_MESA"), nullable=False)
    id_usuario_mesero = Column("ID_USUARIO_MESERO", Integer, ForeignKey("USUARIO.ID_USUARIO"), nullable=False)
    fecha_hora_creacion = Column("FECHA_HORA_CREACION", DateTime, nullable=False)
    estado = Column("ESTADO", String(20), nullable=False)
    total = Column("TOTAL", Numeric(10, 2), nullable=False)

    detalles = relationship(
        "DetallePedido",
        back_populates="pedido",
        cascade="all, delete-orphan"
    )

    mesero = relationship("Usuario")
    mesa = relationship("Mesa")