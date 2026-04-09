import pytest
from unittest.mock import MagicMock


@pytest.fixture
def db_mock():
    db = MagicMock()
    db.commit = MagicMock()
    db.refresh = MagicMock()
    db.flush = MagicMock()
    return db


# 👇 Helper para crear items más controlados
def crear_item(id_producto=1, cantidad=1, observacion=""):
    item = MagicMock()
    item.id_producto = id_producto
    item.cantidad = cantidad
    item.observacion_item = observacion
    return item


@pytest.fixture
def payload_valido():
    payload = MagicMock()
    payload.items = [crear_item(cantidad=1)]
    payload.id_usuario_mesero = 1
    payload.id_mesa = 1
    return payload


@pytest.fixture
def payload_vacio():
    payload = MagicMock()
    payload.items = []
    payload.id_usuario_mesero = 1
    payload.id_mesa = 1
    return payload


@pytest.fixture
def payload_sin_mesero():
    payload = MagicMock()
    payload.items = [crear_item()]
    payload.id_usuario_mesero = None
    payload.id_mesa = 1
    return payload


# 👇 NUEVO: payload con cantidad inválida
@pytest.fixture
def payload_cantidad_cero():
    payload = MagicMock()
    payload.items = [crear_item(cantidad=0)]
    payload.id_usuario_mesero = 1
    payload.id_mesa = 1
    return payload


# 👇 NUEVO: payload con cantidad negativa
@pytest.fixture
def payload_cantidad_negativa():
    payload = MagicMock()
    payload.items = [crear_item(cantidad=-1)]
    payload.id_usuario_mesero = 1
    payload.id_mesa = 1
    return payload