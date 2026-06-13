from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from src.services import usuario_service


def test_iniciar_sesion_con_usuario_valido_retorna_datos(monkeypatch):
    usuario_fake = SimpleNamespace(
        id_usuario=1,
        username="mesero1",
        nombre="Carlos",
        apellido="Mendez",
        rol=SimpleNamespace(nombre="MESERO"),
    )

    monkeypatch.setattr(
        usuario_service,
        "autenticar_usuario",
        lambda db, username, clave: usuario_fake
    )

    payload = SimpleNamespace(
        username="mesero1",
        clave="password"
    )

    resultado = usuario_service.iniciar_sesion(None, payload)

    assert resultado["id_usuario"] == 1
    assert resultado["username"] == "mesero1"
    assert resultado["nombre"] == "Carlos"
    assert resultado["apellido"] == "Mendez"
    assert resultado["rol"] == "MESERO"


def test_iniciar_sesion_con_usuario_cocina_valido(monkeypatch):
    usuario_fake = SimpleNamespace(
        id_usuario=2,
        username="cocina1",
        nombre="Ana",
        apellido="Torres",
        rol=SimpleNamespace(nombre="COCINA"),
    )

    monkeypatch.setattr(
        usuario_service,
        "autenticar_usuario",
        lambda db, username, clave: usuario_fake
    )

    payload = SimpleNamespace(
        username="cocina1",
        clave="password"
    )

    resultado = usuario_service.iniciar_sesion(None, payload)

    assert resultado["rol"] == "COCINA"


def test_iniciar_sesion_con_usuario_caja_valido(monkeypatch):
    usuario_fake = SimpleNamespace(
        id_usuario=3,
        username="caja1",
        nombre="Ana",
        apellido="Lopez",
        rol=SimpleNamespace(nombre="CAJA"),
    )

    monkeypatch.setattr(
        usuario_service,
        "autenticar_usuario",
        lambda db, username, clave: usuario_fake
    )

    payload = SimpleNamespace(
        username="caja1",
        clave="password"
    )

    resultado = usuario_service.iniciar_sesion(None, payload)

    assert resultado["rol"] == "CAJA"


def test_iniciar_sesion_con_usuario_admin_valido(monkeypatch):
    usuario_fake = SimpleNamespace(
        id_usuario=4,
        username="admin1",
        nombre="Pedro",
        apellido="Gomez",
        rol=SimpleNamespace(nombre="ADMINISTRADOR"),
    )

    monkeypatch.setattr(
        usuario_service,
        "autenticar_usuario",
        lambda db, username, clave: usuario_fake
    )

    payload = SimpleNamespace(
        username="admin1",
        clave="password"
    )

    resultado = usuario_service.iniciar_sesion(None, payload)

    assert resultado["rol"] == "ADMINISTRADOR"


def test_iniciar_sesion_con_credenciales_invalidas_lanza_error(monkeypatch):
    monkeypatch.setattr(
        usuario_service,
        "autenticar_usuario",
        lambda db, username, clave: None
    )

    payload = SimpleNamespace(
        username="usuario_malo",
        clave="clave_mala"
    )

    with pytest.raises(HTTPException) as error:
        usuario_service.iniciar_sesion(None, payload)

    assert error.value.status_code == 401
    assert "incorrectos" in error.value.detail.lower()


def test_iniciar_sesion_con_rol_no_habilitado_lanza_error(monkeypatch):
    usuario_fake = SimpleNamespace(
        id_usuario=1,
        username="otro1",
        nombre="Usuario",
        apellido="Prueba",
        rol=SimpleNamespace(nombre="INVITADO"),
    )

    monkeypatch.setattr(
        usuario_service,
        "autenticar_usuario",
        lambda db, username, clave: usuario_fake
    )

    payload = SimpleNamespace(
        username="otro1",
        clave="password"
    )

    with pytest.raises(HTTPException) as error:
        usuario_service.iniciar_sesion(None, payload)

    assert error.value.status_code == 403