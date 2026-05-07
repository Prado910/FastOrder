from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import src.models
from src.api.router import api_router

app = FastAPI(
    title="Luna Roja API",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra las rutas principales de la API
app.include_router(api_router)


@app.get("/health")
def health():
    return {"status": "ok"}