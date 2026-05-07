from datetime import datetime
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.models.pedido import Pedido
from src.models.detalle_pedido import DetallePedido
from src.repositories.mesa_repository import obtener_mesa_por_id
from src.repositories.producto_repository import obtener_producto_por_id
from src.repositories.usuario_repository import obtener_mesero_activo_por_id
from src.repositories.pedido_repository import (
    crear_pedido,
    crear_detalle_pedido,
    actualizar_mesa_a_ocupada,
    actualizar_mesa_a_libre,
    obtener_pedido_por_id,
    listar_pedidos,
    marcar_pedido_cancelado,
)
from src.utils.pedido_utils import generar_numero_pedido, calcular_subtotal, calcular_total
from src.schemas.pedido import PedidoCreate


def registrar_pedido(db: Session, payload: PedidoCreate):
    # Un pedido debe tener al menos un producto
    if not payload.items:
        raise HTTPException(status_code=400, detail="El pedido debe tener al menos un producto.")

    # Un pedido debe tener un mesero asignado
    if not payload.id_usuario_mesero:
        raise HTTPException(status_code=400, detail="El pedido debe tener un mesero asignado.")
    
    # El usuario asignado debe existir, estar activo y tener rol de mesero
    mesero = obtener_mesero_activo_por_id(db, payload.id_usuario_mesero)
    if not mesero:
        raise HTTPException(
            status_code=404,
            detail="El mesero no existe, no está activo o no tiene el rol correcto."
        )

    # Se valida que la mesa exista y esté libre antes de crear el pedido
    mesa = obtener_mesa_por_id(db, payload.id_mesa)
    if not mesa:
        raise HTTPException(status_code=404, detail="La mesa no existe.")
    if mesa.estado != "LIBRE":
        raise HTTPException(status_code=400, detail="La mesa no está libre.")

    numero_pedido = generar_numero_pedido()

    # Primero se crea la cabecera del pedido para obtener su id
    # y poder asociar luego cada uno de sus detalles
    pedido = Pedido(
        numero_pedido=numero_pedido,
        id_mesa=payload.id_mesa,
        id_usuario_mesero=payload.id_usuario_mesero,
        fecha_hora_creacion=datetime.now(),
        estado="PENDIENTE",
        total=Decimal("0.00"),
    )
    crear_pedido(db, pedido)

    # Se acumulan los subtotales para calcular el total final
    # y se construye la respuesta con los ítems procesados
    subtotales = []
    items_response = []

    for item in payload.items:
        # Cada producto debe existir y estar disponible
        producto = obtener_producto_por_id(db, item.id_producto)
        if not producto:
            raise HTTPException(
                status_code=404,
                detail=f"Producto no encontrado o no disponible: {item.id_producto}"
            )

        # El subtotal del ítem se calcula con el precio actual del producto
        # y la cantidad solicitada
        subtotal = calcular_subtotal(producto.precio, item.cantidad)
        subtotales.append(subtotal)

        # Se registra cada línea del pedido con su precio histórico
        detalle = DetallePedido(
            id_pedido=pedido.id_pedido,
            id_producto=producto.id_producto,
            cantidad=item.cantidad,
            precio_unitario=producto.precio,
            subtotal=subtotal,
            observacion_item=item.observacion_item,
        )
        crear_detalle_pedido(db, detalle)

        # Se arma la información que se devolverá al cliente
        items_response.append({
            "id_producto": producto.id_producto,
            "nombre_producto": producto.nombre,
            "cantidad": item.cantidad,
            "precio_unitario": producto.precio,
            "subtotal": subtotal,
            "observacion_item": item.observacion_item,
        })

    # Una vez procesados los ítems, se calcula el total del pedido
    pedido.total = calcular_total(subtotales)
    # Al registrar un pedido, la mesa pasa a estado ocupada
    actualizar_mesa_a_ocupada(db, mesa)
    # Se confirma toda la operación en una sola transacción
    db.commit()
    # Se refresca el objeto para asegurar que la instancia tenga
    # los valores definitivos almacenados en la base de datos
    db.refresh(pedido)

    return {
    "id_pedido": pedido.id_pedido,
    "numero_pedido": pedido.numero_pedido,
    "id_mesa": pedido.id_mesa,
    "estado": pedido.estado,
    "total": pedido.total,
    "fecha_hora_creacion": pedido.fecha_hora_creacion,
    "items": items_response,
}


def consultar_pedido(db: Session, id_pedido: int):
    pedido = obtener_pedido_por_id(db, id_pedido)

    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado.")

    return construir_respuesta_pedido(pedido)


def listar_todos_los_pedidos(db: Session, criterio: str | None = None):
    pedidos = listar_pedidos(db, criterio)
    return [construir_respuesta_pedido(pedido) for pedido in pedidos]


def eliminar_pedido(db: Session, id_pedido: int):
    if not id_pedido:
        raise HTTPException(
            status_code=400,
            detail="Debe seleccionar un pedido válido para eliminar"
        )

    pedido = obtener_pedido_por_id(db, id_pedido)

    if not pedido:
        raise HTTPException(
            status_code=404,
            detail="Debe seleccionar un pedido válido para eliminar"
        )

    if pedido.estado != "PENDIENTE":
        mensaje = "Solo se pueden eliminar pedidos pendientes."

        if pedido.estado == "EN_PREPARACION":
            mensaje = "No se puede eliminar un pedido en preparación"

        raise HTTPException(status_code=400, detail=mensaje)

    mesa = obtener_mesa_por_id(db, pedido.id_mesa)

    marcar_pedido_cancelado(db, pedido)

    if mesa:
        actualizar_mesa_a_libre(db, mesa)

    db.commit()
    db.refresh(pedido)

    return construir_respuesta_pedido(pedido)


def construir_respuesta_pedido(pedido: Pedido):
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

    return {
        "id_pedido": pedido.id_pedido,
        "numero_pedido": pedido.numero_pedido,
        "id_mesa": pedido.id_mesa,
        "estado": pedido.estado,
        "total": pedido.total,
        "fecha_hora_creacion": pedido.fecha_hora_creacion,
        "items": items,
    }
