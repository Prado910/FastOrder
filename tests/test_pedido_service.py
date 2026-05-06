import pytest
from unittest.mock import patch, MagicMock
from decimal import Decimal
from fastapi import HTTPException

from backend.src.services.pedido_service import registrar_pedido, consultar_pedido


# =========================================================
# REGISTRAR PEDIDO - CASOS DE ERROR
# =========================================================

def test_registrar_pedido_sin_productos(db_mock, payload_vacio):
    with pytest.raises(HTTPException) as exc:
        registrar_pedido(db_mock, payload_vacio)

    assert exc.value.status_code == 400


def test_registrar_pedido_sin_mesero(db_mock, payload_sin_mesero):
    with pytest.raises(HTTPException) as exc:
        registrar_pedido(db_mock, payload_sin_mesero)

    assert exc.value.status_code == 400


@patch("src.services.pedido_service.obtener_mesero_activo_por_id", return_value=None)
def test_mesero_no_existe(mock_mesero, db_mock, payload_valido):
    with pytest.raises(HTTPException) as exc:
        registrar_pedido(db_mock, payload_valido)

    assert exc.value.status_code == 404


@patch("src.services.pedido_service.obtener_mesero_activo_por_id", return_value=MagicMock())
@patch("src.services.pedido_service.obtener_mesa_por_id", return_value=None)
def test_mesa_no_existe(mock_mesa, mock_mesero, db_mock, payload_valido):
    with pytest.raises(HTTPException) as exc:
        registrar_pedido(db_mock, payload_valido)

    assert exc.value.status_code == 404


@patch("src.services.pedido_service.obtener_mesero_activo_por_id", return_value=MagicMock())
@patch("src.services.pedido_service.obtener_mesa_por_id")
def test_mesa_ocupada(mock_mesa, mock_mesero, db_mock, payload_valido):
    mock_mesa.return_value = MagicMock(estado="OCUPADA")

    with pytest.raises(HTTPException) as exc:
        registrar_pedido(db_mock, payload_valido)

    assert exc.value.status_code == 400


@patch("src.services.pedido_service.obtener_producto_por_id")
@patch("src.services.pedido_service.obtener_mesero_activo_por_id", return_value=MagicMock())
@patch("src.services.pedido_service.obtener_mesa_por_id", return_value=MagicMock(estado="LIBRE"))
def test_producto_no_existe(
    mock_mesa,
    mock_mesero,
    mock_producto,
    db_mock,
    payload_valido
):
    mock_producto.return_value = None

    with pytest.raises(HTTPException) as exc:
        registrar_pedido(db_mock, payload_valido)

    assert exc.value.status_code == 404


@patch("src.services.pedido_service.obtener_producto_por_id")
@patch("src.services.pedido_service.obtener_mesero_activo_por_id", return_value=MagicMock())
@patch("src.services.pedido_service.obtener_mesa_por_id", return_value=MagicMock(estado="LIBRE"))
def test_no_permite_producto_no_disponible(
    mock_mesa,
    mock_mesero,
    mock_producto,
    db_mock,
    payload_valido
):
    producto_mock = MagicMock()
    producto_mock.disponible = "N"
    producto_mock.precio = Decimal("10.00")

    mock_producto.return_value = producto_mock

    with pytest.raises(HTTPException):
        registrar_pedido(db_mock, payload_valido)

    db_mock.commit.assert_not_called()


@patch("src.services.pedido_service.obtener_producto_por_id")
@patch("src.services.pedido_service.obtener_mesero_activo_por_id", return_value=MagicMock())
@patch("src.services.pedido_service.obtener_mesa_por_id", return_value=MagicMock(estado="LIBRE"))
def test_no_permite_cantidad_invalida(
    mock_mesa,
    mock_mesero,
    mock_producto,
    db_mock,
    payload_valido
):
    producto_mock = MagicMock()
    producto_mock.disponible = "S"
    producto_mock.precio = Decimal("10.00")

    mock_producto.return_value = producto_mock

    payload_valido.items[0].cantidad = 0

    with pytest.raises(HTTPException) as exc:
        registrar_pedido(db_mock, payload_valido)

    assert exc.value.status_code == 400
    db_mock.commit.assert_not_called()


# =========================================================
# REGISTRAR PEDIDO - CASOS FELICES
# =========================================================

@patch("src.services.pedido_service.obtener_mesero_activo_por_id")
@patch("src.services.pedido_service.obtener_mesa_por_id")
@patch("src.services.pedido_service.obtener_producto_por_id")
@patch("src.services.pedido_service.calcular_subtotal")
@patch("src.services.pedido_service.calcular_total")
@patch("src.services.pedido_service.crear_pedido")
@patch("src.services.pedido_service.crear_detalle_pedido")
@patch("src.services.pedido_service.actualizar_mesa_a_ocupada")
def test_registrar_pedido(
    mock_actualizar_mesa,
    mock_crear_detalle,
    mock_crear_pedido,
    mock_total,
    mock_subtotal,
    mock_producto,
    mock_mesa,
    mock_mesero,
    db_mock,
    payload_valido
):
    mock_mesero.return_value = MagicMock()
    mock_mesa.return_value = MagicMock(estado="LIBRE")

    producto_mock = MagicMock()
    producto_mock.id_producto = 1
    producto_mock.nombre = "Pizza"
    producto_mock.precio = Decimal("10.00")

    mock_producto.return_value = producto_mock
    mock_subtotal.return_value = Decimal("10.00")
    mock_total.return_value = Decimal("10.00")

    def asignar_id(db, pedido):
        pedido.id_pedido = 1

    mock_crear_pedido.side_effect = asignar_id

    resultado = registrar_pedido(db_mock, payload_valido)

    assert resultado["id_pedido"] == 1
    assert resultado["total"] == Decimal("10.00")
    assert resultado["estado"] == "PENDIENTE"


