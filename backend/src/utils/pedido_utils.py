from datetime import datetime
from decimal import Decimal
from typing import Iterable

def generar_numero_pedido() -> str:
    # Genera un identificador de pedido basado en la fecha y hora actua
    return f"P-{datetime.now().strftime('%Y%m%d%H%M%S')}"


def calcular_subtotal(precio_unitario: Decimal, cantidad: int) -> Decimal:
    return Decimal(precio_unitario) * Decimal(cantidad)


def calcular_total(subtotales: Iterable[Decimal]) -> Decimal:
    total = sum((Decimal(s) for s in subtotales), Decimal("0.00"))
    return total.quantize(Decimal("0.01"))