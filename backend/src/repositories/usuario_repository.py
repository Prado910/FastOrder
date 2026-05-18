from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from src.models.usuario import Usuario
from src.models.rol import Rol


def obtener_mesero_activo_por_id(db: Session, id_usuario: int):
    stmt = (
        select(Usuario)
        .join(Rol, Usuario.id_rol == Rol.id_rol)
        .where(
            Usuario.id_usuario == id_usuario,
            Usuario.estado == "A",
            Rol.nombre == "MESERO",
        )
    )
    return db.execute(stmt).scalar_one_or_none()


def autenticar_usuario(db: Session, username: str, clave: str):
    stmt = (
        select(Usuario)
        .options(joinedload(Usuario.rol))
        .where(
            Usuario.username == username.strip(),
            Usuario.clave == clave,
            Usuario.estado == "A",
        )
    )

    return db.execute(stmt).scalar_one_or_none()

def obtener_cajero_activo_por_id(db: Session, id_usuario: int):
    stmt = (
        select(Usuario)
        .join(Rol, Usuario.id_rol == Rol.id_rol)
        .where(
            Usuario.id_usuario == id_usuario,
            Usuario.estado == "A",
            Rol.nombre == "CAJA",
        )
    )

    return db.execute(stmt).scalar_one_or_none()