
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database.connection import engine
from app.routers.auth import router as auth_router
from app.routers.documentos import router as documentos_router
from app.routers.ia import router as ia_router


app = FastAPI(
    title="DocuIA API",
    description="API para análisis inteligente de documentos",
    version="1.0.0"
)

# Permitir la comunicación entre React y FastAPI.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar los routers.
app.include_router(auth_router)
app.include_router(documentos_router)
app.include_router(ia_router)


@app.get("/")
def root():
    return {
        "mensaje": "DocuIA API funcionando",
        "version": "1.0.0"
    }


@app.get("/database/test")
def test_database():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT DB_NAME()"))
            database_name = result.scalar()

        return {
            "success": True,
            "message": "Conexión con SQL Server exitosa",
            "database": database_name
        }

    except Exception as e:
        return {
            "success": False,
            "message": "No se pudo conectar con SQL Server",
            "error": str(e)
        }


@app.get("/users/count")
def count_users():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("SELECT COUNT(*) FROM Usuarios")
            )
            total = result.scalar()

        return {
            "success": True,
            "total_usuarios": total
        }

    except Exception as e:
        return {
            "success": False,
            "message": "No se pudo consultar Usuarios",
            "error": str(e)
        }
