from decimal import Decimal
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from src.services import pedido_service


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
        observacion_item="Sin cebolla",
        producto=SimpleNamespace(nombre="Hamburguesa")
    )


def crear_pedido_fake(estado="PENDIENTE"):
    return SimpleNamespace(
        id_pedido=1,
        numero_pedido="P-TEST",
        id_mesa=1,
        estado=estado,
        total=Decimal("30000.00"),
        fecha_hora_creacion=None,
        detalles=[crear_detalle_fake()],
        mesero=SimpleNamespace(nombre="Carlos", apellido="Mendez"),
        mesa=SimpleNamespace(numero_mesa=1),
    )


def test_registrar_pedido_correctamente(monkeypatch):
    db = FakeDB()

    mesa = SimpleNamespace(id_mesa=1, estado="LIBRE")
    mesero = SimpleNamespace(id_usuario=1, estado="A")
    producto = SimpleNamespace(
        id_producto=1,
        nombre="Hamburguesa",
        precio=Decimal("15000.00")
    )

    payload = SimpleNamespace(
        id_mesa=1,
        id_usuario_mesero=1,
        items=[
            SimpleNamespace(
                id_producto=1,
                cantidad=2,
                observacion_item="Sin cebolla"
            )
        ]
    )

    monkeypatch.setattr(
        pedido_service,
        "obtener_mesero_activo_por_id",
        lambda db, id_usuario: mesero
    )

    monkeypatch.setattr(
        pedido_service,
        "obtener_mesa_por_id",
        lambda db, id_mesa: mesa
    )

    monkeypatch.setattr(
        pedido_service,
        "obtener_producto_por_id",
        lambda db, id_producto: producto
    )

    monkeypatch.setattr(
        pedido_service,
        "generar_numero_pedido",
        lambda: "P-TEST"
    )

    def crear_pedido_fake_db(db, pedido):
        pedido.id_pedido = 1
        return pedido

    monkeypatch.setattr(
        pedido_service,
        "crear_pedido",
        crear_pedido_fake_db
    )

    monkeypatch.setattr(
        pedido_service,
        "crear_detalle_pedido",
        lambda db, detalle: detalle
    )

    def ocupar_mesa(db, mesa_recibida):
        mesa_recibida.estado = "OCUPADA"

    monkeypatch.setattr(
        pedido_service,
        "actualizar_mesa_a_ocupada",
        ocupar_mesa
    )

    resultado = pedido_service.registrar_pedido(db, payload)

    assert resultado["id_pedido"] == 1
    assert resultado["numero_pedido"] == "P-TEST"
    assert resultado["estado"] == "PENDIENTE"
    assert resultado["total"] == Decimal("30000.00")
    assert len(resultado["items"]) == 1
    assert mesa.estado == "OCUPADA"
    assert db.committed is True
    assert db.refreshed is True


def test_registrar_pedido_sin_productos_lanza_error():
    db = FakeDB()

    payload = SimpleNamespace(
        id_mesa=1,
        id_usuario_mesero=1,
        items=[]
    )

    with pytest.raises(HTTPException) as error:
        pedido_service.registrar_pedido(db, payload)

    assert error.value.status_code == 400
    assert "producto" in error.value.detail.lower()


def test_registrar_pedido_sin_mesero_lanza_error():
    db = FakeDB()

    payload = SimpleNamespace(
        id_mesa=1,
        id_usuario_mesero=None,
        items=[
            SimpleNamespace(
                id_producto=1,
                cantidad=1,
                observacion_item=None
            )
        ]
    )

    with pytest.raises(HTTPException) as error:
        pedido_service.registrar_pedido(db, payload)

    assert error.value.status_code == 400
    assert "mesero" in error.value.detail.lower()


def test_registrar_pedido_con_mesero_inexistente_lanza_error(monkeypatch):
    db = FakeDB()

    payload = SimpleNamespace(
        id_mesa=1,
        id_usuario_mesero=99,
        items=[
            SimpleNamespace(
                id_producto=1,
                cantidad=1,
                observacion_item=None
            )
        ]
    )

    monkeypatch.setattr(
        pedido_service,
        "obtener_mesero_activo_por_id",
        lambda db, id_usuario: None
    )

    with pytest.raises(HTTPException) as error:
        pedido_service.registrar_pedido(db, payload)

    assert error.value.status_code == 404
    assert "mesero" in error.value.detail.lower()


