from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.db import get_db   
from src.repositories.producto_repository import listar_productos_para_menu
from src.schemas.producto import ProductoResponse

router = APIRouter(prefix="/productos")

@router.get("", response_model=list[ProductoResponse])
def get_productos(db: Session = Depends(get_db)):
    # Obtiene los productos que están disponibles para ser pedidos
    productos = listar_productos_para_menu(db)

    return [
        {
            "id_producto": producto.id_producto,
            "nombre": producto.nombre,
            "descripcion": producto.descripcion,
            "precio": producto.precio,
            "id_categoria": producto.id_categoria,
            "categoria": producto.categoria.nombre,
            "disponible": producto.disponible
        }
        for producto in productos
    ]