from fastapi import FastAPI
from src.api.router import api_router

app = FastAPI(
    title="Luna Roja API",
    version="0.1.0"
)

#Registra las rutas principales de la API
app.include_router(api_router)


@app.get("/health")
def health():
    # Endpoint básico para verificar que la API está activa
    return {"status": "ok"}