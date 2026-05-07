from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    clave: str = Field(min_length=1)


class UsuarioResponse(BaseModel):
    id_usuario: int
    username: str
    nombre: str
    apellido: str
    rol: str