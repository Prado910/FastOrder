from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.db import get_db
from src.repositories.mesa_repository import (
    listar_mesas_disponibles,
    listar_mesas_para_seleccion,
)

router = APIRouter(prefix="/mesas")

@router.get("")
def get_mesas(db: Session = Depends(get_db)):
    # Obtiene la lista de mesas para mostrar en la pantalla de selección
    mesas = listar_mesas_para_seleccion(db)

    # Transforma los objetos ORM en una respuesta JSON simple
    return [
        {
            "id_mesa": mesa.id_mesa,
            "numero_mesa": mesa.numero_mesa,
            "capacidad": mesa.capacidad,
            "estado": mesa.estado,
        }
        for mesa in mesas
    ]

@router.get("/disponibles")
def get_mesas_disponibles(db: Session = Depends(get_db)):
    # Obtiene la lista de mesas que están disponibles para asignar pedidos
    mesas = listar_mesas_disponibles(db)

    # Transforma los objetos ORM en una respuesta JSON simple
    return [
        {
            "id_mesa": mesa.id_mesa,
            "numero_mesa": mesa.numero_mesa,
            "capacidad": mesa.capacidad,
            "estado": mesa.estado,
        }
        for mesa in mesas
    ]