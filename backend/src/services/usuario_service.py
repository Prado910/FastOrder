from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.repositories.usuario_repository import autenticar_usuario
from src.schemas.usuario import LoginRequest


ROLES_HABILITADOS = {"MESERO", "COCINA", "CAJA", "ADMINISTRADOR"}


def iniciar_sesion(db: Session, payload: LoginRequest):
    usuario = autenticar_usuario(db, payload.username, payload.clave)

    if not usuario:
        raise HTTPException(
            status_code=401,
            detail="Usuario o contraseña incorrectos."
        )

    rol = usuario.rol.nombre.upper()

    if rol not in ROLES_HABILITADOS:
        raise HTTPException(
            status_code=403,
            detail="Este rol aún no tiene acceso habilitado."
        )

    return {
        "id_usuario": usuario.id_usuario,
        "username": usuario.username,
        "nombre": usuario.nombre,
        "apellido": usuario.apellido,
        "rol": rol,
    }