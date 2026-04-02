from sqlalchemy import Column, Integer, String

from src.db import Base


class Mesa(Base):
    __tablename__ = "MESA"

    id_mesa = Column("ID_MESA", Integer, primary_key=True, index=True)
    numero_mesa = Column("NUMERO_MESA", Integer, nullable=False, unique=True)
    capacidad = Column("CAPACIDAD", Integer, nullable=False)
    estado = Column("ESTADO", String(20), nullable=False)