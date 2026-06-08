from datetime import date
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.repositories.reporte_repository import (
    listar_productos_reporte_pedidos,
    listar_ventas_por_estado_reporte,
    obtener_resumen_reporte_pedidos,
    obtener_total_productos_reporte,
)


ESTADOS_VALIDOS = {
    "TODOS",
    "PENDIENTE",
    "EN_PREPARACION",
    "LISTO",
    "ENTREGADO",
    "FACTURADO",
    "CANCELADO",
}


def _decimal(valor) -> Decimal:
    return Decimal(valor or 0).quantize(Decimal("0.01"))


def generar_reporte_pedidos(
    db: Session,
    fecha_desde: date | None,
    fecha_hasta: date | None,
    estado: str | None = "TODOS",
):
    if not fecha_desde or not fecha_hasta:
        raise HTTPException(
            status_code=400,
            detail="Debe diligenciar los parámetros obligatorios"
        )

    if fecha_desde > fecha_hasta:
        raise HTTPException(
            status_code=400,
            detail="El rango de fechas no es válido"
        )

    estado_normalizado = (estado or "TODOS").upper()

    if estado_normalizado not in ESTADOS_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail="El estado seleccionado no es válido"
        )

    estado_filtro = None if estado_normalizado == "TODOS" else estado_normalizado

    resumen = obtener_resumen_reporte_pedidos(
        db=db,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        estado=estado_filtro,
    )

    total_pedidos = int(resumen.total_pedidos or 0)

    if total_pedidos == 0:
        return {
            "fecha_desde": fecha_desde,
            "fecha_hasta": fecha_hasta,
            "estado": estado_normalizado,
            "mensaje": "No existen datos para el período seleccionado",
            "total_pedidos": 0,
            "total_productos": 0,
            "total_ventas": Decimal("0.00"),
            "promedio_por_pedido": Decimal("0.00"),
            "ventas_por_estado": [],
            "productos": [],
        }

    total_productos = obtener_total_productos_reporte(
        db=db,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        estado=estado_filtro,
    )

    ventas_por_estado = listar_ventas_por_estado_reporte(
        db=db,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        estado=estado_filtro,
    )

    productos = listar_productos_reporte_pedidos(
        db=db,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        estado=estado_filtro,
    )

    return {
        "fecha_desde": fecha_desde,
        "fecha_hasta": fecha_hasta,
        "estado": estado_normalizado,
        "mensaje": None,
        "total_pedidos": total_pedidos,
        "total_productos": int(total_productos or 0),
        "total_ventas": _decimal(resumen.total_ventas),
        "promedio_por_pedido": _decimal(resumen.promedio_por_pedido),
        "ventas_por_estado": [
            {
                "estado": fila.estado,
                "cantidad_pedidos": int(fila.cantidad_pedidos or 0),
                "total_ventas": _decimal(fila.total_ventas),
            }
            for fila in ventas_por_estado
        ],
        "productos": [
            {
                "id_producto": int(fila.id_producto),
                "nombre_producto": fila.nombre_producto,
                "cantidad_vendida": int(fila.cantidad_vendida or 0),
                "total_ventas": _decimal(fila.total_ventas),
            }
            for fila in productos
        ],
    }