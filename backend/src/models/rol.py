from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from src.db import Base


class Rol(Base):
    __tablename__ = "ROL"

    id_rol = Column("ID_ROL", Integer, primary_key=True, index=True)
    nombre = Column("NOMBRE", String(20), nullable=False, unique=True)

    # Un rol puede estar asociado a varios usuarios
    usuarios = relationship("Usuario", back_populates="rol")