def test_registrar_pedido_con_mesa_inexistente_lanza_error(monkeypatch):
    db = FakeDB()

    payload = SimpleNamespace(
        id_mesa=99,
        id_usuario_mesero=1,
        items=[
            SimpleNamespace(
                id_producto=1,
                cantidad=1,
                observacion_item=None
            )
        ]
    )

    monkeypatch.setattr(
        pedido_service,
        "obtener_mesero_activo_por_id",
        lambda db, id_usuario: SimpleNamespace(id_usuario=1)
    )

    monkeypatch.setattr(
        pedido_service,
        "obtener_mesa_por_id",
        lambda db, id_mesa: None
    )

    with pytest.raises(HTTPException) as error:
        pedido_service.registrar_pedido(db, payload)

    assert error.value.status_code == 404
    assert "mesa" in error.value.detail.lower()


def test_registrar_pedido_con_mesa_ocupada_lanza_error(monkeypatch):
    db = FakeDB()

    payload = SimpleNamespace(
        id_mesa=1,
        id_usuario_mesero=1,
        items=[
            SimpleNamespace(
                id_producto=1,
                cantidad=1,
                observacion_item=None
            )
        ]
    )

    monkeypatch.setattr(
        pedido_service,
        "obtener_mesero_activo_por_id",
        lambda db, id_usuario: SimpleNamespace(id_usuario=1)
    )

    monkeypatch.setattr(
        pedido_service,
        "obtener_mesa_por_id",
        lambda db, id_mesa: SimpleNamespace(id_mesa=1, estado="OCUPADA")
    )

    with pytest.raises(HTTPException) as error:
        pedido_service.registrar_pedido(db, payload)

    assert error.value.status_code == 400
    assert "libre" in error.value.detail.lower()


def test_registrar_pedido_con_producto_no_disponible_lanza_error(monkeypatch):
    db = FakeDB()

    mesa = SimpleNamespace(id_mesa=1, estado="LIBRE")
    mesero = SimpleNamespace(id_usuario=1)

    payload = SimpleNamespace(
        id_mesa=1,
        id_usuario_mesero=1,
        items=[
            SimpleNamespace(
                id_producto=99,
                cantidad=1,
                observacion_item=None
            )
        ]
    )

    monkeypatch.setattr(
        pedido_service,
        "obtener_mesero_activo_por_id",
        lambda db, id_usuario: mesero
    )

    monkeypatch.setattr(
        pedido_service,
        "obtener_mesa_por_id",
        lambda db, id_mesa: mesa
    )

    monkeypatch.setattr(
        pedido_service,
        "obtener_producto_por_id",
        lambda db, id_producto: None
    )

    monkeypatch.setattr(
        pedido_service,
        "generar_numero_pedido",
        lambda: "P-TEST"
    )

    def crear_pedido_fake_db(db, pedido):
        pedido.id_pedido = 1
        return pedido

    monkeypatch.setattr(
        pedido_service,
        "crear_pedido",
        crear_pedido_fake_db
    )

    with pytest.raises(HTTPException) as error:
        pedido_service.registrar_pedido(db, payload)

    assert error.value.status_code == 404
    assert "producto" in error.value.detail.lower()


def test_consultar_pedido_existente(monkeypatch):
    db = FakeDB()
    pedido = crear_pedido_fake("PENDIENTE")

    monkeypatch.setattr(
        pedido_service,
        "obtener_pedido_por_id",
        lambda db, id_pedido: pedido
    )

    resultado = pedido_service.consultar_pedido(db, 1)

    assert resultado["id_pedido"] == 1
    assert resultado["numero_pedido"] == "P-TEST"
    assert resultado["numero_mesa"] == 1
    assert resultado["mesero"] == "Carlos Mendez"
    assert len(resultado["items"]) == 1


def test_consultar_pedido_inexistente_lanza_error(monkeypatch):
    db = FakeDB()

    monkeypatch.setattr(
        pedido_service,
        "obtener_pedido_por_id",
        lambda db, id_pedido: None
    )

    with pytest.raises(HTTPException) as error:
        pedido_service.consultar_pedido(db, 99)

    assert error.value.status_code == 404
    assert "pedido" in error.value.detail.lower()


