from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.db import get_db
from src.schemas.pedido import PedidoCreate, PedidoResponse
from src.services.pedido_service import registrar_pedido, consultar_pedido, listar_todos_los_pedidos, eliminar_pedido
router = APIRouter(prefix="/pedidos")


@router.post("", response_model=PedidoResponse, status_code=201)
def post_pedido(payload: PedidoCreate, db: Session = Depends(get_db)):
    # Recibe los datos del pedido, delega la lógica al servicio
    # y retorna la información del pedido ya registrado
    return registrar_pedido(db, payload)

@router.get("", response_model=list[PedidoResponse])
def get_pedidos(criterio: str | None = None, db: Session = Depends(get_db)):
    return listar_todos_los_pedidos(db, criterio)

@router.delete("/{id_pedido}", response_model=PedidoResponse)
def delete_pedido(id_pedido: int, db: Session = Depends(get_db)):
    return eliminar_pedido(db, id_pedido)

@router.get("/{id_pedido}", response_model=PedidoResponse)
def get_pedido(id_pedido: int, db: Session = Depends(get_db)):
    # Consulta un pedido existente a partir de su identificador
    return consultar_pedido(db, id_pedido)
