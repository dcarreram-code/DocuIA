
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.connection import get_db

from app.models.documento import Documento
from app.models.usuario import Usuario

from app.schemas.ia import PreguntaIA

from app.services.ia_service import consultar_ollama
from app.services.rag_service import preguntar_documento

from app.services.conversacion_service import (
    crear_conversacion,
    agregar_mensaje,
    obtener_conversacion,
    listar_conversaciones,
    obtener_mensajes_conversacion,
    obtener_ultimos_mensajes_conversacion
)


router = APIRouter(
    prefix="/ai",
    tags=["Inteligencia Artificial"]
)


# ==========================================================
# PRUEBA DE CONEXION CON IA
# ==========================================================

@router.post("/test")
def probar_ia(
    datos: PreguntaIA,
    usuario: Usuario = Depends(get_current_user)
):
    try:
        respuesta = consultar_ollama(datos.pregunta)

        return {
            "success": True,
            "respuesta": respuesta
        }

    except ValueError as e:
        raise HTTPException(
            status_code=503,
            detail=str(e)
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="No fue posible procesar la consulta."
        )


# ==========================================================
# LISTAR CONVERSACIONES DEL USUARIO
# ==========================================================

@router.get("/conversations")
def listar_conversaciones_endpoint(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversaciones = listar_conversaciones(
        db=db,
        id_usuario=usuario.IdUsuario
    )

    return {
        "success": True,
        "total": len(conversaciones),
        "conversaciones": conversaciones
    }


# ==========================================================
# RECUPERAR UNA CONVERSACION CON SUS MENSAJES
# ==========================================================

@router.get("/conversations/{id_conversacion}")
def obtener_conversacion_endpoint(
    id_conversacion: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversacion = obtener_conversacion(
        db=db,
        id_conversacion=id_conversacion,
        id_usuario=usuario.IdUsuario
    )

    if not conversacion:
        raise HTTPException(
            status_code=404,
            detail="Conversación no encontrada."
        )

    documento = db.scalar(
        select(Documento).where(
            Documento.IdDocumento == conversacion.IdDocumento,
            Documento.IdUsuario == usuario.IdUsuario
        )
    )

    if not documento:
        raise HTTPException(
            status_code=404,
            detail="Documento asociado no encontrado."
        )

    mensajes = obtener_mensajes_conversacion(
        db=db,
        id_conversacion=id_conversacion
    )

    return {
        "success": True,
        "conversacion": {
            "id": conversacion.IdConversacion,
            "documento_id": conversacion.IdDocumento,
            "documento_nombre": documento.NombreOriginal,
            "titulo": conversacion.Titulo,
            "fecha_creacion": conversacion.FechaCreacion,
            "fecha_actualizacion": conversacion.FechaActualizacion
        },
        "total_mensajes": len(mensajes),
        "mensajes": [
            {
                "id": mensaje.IdMensaje,
                "tipo": mensaje.Tipo,
                "contenido": mensaje.Contenido,
                "fecha": mensaje.FechaHora
            }
            for mensaje in mensajes
        ]
    }


# ==========================================================
# RECUPERAR SOLAMENTE LOS MENSAJES
# ==========================================================

@router.get("/conversations/{id_conversacion}/messages")
def obtener_mensajes_endpoint(
    id_conversacion: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversacion = obtener_conversacion(
        db=db,
        id_conversacion=id_conversacion,
        id_usuario=usuario.IdUsuario
    )

    if not conversacion:
        raise HTTPException(
            status_code=404,
            detail="Conversación no encontrada."
        )

    mensajes = obtener_mensajes_conversacion(
        db=db,
        id_conversacion=id_conversacion
    )

    return {
        "success": True,
        "id_conversacion": id_conversacion,
        "total": len(mensajes),
        "mensajes": [
            {
                "id": mensaje.IdMensaje,
                "tipo": mensaje.Tipo,
                "contenido": mensaje.Contenido,
                "fecha": mensaje.FechaHora
            }
            for mensaje in mensajes
        ]
    }


# ==========================================================
# CONSULTAR UN DOCUMENTO MEDIANTE RAG CON MEMORIA
# ==========================================================

@router.post("/documents/{id_documento}/question")
def preguntar_documento_endpoint(
    id_documento: int,
    datos: PreguntaIA,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # 1. Verificar propiedad del documento

    documento = db.scalar(
        select(Documento).where(
            Documento.IdDocumento == id_documento,
            Documento.IdUsuario == usuario.IdUsuario
        )
    )

    if not documento:
        raise HTTPException(
            status_code=404,
            detail="Documento no encontrado."
        )

    # 2. Verificar estado del documento

    if documento.Estado != "PROCESADO":
        raise HTTPException(
            status_code=400,
            detail="El documento todavía no está procesado."
        )

    try:

        # 3. Crear o recuperar conversación

        if datos.id_conversacion is None:

            conversacion = crear_conversacion(
                db=db,
                id_documento=id_documento,
                id_usuario=usuario.IdUsuario,
                titulo=datos.pregunta
            )

        else:

            conversacion = obtener_conversacion(
                db=db,
                id_conversacion=datos.id_conversacion,
                id_usuario=usuario.IdUsuario
            )

            if not conversacion:
                raise HTTPException(
                    status_code=404,
                    detail="Conversación no encontrada."
                )

            if conversacion.IdDocumento != id_documento:
                raise HTTPException(
                    status_code=403,
                    detail="La conversación no pertenece a este documento."
                )

        # 4. Recuperar historial ANTES de guardar
        # la nueva pregunta para evitar duplicarla.

        historial = obtener_ultimos_mensajes_conversacion(
            db=db,
            id_conversacion=conversacion.IdConversacion,
            limite=10
        )

        # 5. Ejecutar RAG con memoria conversacional

        resultado = preguntar_documento(
            pregunta=datos.pregunta,
            id_documento=id_documento,
            cantidad_fragmentos=5,
            historial=historial
        )

        # 6. Guardar pregunta del usuario

        agregar_mensaje(
            db=db,
            id_conversacion=conversacion.IdConversacion,
            tipo="USER",
            contenido=datos.pregunta
        )

        # 7. Guardar respuesta de DocuIA

        agregar_mensaje(
            db=db,
            id_conversacion=conversacion.IdConversacion,
            tipo="ASSISTANT",
            contenido=resultado["respuesta"]
        )

        # 8. Devolver resultado

        return {
            "success": True,
            "id_conversacion": conversacion.IdConversacion,
            "pregunta": datos.pregunta,
            "respuesta": resultado["respuesta"],
            "fuentes": resultado["fuentes"]
        }

    except HTTPException:
        raise

    except ValueError as e:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=503,
            detail="No fue posible procesar la consulta."
        )