@patch("src.services.pedido_service.obtener_mesero_activo_por_id", return_value=MagicMock())
@patch("src.services.pedido_service.obtener_mesa_por_id")
@patch("src.services.pedido_service.obtener_producto_por_id")
@patch("src.services.pedido_service.actualizar_mesa_a_ocupada")
def test_mesa_se_actualiza_a_ocupada(
    mock_actualizar_mesa,
    mock_producto,
    mock_mesa,
    mock_mesero,
    db_mock,
    payload_valido
):
    mesa_mock = MagicMock(estado="LIBRE")
    mock_mesa.return_value = mesa_mock

    producto_mock = MagicMock(id_producto=1, nombre="Pizza", precio=Decimal("10.00"))
    mock_producto.return_value = producto_mock

    registrar_pedido(db_mock, payload_valido)

    mock_actualizar_mesa.assert_called_once_with(db_mock, mesa_mock)


@patch("src.services.pedido_service.obtener_mesero_activo_por_id", return_value=MagicMock())
@patch("src.services.pedido_service.obtener_mesa_por_id", return_value=MagicMock(estado="LIBRE"))
@patch("src.services.pedido_service.obtener_producto_por_id")
@patch("src.services.pedido_service.crear_detalle_pedido")
def test_se_crean_detalles(
    mock_crear_detalle,
    mock_producto,
    mock_mesa,
    mock_mesero,
    db_mock,
    payload_valido
):
    producto_mock = MagicMock(id_producto=1, nombre="Pizza", precio=Decimal("10.00"))
    mock_producto.return_value = producto_mock

    registrar_pedido(db_mock, payload_valido)

    assert mock_crear_detalle.call_count == len(payload_valido.items)


@patch("src.services.pedido_service.generar_numero_pedido", return_value="ABC123")
@patch("src.services.pedido_service.obtener_mesero_activo_por_id", return_value=MagicMock())
@patch("src.services.pedido_service.obtener_mesa_por_id", return_value=MagicMock(estado="LIBRE"))
@patch("src.services.pedido_service.obtener_producto_por_id")
def test_numero_pedido_generado(
    mock_producto,
    mock_mesa,
    mock_mesero,
    mock_numero,
    db_mock,
    payload_valido
):
    producto_mock = MagicMock(id_producto=1, nombre="Pizza", precio=Decimal("10.00"))
    mock_producto.return_value = producto_mock

    resultado = registrar_pedido(db_mock, payload_valido)

    assert resultado["numero_pedido"] == "ABC123"


# =========================================================
# CONSULTAR PEDIDO
# =========================================================

def test_consultar_pedido_no_existe(db_mock):
    with patch("src.services.pedido_service.obtener_pedido_por_id", return_value=None):
        with pytest.raises(HTTPException) as exc:
            consultar_pedido(db_mock, 999)

    assert exc.value.status_code == 404


def test_consultar_pedido_detalle_completo(db_mock):
    producto_mock = MagicMock(nombre="Pizza")

    detalle_mock = MagicMock()
    detalle_mock.id_producto = 1
    detalle_mock.cantidad = 2
    detalle_mock.precio_unitario = Decimal("10.00")
    detalle_mock.subtotal = Decimal("20.00")
    detalle_mock.observacion_item = "Sin queso"
    detalle_mock.producto = producto_mock

    pedido_mock = MagicMock()
    pedido_mock.id_pedido = 1
    pedido_mock.numero_pedido = "P001"
    pedido_mock.id_mesa = 1
    pedido_mock.estado = "PENDIENTE"
    pedido_mock.total = Decimal("20.00")
    pedido_mock.detalles = [detalle_mock]

    with patch("src.services.pedido_service.obtener_pedido_por_id", return_value=pedido_mock):
        response = consultar_pedido(db_mock, 1)

    assert response["id_pedido"] == 1
    assert len(response["items"]) == 1
    assert response["items"][0]["nombre_producto"] == "Pizza"


def test_consultar_pedido_sin_observaciones(db_mock):
    producto_mock = MagicMock(nombre="Hamburguesa")

    detalle_mock = MagicMock()
    detalle_mock.observacion_item = None
    detalle_mock.producto = producto_mock

    pedido_mock = MagicMock(detalles=[detalle_mock])

    with patch("src.services.pedido_service.obtener_pedido_por_id", return_value=pedido_mock):
        response = consultar_pedido(db_mock, 1)

    assert response["items"][0]["observacion_item"] is None


def test_consultar_pedido_multiples_observaciones(db_mock):
    detalle1 = MagicMock(observacion_item="Sin queso", producto=MagicMock(nombre="Pizza"))
    detalle2 = MagicMock(observacion_item="Extra salsa", producto=MagicMock(nombre="Pasta"))

    pedido_mock = MagicMock(detalles=[detalle1, detalle2])

    with patch("src.services.pedido_service.obtener_pedido_por_id", return_value=pedido_mock):
        response = consultar_pedido(db_mock, 1)

    assert len(response["items"]) == 2