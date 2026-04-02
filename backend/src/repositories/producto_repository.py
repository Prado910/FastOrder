from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models.producto import Producto


def listar_productos_disponibles(db: Session):
    # Retorna solo los productos marcados como disponibles
    stmt = select(Producto).where(Producto.disponible == "S").order_by(Producto.nombre)
    return db.execute(stmt).scalars().all()


def obtener_producto_por_id(db: Session, id_producto: int):
    stmt = select(Producto).where(
        Producto.id_producto == id_producto,
        Producto.disponible == "S"
    )
    return db.execute(stmt).scalar_one_or_none()