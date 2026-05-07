import pytest
from unittest.mock import MagicMock

from backend.src.repositories.mesa_repository import (
    listar_mesas_disponibles,
    obtener_mesa_por_id
)

from backend.src.repositories.usuario_repository import (
    obtener_mesero_activo_por_id
)

from backend.src.repositories.pedido_repository import (
    crear_pedido,
    crear_detalle_pedido,
    actualizar_mesa_a_ocupada,
    obtener_pedido_por_id
)

# MESA REPOSITORY

def test_listar_mesas_disponibles(db_mock):
    resultado_mock = MagicMock()
    resultado_mock.scalars.return_value.all.return_value = ["mesa1", "mesa2"]

    db_mock.execute.return_value = resultado_mock

    resultado = listar_mesas_disponibles(db_mock)

    assert resultado == ["mesa1", "mesa2"]
    db_mock.execute.assert_called_once()


def test_obtener_mesa_por_id(db_mock):
    resultado_mock = MagicMock()
    resultado_mock.scalar_one_or_none.return_value = "mesa1"

    db_mock.execute.return_value = resultado_mock

    resultado = obtener_mesa_por_id(db_mock, 1)

    assert resultado == "mesa1"
    db_mock.execute.assert_called_once()

# USUARIO REPOSITORY

def test_obtener_mesero_activo_por_id(db_mock):
    resultado_mock = MagicMock()
    resultado_mock.scalar_one_or_none.return_value = "mesero"

    db_mock.execute.return_value = resultado_mock

    resultado = obtener_mesero_activo_por_id(db_mock, 1)

    assert resultado == "mesero"
    db_mock.execute.assert_called_once()

# PEDIDO REPOSITORY

def test_crear_pedido(db_mock):
    pedido_mock = MagicMock()

    resultado = crear_pedido(db_mock, pedido_mock)

    db_mock.add.assert_called_once_with(pedido_mock)
    db_mock.flush.assert_called_once()
    assert resultado == pedido_mock


def test_crear_detalle_pedido(db_mock):
    detalle_mock = MagicMock()

    resultado = crear_detalle_pedido(db_mock, detalle_mock)

    db_mock.add.assert_called_once_with(detalle_mock)
    db_mock.flush.assert_called_once()
    assert resultado == detalle_mock


def test_actualizar_mesa_a_ocupada(db_mock):
    mesa_mock = MagicMock(estado="LIBRE")

    actualizar_mesa_a_ocupada(db_mock, mesa_mock)

    assert mesa_mock.estado == "OCUPADA"
    db_mock.flush.assert_called_once()


def test_obtener_pedido_por_id(db_mock):
    resultado_mock = MagicMock()
    resultado_mock.unique.return_value.scalar_one_or_none.return_value = "pedido"

    db_mock.execute.return_value = resultado_mock

    resultado = obtener_pedido_por_id(db_mock, 1)

    assert resultado == "pedido"
    db_mock.execute.assert_called_once()