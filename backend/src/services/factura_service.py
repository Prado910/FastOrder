from datetime import datetime
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.models.factura import Factura
from src.repositories.factura_repository import (
    crear_factura,
    listar_facturas,
    obtener_factura_por_pedido,
    obtener_siguiente_numero_factura,
)
from src.repositories.mesa_repository import obtener_mesa_por_id
from src.repositories.pedido_repository import (
    actualizar_estado_pedido,
    actualizar_mesa_a_libre,
    obtener_pedido_por_id,
)
from src.repositories.usuario_repository import obtener_cajero_activo_por_id
from src.schemas.factura import FacturaCreate


def registrar_factura(db: Session, payload: FacturaCreate):
    propina = Decimal(payload.propina or Decimal("0.00")).quantize(Decimal("0.01"))

    if propina < 0:
        raise HTTPException(
            status_code=400,
            detail="Valor invalido para agregar a la propina"
        )

    pedido = obtener_pedido_por_id(db, payload.id_pedido)

    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado.")

    if pedido.estado != "LISTO":
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden facturar pedidos en estado Listo."
        )

    factura_existente = obtener_factura_por_pedido(db, pedido.id_pedido)

    if factura_existente:
        raise HTTPException(
            status_code=400,
            detail="El pedido ya tiene una factura registrada."
        )

    cajero = obtener_cajero_activo_por_id(db, payload.id_usuario_cajero)

    if not cajero:
        raise HTTPException(
            status_code=404,
            detail="El cajero no existe, no está activo o no tiene el rol correcto."
        )

    subtotal = Decimal(pedido.total).quantize(Decimal("0.01"))
    total = (subtotal + propina).quantize(Decimal("0.01"))

    factura = Factura(
        numero_factura=obtener_siguiente_numero_factura(db),
        id_pedido=pedido.id_pedido,
        id_usuario_cajero=payload.id_usuario_cajero,
        fecha_hora_factura=datetime.now(),
        propina=propina,
        total=total,
    )

    crear_factura(db, factura)

    actualizar_estado_pedido(db, pedido, "FACTURADO")

    mesa = obtener_mesa_por_id(db, pedido.id_mesa)

    if mesa:
        actualizar_mesa_a_libre(db, mesa)

    db.commit()
    db.refresh(factura)

    pedido_actualizado = obtener_pedido_por_id(db, pedido.id_pedido)

    return construir_respuesta_factura(
        factura=factura,
        pedido=pedido_actualizado,
        cajero=cajero,
    )


def listar_facturas_generadas(db: Session):
    facturas = listar_facturas(db)
    return [
        construir_respuesta_factura(
            factura=factura,
            pedido=factura.pedido,
            cajero=factura.cajero,
        )
        for factura in facturas
    ]


def construir_respuesta_factura(factura: Factura, pedido, cajero):
    items = []

    for detalle in pedido.detalles:
        items.append({
            "id_producto": detalle.id_producto,
            "nombre_producto": detalle.producto.nombre,
            "cantidad": detalle.cantidad,
            "precio_unitario": detalle.precio_unitario,
            "subtotal": detalle.subtotal,
            "observacion_item": detalle.observacion_item,
        })

    mesero = None
    if pedido.mesero:
        mesero = f"{pedido.mesero.nombre} {pedido.mesero.apellido}"

    cajero_nombre = None
    if cajero:
        cajero_nombre = f"{cajero.nombre} {cajero.apellido}"

    numero_mesa = None
    if pedido.mesa:
        numero_mesa = pedido.mesa.numero_mesa

    subtotal = Decimal(factura.total) - Decimal(factura.propina or 0)

    return {
        "id_factura": factura.id_factura,
        "numero_factura": factura.numero_factura,
        "id_pedido": pedido.id_pedido,
        "numero_pedido": pedido.numero_pedido,
        "numero_mesa": numero_mesa,
        "mesero": mesero,
        "cajero": cajero_nombre,
        "fecha_hora_factura": factura.fecha_hora_factura,
        "subtotal": subtotal,
        "propina": factura.propina,
        "total": factura.total,
        "items": items,
    }