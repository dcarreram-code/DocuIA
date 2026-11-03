from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.usuario import Usuario
from app.schemas.auth import RegistroUsuario, LoginUsuario


def crear_usuario(db: Session, datos: RegistroUsuario) -> Usuario:
    usuario_existente = db.scalar(
        select(Usuario).where(Usuario.Correo == datos.correo)
    )

    if usuario_existente:
        raise ValueError("El correo ya está registrado")

    nuevo_usuario = Usuario(
        Nombre=datos.nombre,
        Correo=datos.correo,
        PasswordHash=hash_password(datos.password),
        Rol="USUARIO",
        Estado=True,
        FechaRegistro=datetime.now()
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    return nuevo_usuario


def autenticar_usuario(
    db: Session,
    datos: LoginUsuario
) -> Usuario:

    usuario = db.scalar(
        select(Usuario).where(Usuario.Correo == datos.correo)
    )

    if not usuario:
        raise ValueError("Credenciales incorrectas")

    if not usuario.Estado:
        raise ValueError("Credenciales incorrectas")

    if not verify_password(datos.password, usuario.PasswordHash):
        raise ValueError("Credenciales incorrectas")

    return usuario