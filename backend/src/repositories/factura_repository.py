from sqlalchemy import select, func
from sqlalchemy.orm import Session, joinedload

from src.models.factura import Factura
from src.models.pedido import Pedido
from src.models.detalle_pedido import DetallePedido


def opciones_factura():
    return (
        joinedload(Factura.pedido)
            .joinedload(Pedido.detalles)
            .joinedload(DetallePedido.producto),
        joinedload(Factura.pedido).joinedload(Pedido.mesa),
        joinedload(Factura.pedido).joinedload(Pedido.mesero),
        joinedload(Factura.cajero),
    )


def obtener_siguiente_numero_factura(db: Session):
    stmt = select(func.coalesce(func.max(Factura.id_factura), 0))
    ultimo_id = db.execute(stmt).scalar_one()
    return f"F-{int(ultimo_id) + 1:06d}"


def obtener_factura_por_pedido(db: Session, id_pedido: int):
    stmt = (
        select(Factura)
        .options(*opciones_factura())
        .where(Factura.id_pedido == id_pedido)
    )

    return db.execute(stmt).unique().scalar_one_or_none()


def crear_factura(db: Session, factura: Factura):
    db.add(factura)
    db.flush()
    return factura


def listar_facturas(db: Session):
    stmt = (
        select(Factura)
        .options(*opciones_factura())
        .order_by(Factura.fecha_hora_factura.desc())
    )

    return db.execute(stmt).unique().scalars().all()