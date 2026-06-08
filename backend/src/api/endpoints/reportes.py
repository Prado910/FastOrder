from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.db import get_db
from src.schemas.reporte import ReportePedidosResponse
from src.services.reporte_service import generar_reporte_pedidos


router = APIRouter(prefix="/reportes")


@router.get("/pedidos", response_model=ReportePedidosResponse)
def get_reporte_pedidos(
    fecha_desde: date | None = None,
    fecha_hasta: date | None = None,
    estado: str | None = "TODOS",
    db: Session = Depends(get_db),
):
    return generar_reporte_pedidos(
        db=db,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        estado=estado,
    )