def test_listar_todos_los_pedidos(monkeypatch):
    db = FakeDB()
    pedido = crear_pedido_fake("PENDIENTE")

    monkeypatch.setattr(
        pedido_service,
        "listar_pedidos",
        lambda db, criterio=None: [pedido]
    )

    resultado = pedido_service.listar_todos_los_pedidos(db)

    assert len(resultado) == 1
    assert resultado[0]["id_pedido"] == 1


def test_eliminar_pedido_pendiente_cambia_estado_a_cancelado_y_libera_mesa(monkeypatch):
    db = FakeDB()
    pedido = crear_pedido_fake("PENDIENTE")
    mesa = SimpleNamespace(id_mesa=1, estado="OCUPADA")

    monkeypatch.setattr(
        pedido_service,
        "obtener_pedido_por_id",
        lambda db, id_pedido: pedido
    )

    monkeypatch.setattr(
        pedido_service,
        "obtener_mesa_por_id",
        lambda db, id_mesa: mesa
    )

    def marcar_cancelado(db, pedido_recibido):
        pedido_recibido.estado = "CANCELADO"
        return pedido_recibido

    def liberar_mesa(db, mesa_recibida):
        mesa_recibida.estado = "LIBRE"

    monkeypatch.setattr(
        pedido_service,
        "marcar_pedido_cancelado",
        marcar_cancelado
    )

    monkeypatch.setattr(
        pedido_service,
        "actualizar_mesa_a_libre",
        liberar_mesa
    )

    resultado = pedido_service.eliminar_pedido(db, 1)

    assert resultado["estado"] == "CANCELADO"
    assert mesa.estado == "LIBRE"
    assert db.committed is True
    assert db.refreshed is True


def test_eliminar_pedido_en_preparacion_lanza_error(monkeypatch):
    db = FakeDB()
    pedido = crear_pedido_fake("EN_PREPARACION")

    monkeypatch.setattr(
        pedido_service,
        "obtener_pedido_por_id",
        lambda db, id_pedido: pedido
    )

    with pytest.raises(HTTPException) as error:
        pedido_service.eliminar_pedido(db, 1)

    assert error.value.status_code == 400
    assert "prepar" in error.value.detail.lower()


def test_eliminar_pedido_inexistente_lanza_error(monkeypatch):
    db = FakeDB()

    monkeypatch.setattr(
        pedido_service,
        "obtener_pedido_por_id",
        lambda db, id_pedido: None
    )

    with pytest.raises(HTTPException) as error:
        pedido_service.eliminar_pedido(db, 999)

    assert error.value.status_code == 404


def test_actualizar_estado_pedido_de_pendiente_a_listo_no_permitido(monkeypatch):
    db = FakeDB()
    pedido = crear_pedido_fake("PENDIENTE")

    monkeypatch.setattr(
        pedido_service,
        "obtener_pedido_por_id",
        lambda db, id_pedido: pedido
    )

    with pytest.raises(HTTPException) as error:
        pedido_service.actualizar_estado_pedido_cocina(db, 1, "LISTO")

    assert error.value.status_code == 400
    assert "preparaci" in error.value.detail.lower()


def test_actualizar_estado_pedido_de_pendiente_a_en_preparacion(monkeypatch):
    db = FakeDB()
    pedido = crear_pedido_fake("PENDIENTE")

    monkeypatch.setattr(
        pedido_service,
        "obtener_pedido_por_id",
        lambda db, id_pedido: pedido
    )

    def cambiar_estado(db, pedido_recibido, nuevo_estado):
        pedido_recibido.estado = nuevo_estado
        return pedido_recibido

    monkeypatch.setattr(
        pedido_service,
        "actualizar_estado_pedido",
        cambiar_estado
    )

    resultado = pedido_service.actualizar_estado_pedido_cocina(
        db,
        1,
        "EN_PREPARACION"
    )

    assert resultado["estado"] == "EN_PREPARACION"
    assert db.committed is True
    assert db.refreshed is True


