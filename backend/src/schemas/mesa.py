from pydantic import BaseModel

class MesaResponse(BaseModel):
    id_mesa: int
    numero_mesa: int
    capacidad: int
    estado: str