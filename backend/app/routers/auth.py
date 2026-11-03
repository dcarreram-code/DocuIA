from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.models.usuario import Usuario
from app.core.security import create_access_token
from app.database.connection import get_db
from app.schemas.auth import RegistroUsuario, LoginUsuario

from app.services.usuario_service import (
    crear_usuario,
    autenticar_usuario
)


router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)


@router.post("/register")
def register(
    datos: RegistroUsuario,
    db: Session = Depends(get_db)
):
    try:
        usuario = crear_usuario(db, datos)

        return {
            "success": True,
            "message": "Usuario registrado correctamente",
            "usuario": {
                "id": usuario.IdUsuario,
                "nombre": usuario.Nombre,
                "correo": usuario.Correo,
                "rol": usuario.Rol
            }
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.post("/login")
def login(
    datos: LoginUsuario,
    db: Session = Depends(get_db)
):
    try:
        usuario = autenticar_usuario(db, datos)

        access_token = create_access_token({
            "sub": str(usuario.IdUsuario),
            "role": usuario.Rol
        })

        return {
            "success": True,
            "message": "Inicio de sesión correcto",
            "access_token": access_token,
            "token_type": "bearer",
            "usuario": {
                "id": usuario.IdUsuario,
                "nombre": usuario.Nombre,
                "correo": usuario.Correo,
                "rol": usuario.Rol
            }
        }

    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail=str(e)
        )


@router.get("/me")
def get_me(
    usuario: Usuario = Depends(get_current_user)
):
    return {
        "success": True,
        "usuario": {
            "id": usuario.IdUsuario,
            "nombre": usuario.Nombre,
            "correo": usuario.Correo,
            "rol": usuario.Rol
        }
    }