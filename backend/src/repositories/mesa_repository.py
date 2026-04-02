from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models.mesa import Mesa


def listar_mesas_disponibles(db: Session):
    # Retorna únicamente las mesas marcadas como disponibles
    stmt = select(Mesa).where(Mesa.estado == "LIBRE").order_by(Mesa.numero_mesa)
    return db.execute(stmt).scalars().all()


def obtener_mesa_por_id(db: Session, id_mesa: int):
    stmt = select(Mesa).where(Mesa.id_mesa == id_mesa)
    return db.execute(stmt).scalar_one_or_none()