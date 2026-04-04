from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models.producto import Producto


def listar_productos_para_menu(db: Session):
    # Retorna todos los productos visibles en el menú,
    # tanto disponibles como no disponibles
    stmt = select(Producto).order_by(Producto.nombre)
    return db.execute(stmt).scalars().all()


def obtener_producto_por_id(db: Session, id_producto: int):
    stmt = select(Producto).where(
        Producto.id_producto == id_producto,
        Producto.disponible == "S"
    )
    return db.execute(stmt).scalar_one_or_none()