from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.db import get_db
from src.schemas.factura import FacturaCreate, FacturaResponse
from src.services.factura_service import (
    listar_facturas_generadas,
    registrar_factura,
)

router = APIRouter(prefix="/facturas")


@router.post("", response_model=FacturaResponse, status_code=201)
def post_factura(payload: FacturaCreate, db: Session = Depends(get_db)):
    return registrar_factura(db, payload)


@router.get("", response_model=list[FacturaResponse])
def get_facturas(db: Session = Depends(get_db)):
    return listar_facturas_generadas(db)