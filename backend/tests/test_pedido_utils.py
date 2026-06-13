from decimal import Decimal
import re

from src.utils.pedido_utils import (
    generar_numero_pedido,
    calcular_subtotal,
    calcular_total,
)


def test_calcular_subtotal_multiplica_precio_por_cantidad():
    resultado = calcular_subtotal(Decimal("15000.00"), 2)

    assert resultado == Decimal("30000.00")


def test_calcular_total_suma_subtotales_correctamente():
    subtotales = [
        Decimal("15000.00"),
        Decimal("8500.50"),
        Decimal("3000.25"),
    ]

    resultado = calcular_total(subtotales)

    assert resultado == Decimal("26500.75")


def test_calcular_total_sin_productos_retorna_cero():
    resultado = calcular_total([])

    assert resultado == Decimal("0.00")


def test_generar_numero_pedido_tiene_formato_correcto():
    numero_pedido = generar_numero_pedido()

    assert re.match(r"^P-\d{14}$", numero_pedido)