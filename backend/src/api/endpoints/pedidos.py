from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.db import get_db
from src.schemas.pedido import (
    PedidoCreate,
    PedidoResponse,
    PedidoEstadoUpdate,
)
from src.services.pedido_service import (
    registrar_pedido,
    consultar_pedido,
    listar_todos_los_pedidos,
    eliminar_pedido,
    listar_pedidos_para_cocina,
    listar_pedidos_para_caja,
    actualizar_estado_pedido_cocina,
)

router = APIRouter(prefix="/pedidos")


@router.post("", response_model=PedidoResponse, status_code=201)
def post_pedido(payload: PedidoCreate, db: Session = Depends(get_db)):
    return registrar_pedido(db, payload)


@router.get("", response_model=list[PedidoResponse])
def get_pedidos(criterio: str | None = None, db: Session = Depends(get_db)):
    return listar_todos_los_pedidos(db, criterio)


@router.get("/cocina", response_model=list[PedidoResponse])
def get_pedidos_cocina(db: Session = Depends(get_db)):
    return listar_pedidos_para_cocina(db)


@router.get("/caja", response_model=list[PedidoResponse])
def get_pedidos_caja(
    criterio: str | None = None,
    db: Session = Depends(get_db),
):
    return listar_pedidos_para_caja(db, criterio)


@router.patch("/{id_pedido}/estado", response_model=PedidoResponse)
def patch_estado_pedido(
    id_pedido: int,
    payload: PedidoEstadoUpdate,
    db: Session = Depends(get_db),
):
    return actualizar_estado_pedido_cocina(db, id_pedido, payload.estado)


@router.delete("/{id_pedido}", response_model=PedidoResponse)
def delete_pedido(id_pedido: int, db: Session = Depends(get_db)):
    return eliminar_pedido(db, id_pedido)


@router.get("/{id_pedido}", response_model=PedidoResponse)
def get_pedido(id_pedido: int, db: Session = Depends(get_db)):
    return consultar_pedido(db, id_pedido)
