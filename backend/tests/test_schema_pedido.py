import pytest
from pydantic import ValidationError

from src.schemas.pedido import PedidoItemCreate, PedidoEstadoUpdate


def test_pedido_item_valido_con_observacion():
    item = PedidoItemCreate(
        id_producto=1,
        cantidad=2,
        observacion_item="Sin cebolla"
    )

    assert item.id_producto == 1
    assert item.cantidad == 2
    assert item.observacion_item == "Sin cebolla"


def test_pedido_item_observacion_vacia_se_convierte_en_none():
    item = PedidoItemCreate(
        id_producto=1,
        cantidad=1,
        observacion_item="   "
    )

    assert item.observacion_item is None


def test_pedido_item_cantidad_cero_no_es_valida():
    with pytest.raises(ValidationError):
        PedidoItemCreate(
            id_producto=1,
            cantidad=0,
            observacion_item=None
        )


def test_pedido_item_observacion_con_caracteres_invalidos():
    with pytest.raises(ValidationError):
        PedidoItemCreate(
            id_producto=1,
            cantidad=1,
            observacion_item="Sin cebolla @@@"
        )


def test_pedido_item_observacion_mayor_a_250_caracteres():
    observacion_larga = "a" * 251

    with pytest.raises(ValidationError):
        PedidoItemCreate(
            id_producto=1,
            cantidad=1,
            observacion_item=observacion_larga
        )


def test_estado_update_acepta_en_preparacion():
    payload = PedidoEstadoUpdate(estado="EN_PREPARACION")

    assert payload.estado == "EN_PREPARACION"


def test_estado_update_acepta_listo():
    payload = PedidoEstadoUpdate(estado="LISTO")

    assert payload.estado == "LISTO"


def test_estado_update_rechaza_estado_no_permitido():
    with pytest.raises(ValidationError):
        PedidoEstadoUpdate(estado="CANCELADO")