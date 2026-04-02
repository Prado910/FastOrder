from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship

from src.db import Base


class Usuario(Base):
    __tablename__ = "USUARIO"

    id_usuario = Column("ID_USUARIO", Integer, primary_key=True, index=True)
    id_rol = Column("ID_ROL", Integer, ForeignKey("ROL.ID_ROL"), nullable=False)
    nombre = Column("NOMBRE", String(20), nullable=False)
    apellido = Column("APELLIDO", String(20), nullable=False)
    username = Column("USERNAME", String(20), nullable=False, unique=True)
    correo = Column("CORREO", String(30), nullable=False, unique=True)
    clave = Column("CLAVE", String(30), nullable=False)
    estado = Column("ESTADO", String(1), nullable=False)
    fecha_creacion = Column("FECHA_CREACION", Date, nullable=False)

    # Relación con el rol al que pertenece el usuario
    rol = relationship("Rol", back_populates="usuarios")