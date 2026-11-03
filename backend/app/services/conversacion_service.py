
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.conversacion import Conversacion
from app.models.mensaje import Mensaje
from app.models.documento import Documento


def crear_conversacion(
    db: Session,
    id_documento: int,
    id_usuario: int,
    titulo: str
):
    """Crea una conversación asociada a un documento y usuario."""

    ahora = datetime.now()

    conversacion = Conversacion(
        IdDocumento=id_documento,
        IdUsuario=id_usuario,
        Titulo=titulo[:255],
        FechaCreacion=ahora,
        FechaActualizacion=ahora
    )

    db.add(conversacion)
    db.commit()
    db.refresh(conversacion)

    return conversacion


def agregar_mensaje(
    db: Session,
    id_conversacion: int,
    tipo: str,
    contenido: str
):
    """Guarda un mensaje dentro de una conversación."""

    if tipo not in {"USER", "ASSISTANT"}:
        raise ValueError("Tipo de mensaje no válido.")

    mensaje = Mensaje(
        IdConversacion=id_conversacion,
        Tipo=tipo,
        Contenido=contenido,
        FechaHora=datetime.now()
    )

    db.add(mensaje)

    conversacion = db.scalar(
        select(Conversacion).where(
            Conversacion.IdConversacion == id_conversacion
        )
    )

    if conversacion:
        conversacion.FechaActualizacion = datetime.now()

    db.commit()
    db.refresh(mensaje)

    return mensaje


def obtener_conversacion(
    db: Session,
    id_conversacion: int,
    id_usuario: int
):
    """Obtiene una conversación verificando que pertenezca al usuario."""

    return db.scalar(
        select(Conversacion).where(
            Conversacion.IdConversacion == id_conversacion,
            Conversacion.IdUsuario == id_usuario
        )
    )


def listar_conversaciones(
    db: Session,
    id_usuario: int
):
    """Lista las conversaciones del usuario con el nombre del documento."""

    resultado = db.execute(
        select(
            Conversacion,
            Documento.NombreOriginal
        )
        .join(
            Documento,
            Documento.IdDocumento == Conversacion.IdDocumento
        )
        .where(
            Conversacion.IdUsuario == id_usuario
        )
        .order_by(
            Conversacion.FechaActualizacion.desc()
        )
    )

    conversaciones = []

    for conversacion, nombre_documento in resultado.all():
        conversaciones.append({
            "id": conversacion.IdConversacion,
            "documento_id": conversacion.IdDocumento,
            "documento_nombre": nombre_documento,
            "titulo": conversacion.Titulo,
            "fecha_creacion": conversacion.FechaCreacion,
            "fecha_actualizacion": conversacion.FechaActualizacion
        })

    return conversaciones


def obtener_mensajes_conversacion(
    db: Session,
    id_conversacion: int
):
    """Recupera todos los mensajes en orden cronológico."""

    return db.scalars(
        select(Mensaje)
        .where(
            Mensaje.IdConversacion == id_conversacion
        )
        .order_by(
            Mensaje.FechaHora.asc(),
            Mensaje.IdMensaje.asc()
        )
    ).all()


def obtener_ultimos_mensajes_conversacion(
    db: Session,
    id_conversacion: int,
    limite: int = 10
):
    """
    Recupera los últimos mensajes de una conversación
    y los devuelve en orden cronológico.

    Se utiliza para proporcionar memoria contextual a la IA.
    """

    mensajes = db.scalars(
        select(Mensaje)
        .where(
            Mensaje.IdConversacion == id_conversacion
        )
        .order_by(
            Mensaje.FechaHora.desc(),
            Mensaje.IdMensaje.desc()
        )
        .limit(limite)
    ).all()

    # La consulta obtiene los más recientes primero.
    # Invertimos el resultado para conservar el orden cronológico.
    mensajes.reverse()

    return [
        {
            "tipo": mensaje.Tipo,
            "contenido": mensaje.Contenido
        }
        for mensaje in mensajes
    ]
