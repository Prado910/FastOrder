from datetime import date
from decimal import Decimal
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from src.services import reporte_service


class FakeDB:
    pass


def test_generar_reporte_sin_fechas_lanza_error():
    db = FakeDB()

    with pytest.raises(HTTPException) as error:
        reporte_service.generar_reporte_pedidos(
            db=db,
            fecha_desde=None,
            fecha_hasta=None,
            estado="TODOS"
        )

    assert error.value.status_code == 400
    assert "par" in error.value.detail.lower()


def test_generar_reporte_con_rango_fechas_invalido_lanza_error():
    db = FakeDB()

    with pytest.raises(HTTPException) as error:
        reporte_service.generar_reporte_pedidos(
            db=db,
            fecha_desde=date(2026, 6, 10),
            fecha_hasta=date(2026, 6, 1),
            estado="TODOS"
        )

    assert error.value.status_code == 400
    assert "rango" in error.value.detail.lower()


def test_generar_reporte_con_estado_invalido_lanza_error():
    db = FakeDB()

    with pytest.raises(HTTPException) as error:
        reporte_service.generar_reporte_pedidos(
            db=db,
            fecha_desde=date(2026, 6, 1),
            fecha_hasta=date(2026, 6, 10),
            estado="ESTADO_FALSO"
        )

    assert error.value.status_code == 400
    assert "estado" in error.value.detail.lower()


def test_generar_reporte_sin_datos(monkeypatch):
    db = FakeDB()

    resumen = SimpleNamespace(
        total_pedidos=0,
        total_ventas=Decimal("0.00"),
        promedio_por_pedido=Decimal("0.00")
    )

    monkeypatch.setattr(
        reporte_service,
        "obtener_resumen_reporte_pedidos",
        lambda db, fecha_desde, fecha_hasta, estado=None: resumen
    )

    resultado = reporte_service.generar_reporte_pedidos(
        db=db,
        fecha_desde=date(2026, 6, 1),
        fecha_hasta=date(2026, 6, 10),
        estado="TODOS"
    )

    assert resultado["mensaje"] == "No existen datos para el período seleccionado"
    assert resultado["total_pedidos"] == 0
    assert resultado["total_productos"] == 0
    assert resultado["total_ventas"] == Decimal("0.00")
    assert resultado["productos"] == []


def test_generar_reporte_con_datos(monkeypatch):
    db = FakeDB()

    resumen = SimpleNamespace(
        total_pedidos=2,
        total_ventas=Decimal("60000.00"),
        promedio_por_pedido=Decimal("30000.00")
    )

    ventas_por_estado = [
        SimpleNamespace(
            estado="LISTO",
            cantidad_pedidos=2,
            total_ventas=Decimal("60000.00")
        )
    ]

    productos = [
        SimpleNamespace(
            id_producto=1,
            nombre_producto="Hamburguesa",
            cantidad_vendida=4,
            total_ventas=Decimal("60000.00")
        )
    ]

    monkeypatch.setattr(
        reporte_service,
        "obtener_resumen_reporte_pedidos",
        lambda db, fecha_desde, fecha_hasta, estado=None: resumen
    )

    monkeypatch.setattr(
        reporte_service,
        "obtener_total_productos_reporte",
        lambda db, fecha_desde, fecha_hasta, estado=None: 4
    )

    monkeypatch.setattr(
        reporte_service,
        "listar_ventas_por_estado_reporte",
        lambda db, fecha_desde, fecha_hasta, estado=None: ventas_por_estado
    )

    monkeypatch.setattr(
        reporte_service,
        "listar_productos_reporte_pedidos",
        lambda db, fecha_desde, fecha_hasta, estado=None: productos
    )

    resultado = reporte_service.generar_reporte_pedidos(
        db=db,
        fecha_desde=date(2026, 6, 1),
        fecha_hasta=date(2026, 6, 10),
        estado="TODOS"
    )

    assert resultado["mensaje"] is None
    assert resultado["total_pedidos"] == 2
    assert resultado["total_productos"] == 4
    assert resultado["total_ventas"] == Decimal("60000.00")
    assert resultado["promedio_por_pedido"] == Decimal("30000.00")
    assert resultado["ventas_por_estado"][0]["estado"] == "LISTO"
    assert resultado["productos"][0]["nombre_producto"] == "Hamburguesa"


def test_generar_reporte_filtrado_por_estado(monkeypatch):
    db = FakeDB()

    resumen = SimpleNamespace(
        total_pedidos=1,
        total_ventas=Decimal("30000.00"),
        promedio_por_pedido=Decimal("30000.00")
    )

    monkeypatch.setattr(
        reporte_service,
        "obtener_resumen_reporte_pedidos",
        lambda db, fecha_desde, fecha_hasta, estado=None: resumen
    )

    monkeypatch.setattr(
        reporte_service,
        "obtener_total_productos_reporte",
        lambda db, fecha_desde, fecha_hasta, estado=None: 2
    )

    monkeypatch.setattr(
        reporte_service,
        "listar_ventas_por_estado_reporte",
        lambda db, fecha_desde, fecha_hasta, estado=None: [
            SimpleNamespace(
                estado="FACTURADO",
                cantidad_pedidos=1,
                total_ventas=Decimal("30000.00")
            )
        ]
    )

    monkeypatch.setattr(
        reporte_service,
        "listar_productos_reporte_pedidos",
        lambda db, fecha_desde, fecha_hasta, estado=None: [
            SimpleNamespace(
                id_producto=1,
                nombre_producto="Hamburguesa",
                cantidad_vendida=2,
                total_ventas=Decimal("30000.00")
            )
        ]
    )

    resultado = reporte_service.generar_reporte_pedidos(
        db=db,
        fecha_desde=date(2026, 6, 1),
        fecha_hasta=date(2026, 6, 10),
        estado="FACTURADO"
    )

    assert resultado["estado"] == "FACTURADO"
    assert resultado["total_pedidos"] == 1