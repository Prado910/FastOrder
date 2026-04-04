from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.db import get_db
from src.repositories.mesa_repository import (
    listar_mesas_disponibles,
    listar_mesas_para_seleccion,
)
from src.schemas.mesa import MesaResponse

router = APIRouter(prefix="/mesas")

@router.get("", response_model=list[MesaResponse])
def get_mesas(db: Session = Depends(get_db)):
    return listar_mesas_para_seleccion(db)

@router.get("/disponibles", response_model=list[MesaResponse])
def get_mesas_disponibles(db: Session = Depends(get_db)):
    return listar_mesas_disponibles(db)