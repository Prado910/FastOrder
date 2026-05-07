from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, or_

from src.models.pedido import Pedido
from src.models.detalle_pedido import DetallePedido
from src.models.mesa import Mesa


def opciones_pedido():
    return (
        joinedload(Pedido.detalles).joinedload(DetallePedido.producto),
        joinedload(Pedido.mesa),
        joinedload(Pedido.mesero),
    )


def crear_pedido(db: Session, pedido: Pedido):
    db.add(pedido)
    db.flush()
    return pedido


def crear_detalle_pedido(db: Session, detalle: DetallePedido):
    db.add(detalle)
    db.flush()
    return detalle


def actualizar_mesa_a_ocupada(db: Session, mesa: Mesa):
    mesa.estado = "OCUPADA"
    db.flush()


def actualizar_mesa_a_libre(db: Session, mesa: Mesa):
    mesa.estado = "LIBRE"
    db.flush()


def marcar_pedido_cancelado(db: Session, pedido: Pedido):
    pedido.estado = "CANCELADO"
    db.flush()
    return pedido


def actualizar_estado_pedido(db: Session, pedido: Pedido, nuevo_estado: str):
    pedido.estado = nuevo_estado
    db.flush()
    return pedido


def obtener_pedido_por_id(db: Session, id_pedido: int):
    stmt = (
        select(Pedido)
        .options(*opciones_pedido())
        .where(Pedido.id_pedido == id_pedido)
    )

    return db.execute(stmt).unique().scalar_one_or_none()


def listar_pedidos(db: Session, criterio: str | None = None):
    stmt = (
        select(Pedido)
        .options(*opciones_pedido())
        .order_by(Pedido.fecha_hora_creacion.desc())
    )

    texto = (criterio or "").strip()

    if texto:
        texto_mesa = texto.lower().replace("mesa", "").strip()

        condiciones = [
            Pedido.numero_pedido.ilike(f"%{texto}%")
        ]

        if texto.isdigit() or texto_mesa.isdigit():
            numero = int(texto_mesa if texto_mesa.isdigit() else texto)
            condiciones.extend([
                Pedido.id_pedido == numero,
                Pedido.id_mesa == numero,
            ])

        stmt = stmt.where(or_(*condiciones))

    return db.execute(stmt).unique().scalars().all()


def listar_pedidos_cocina(db: Session):
    stmt = (
        select(Pedido)
        .options(*opciones_pedido())
        .where(Pedido.estado.in_(["PENDIENTE", "EN_PREPARACION", "LISTO"]))
        .order_by(Pedido.fecha_hora_creacion.asc())
    )

    return db.execute(stmt).unique().scalars().all()