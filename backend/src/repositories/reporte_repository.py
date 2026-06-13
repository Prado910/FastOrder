from datetime import date, datetime, time

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.models.detalle_pedido import DetallePedido
from src.models.pedido import Pedido
from src.models.producto import Producto


def _crear_filtros_reporte(
    fecha_desde: date,
    fecha_hasta: date,
    estado: str | None = None,
):
    inicio_dia = datetime.combine(fecha_desde, time.min)
    fin_dia = datetime.combine(fecha_hasta, time.max)

    filtros = [
        Pedido.fecha_hora_creacion >= inicio_dia,
        Pedido.fecha_hora_creacion <= fin_dia,
    ]

    if estado:
        filtros.append(Pedido.estado == estado)

    return filtros


def obtener_resumen_reporte_pedidos(
    db: Session,
    fecha_desde: date,
    fecha_hasta: date,
    estado: str | None = None,
):
    filtros = _crear_filtros_reporte(fecha_desde, fecha_hasta, estado)

    stmt = select(
        func.count(Pedido.id_pedido).label("total_pedidos"),
        func.coalesce(func.sum(Pedido.total), 0).label("total_ventas"),
        func.coalesce(func.avg(Pedido.total), 0).label("promedio_por_pedido"),
    ).where(*filtros)

    return db.execute(stmt).one()


def obtener_total_productos_reporte(
    db: Session,
    fecha_desde: date,
    fecha_hasta: date,
    estado: str | None = None,
):
    filtros = _crear_filtros_reporte(fecha_desde, fecha_hasta, estado)

    stmt = (
        select(func.coalesce(func.sum(DetallePedido.cantidad), 0))
        .join(Pedido, DetallePedido.id_pedido == Pedido.id_pedido)
        .where(*filtros)
    )

    return db.execute(stmt).scalar_one()


def listar_ventas_por_estado_reporte(
    db: Session,
    fecha_desde: date,
    fecha_hasta: date,
    estado: str | None = None,
):
    filtros = _crear_filtros_reporte(fecha_desde, fecha_hasta, estado)

    stmt = (
        select(
            Pedido.estado.label("estado"),
            func.count(Pedido.id_pedido).label("cantidad_pedidos"),
            func.coalesce(func.sum(Pedido.total), 0).label("total_ventas"),
        )
        .where(*filtros)
        .group_by(Pedido.estado)
        .order_by(Pedido.estado)
    )

    return db.execute(stmt).all()


def listar_productos_reporte_pedidos(
    db: Session,
    fecha_desde: date,
    fecha_hasta: date,
    estado: str | None = None,
):
    filtros = _crear_filtros_reporte(fecha_desde, fecha_hasta, estado)

    stmt = (
        select(
            DetallePedido.id_producto.label("id_producto"),
            Producto.nombre.label("nombre_producto"),
            func.coalesce(func.sum(DetallePedido.cantidad), 0).label("cantidad_vendida"),
            func.coalesce(func.sum(DetallePedido.subtotal), 0).label("total_ventas"),
        )
        .join(Pedido, DetallePedido.id_pedido == Pedido.id_pedido)
        .join(Producto, DetallePedido.id_producto == Producto.id_producto)
        .where(*filtros)
        .group_by(DetallePedido.id_producto, Producto.nombre)
        .order_by(func.sum(DetallePedido.cantidad).desc())
    )

    return db.execute(stmt).all()