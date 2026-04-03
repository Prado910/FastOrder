from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.db import get_db
from src.repositories.producto_repository import listar_productos_disponibles

router = APIRouter(prefix="/productos")


@router.get("")
def get_productos(db: Session = Depends(get_db)):
    # Obtiene los productos que están disponibles para ser pedidos
    productos = listar_productos_disponibles(db)

    # Convierte los objetos ORM en una respuesta JSON simple
    return [
        {
            "id_producto": producto.id_producto,
            "nombre": producto.nombre,
            "descripcion": producto.descripcion,
            "precio": producto.precio,
        }
        for producto in productos
    ]