def test_actualizar_estado_pedido_de_en_preparacion_a_listo(monkeypatch):
    db = FakeDB()
    pedido = crear_pedido_fake("EN_PREPARACION")

    monkeypatch.setattr(
        pedido_service,
        "obtener_pedido_por_id",
        lambda db, id_pedido: pedido
    )

    def cambiar_estado(db, pedido_recibido, nuevo_estado):
        pedido_recibido.estado = nuevo_estado
        return pedido_recibido

    monkeypatch.setattr(
        pedido_service,
        "actualizar_estado_pedido",
        cambiar_estado
    )

    resultado = pedido_service.actualizar_estado_pedido_cocina(
        db,
        1,
        "LISTO"
    )

    assert resultado["estado"] == "LISTO"
    assert db.committed is True


def test_actualizar_estado_pedido_cancelado_no_permitido(monkeypatch):
    db = FakeDB()
    pedido = crear_pedido_fake("CANCELADO")

    monkeypatch.setattr(
        pedido_service,
        "obtener_pedido_por_id",
        lambda db, id_pedido: pedido
    )

    with pytest.raises(HTTPException) as error:
        pedido_service.actualizar_estado_pedido_cocina(
            db,
            1,
            "EN_PREPARACION"
        )

    assert error.value.status_code == 400
    assert "cancelado" in error.value.detail.lower()


def test_actualizar_estado_pedido_con_transicion_no_permitida(monkeypatch):
    db = FakeDB()
    pedido = crear_pedido_fake("EN_PREPARACION")

    monkeypatch.setattr(
        pedido_service,
        "obtener_pedido_por_id",
        lambda db, id_pedido: pedido
    )

    with pytest.raises(HTTPException) as error:
        pedido_service.actualizar_estado_pedido_cocina(
            db,
            1,
            "PENDIENTE"
        )

    assert error.value.status_code == 400
    assert "no es posible realizar este cambio" in error.value.detail.lower()
    assert "actualiza el listado" in error.value.detail.lower()


def test_listar_pedidos_para_cocina(monkeypatch):
    db = FakeDB()
    pedido = crear_pedido_fake("PENDIENTE")

    monkeypatch.setattr(
        pedido_service,
        "listar_pedidos_cocina",
        lambda db: [pedido]
    )

    resultado = pedido_service.listar_pedidos_para_cocina(db)

    assert len(resultado) == 1
    assert resultado[0]["estado"] == "PENDIENTE"


def test_listar_pedidos_para_caja(monkeypatch):
    db = FakeDB()
    pedido = crear_pedido_fake("LISTO")

    monkeypatch.setattr(
        pedido_service,
        "listar_pedidos_caja",
        lambda db, criterio=None: [pedido]
    )

    resultado = pedido_service.listar_pedidos_para_caja(db)

    assert len(resultado) == 1
    assert resultado[0]["estado"] == "LISTO"


def test_listar_pedidos_para_admin_con_rango_fechas_invalido():
    db = FakeDB()

    with pytest.raises(HTTPException) as error:
        pedido_service.listar_pedidos_para_admin(
            db=db,
            fecha_desde="2026-06-10",
            fecha_hasta="2026-06-01"
        )

    assert error.value.status_code == 400
    assert "rango" in error.value.detail.lower()


def test_eliminar_pedido_admin_facturado_no_permitido(monkeypatch):
    db = FakeDB()
    pedido = crear_pedido_fake("FACTURADO")

    monkeypatch.setattr(
        pedido_service,
        "obtener_pedido_por_id",
        lambda db, id_pedido: pedido
    )

    monkeypatch.setattr(
        pedido_service,
        "obtener_factura_por_pedido",
        lambda db, id_pedido: SimpleNamespace(id_factura=1)
    )

    with pytest.raises(HTTPException) as error:
        pedido_service.eliminar_pedido_admin(db, 1)

    assert error.value.status_code == 400
    assert "facturado" in error.value.detail.lower()


def test_eliminar_pedido_admin_ya_servido_no_permitido(monkeypatch):
    db = FakeDB()
    pedido = crear_pedido_fake("LISTO")

    monkeypatch.setattr(
        pedido_service,
        "obtener_pedido_por_id",
        lambda db, id_pedido: pedido
    )

    monkeypatch.setattr(
        pedido_service,
        "obtener_factura_por_pedido",
        lambda db, id_pedido: None
    )

    with pytest.raises(HTTPException) as error:
        pedido_service.eliminar_pedido_admin(db, 1)

    assert error.value.status_code == 400
    assert "servido" in error.value.detail.lower()