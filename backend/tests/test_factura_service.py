from decimal import Decimal
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from src.services import factura_service


class FakeDB:
    def __init__(self):
        self.committed = False
        self.refreshed = False

    def commit(self):
        self.committed = True

    def refresh(self, obj):
        self.refreshed = True


def crear_detalle_fake():
    return SimpleNamespace(
        id_producto=1,
        cantidad=2,
        precio_unitario=Decimal("15000.00"),
        subtotal=Decimal("30000.00"),
        observacion_item=None,
        producto=SimpleNamespace(nombre="Hamburguesa")
    )


def crear_pedido_fake(estado="LISTO"):
    return SimpleNamespace(
        id_pedido=1,
        numero_pedido="P-TEST",
        id_mesa=1,
        estado=estado,
        total=Decimal("30000.00"),
        detalles=[crear_detalle_fake()],
        mesa=SimpleNamespace(numero_mesa=1),
        mesero=SimpleNamespace(nombre="Carlos", apellido="Mendez"),
    )


def crear_cajero_fake():
    return SimpleNamespace(
        id_usuario=3,
        nombre="Ana",
        apellido="Lopez"
    )


def test_registrar_factura_correctamente(monkeypatch):
    db = FakeDB()

    pedido = crear_pedido_fake("LISTO")
    cajero = crear_cajero_fake()
    mesa = SimpleNamespace(id_mesa=1, estado="OCUPADA")

    payload = SimpleNamespace(
        id_pedido=1,
        id_usuario_cajero=3,
        propina=Decimal("5000.00")
    )

    monkeypatch.setattr(
        factura_service,
        "obtener_pedido_por_id",
        lambda db, id_pedido: pedido
    )

    monkeypatch.setattr(
        factura_service,
        "obtener_factura_por_pedido",
        lambda db, id_pedido: None
    )

    monkeypatch.setattr(
        factura_service,
        "obtener_cajero_activo_por_id",
        lambda db, id_usuario: cajero
    )

    monkeypatch.setattr(
        factura_service,
        "obtener_siguiente_numero_factura",
        lambda db: "F-000001"
    )

    def crear_factura_fake(db, factura):
        factura.id_factura = 1
        return factura

    monkeypatch.setattr(
        factura_service,
        "crear_factura",
        crear_factura_fake
    )

    def cambiar_estado(db, pedido_recibido, nuevo_estado):
        pedido_recibido.estado = nuevo_estado
        return pedido_recibido

    monkeypatch.setattr(
        factura_service,
        "actualizar_estado_pedido",
        cambiar_estado
    )

    monkeypatch.setattr(
        factura_service,
        "obtener_mesa_por_id",
        lambda db, id_mesa: mesa
    )

    def liberar_mesa(db, mesa_recibida):
        mesa_recibida.estado = "LIBRE"

    monkeypatch.setattr(
        factura_service,
        "actualizar_mesa_a_libre",
        liberar_mesa
    )

    resultado = factura_service.registrar_factura(db, payload)

    assert resultado["id_factura"] == 1
    assert resultado["numero_factura"] == "F-000001"
    assert resultado["id_pedido"] == 1
    assert resultado["subtotal"] == Decimal("30000.00")
    assert resultado["propina"] == Decimal("5000.00")
    assert resultado["total"] == Decimal("35000.00")
    assert resultado["numero_mesa"] == 1
    assert resultado["mesero"] == "Carlos Mendez"
    assert resultado["cajero"] == "Ana Lopez"
    assert mesa.estado == "LIBRE"
    assert pedido.estado == "FACTURADO"
    assert db.committed is True
    assert db.refreshed is True


def test_registrar_factura_con_propina_negativa_lanza_error():
    db = FakeDB()

    payload = SimpleNamespace(
        id_pedido=1,
        id_usuario_cajero=3,
        propina=Decimal("-1000.00")
    )

    with pytest.raises(HTTPException) as error:
        factura_service.registrar_factura(db, payload)

    assert error.value.status_code == 400
    assert "propina" in error.value.detail.lower()


def test_registrar_factura_con_pedido_inexistente_lanza_error(monkeypatch):
    db = FakeDB()

    payload = SimpleNamespace(
        id_pedido=999,
        id_usuario_cajero=3,
        propina=Decimal("0.00")
    )

    monkeypatch.setattr(
        factura_service,
        "obtener_pedido_por_id",
        lambda db, id_pedido: None
    )

    with pytest.raises(HTTPException) as error:
        factura_service.registrar_factura(db, payload)

    assert error.value.status_code == 404
    assert "pedido" in error.value.detail.lower()


def test_registrar_factura_con_pedido_no_listo_lanza_error(monkeypatch):
    db = FakeDB()

    pedido = crear_pedido_fake("PENDIENTE")

    payload = SimpleNamespace(
        id_pedido=1,
        id_usuario_cajero=3,
        propina=Decimal("0.00")
    )

    monkeypatch.setattr(
        factura_service,
        "obtener_pedido_por_id",
        lambda db, id_pedido: pedido
    )

    with pytest.raises(HTTPException) as error:
        factura_service.registrar_factura(db, payload)

    assert error.value.status_code == 400
    assert "listo" in error.value.detail.lower()


def test_registrar_factura_duplicada_lanza_error(monkeypatch):
    db = FakeDB()

    pedido = crear_pedido_fake("LISTO")

    payload = SimpleNamespace(
        id_pedido=1,
        id_usuario_cajero=3,
        propina=Decimal("0.00")
    )

    monkeypatch.setattr(
        factura_service,
        "obtener_pedido_por_id",
        lambda db, id_pedido: pedido
    )

    monkeypatch.setattr(
        factura_service,
        "obtener_factura_por_pedido",
        lambda db, id_pedido: SimpleNamespace(id_factura=1)
    )

    with pytest.raises(HTTPException) as error:
        factura_service.registrar_factura(db, payload)

    assert error.value.status_code == 400
    assert "factura" in error.value.detail.lower()


def test_registrar_factura_con_cajero_invalido_lanza_error(monkeypatch):
    db = FakeDB()

    pedido = crear_pedido_fake("LISTO")

    payload = SimpleNamespace(
        id_pedido=1,
        id_usuario_cajero=99,
        propina=Decimal("0.00")
    )

    monkeypatch.setattr(
        factura_service,
        "obtener_pedido_por_id",
        lambda db, id_pedido: pedido
    )

    monkeypatch.setattr(
        factura_service,
        "obtener_factura_por_pedido",
        lambda db, id_pedido: None
    )

    monkeypatch.setattr(
        factura_service,
        "obtener_cajero_activo_por_id",
        lambda db, id_usuario: None
    )

    with pytest.raises(HTTPException) as error:
        factura_service.registrar_factura(db, payload)

    assert error.value.status_code == 404
    assert "cajero" in error.value.detail.lower()


def test_listar_facturas_generadas(monkeypatch):
    db = FakeDB()

    pedido = crear_pedido_fake("FACTURADO")
    cajero = crear_cajero_fake()

    factura = SimpleNamespace(
        id_factura=1,
        numero_factura="F-000001",
        id_pedido=1,
        fecha_hora_factura=None,
        propina=Decimal("5000.00"),
        total=Decimal("35000.00"),
        pedido=pedido,
        cajero=cajero
    )

    monkeypatch.setattr(
        factura_service,
        "listar_facturas",
        lambda db: [factura]
    )

    resultado = factura_service.listar_facturas_generadas(db)

    assert len(resultado) == 1
    assert resultado[0]["numero_factura"] == "F-000001"
    assert resultado[0]["total"] == Decimal("35000.00")