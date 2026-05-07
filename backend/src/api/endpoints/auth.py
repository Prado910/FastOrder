from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.db import get_db
from src.schemas.usuario import LoginRequest, UsuarioResponse
from src.services.usuario_service import iniciar_sesion


router = APIRouter(prefix="/auth")

@router.post("/login", response_model=UsuarioResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    return iniciar_sesion(db, payload)