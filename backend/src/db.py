from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from src.config import DATABASE_URL

engine = create_engine(DATABASE_URL, echo=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

Base = declarative_base()


def get_db():
    # Proporciona una sesión de base de datos por petición y la cierra al finalizar
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()