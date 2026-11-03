from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.services.procesamiento_service import procesar_documento
from app.core.dependencies import get_current_user
from app.database.connection import get_db
from app.models.usuario import Usuario
from app.services.documento_service import guardar_documento
from sqlalchemy import select
from app.models.documento import Documento
from app.services.analisis_service import (analizar_documento,obtener_analisis_existente)
from app.services.analisis_service import (analizar_documento,obtener_analisis_existente, obtener_historial_analisis)
from app.models.analisis import Analisis
from pathlib import Path
from fastapi.responses import FileResponse

router = APIRouter(
    prefix="/documents",
    tags=["Documentos"]
)


@router.get("/")
def listar_documentos(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    documentos = db.scalars(
        select(Documento)
        .where(Documento.IdUsuario == usuario.IdUsuario)
        .order_by(Documento.FechaCarga.desc())
    ).all()

    return {
        "success": True,
        "total": len(documentos),
        "documentos": [
            {
                "id": documento.IdDocumento,
                "nombre_original": documento.NombreOriginal,
                "tipo": documento.TipoArchivo,
                "tamano_bytes": documento.TamanoBytes,
                "estado": documento.Estado,
                "fecha_carga": documento.FechaCarga,
                "paginas": documento.CantidadPaginas
            }
            for documento in documentos
        ]
    }




@router.post("/upload")
def upload_document(
    archivo: UploadFile = File(...),
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        documento = guardar_documento(
            db=db,
            archivo=archivo,
            id_usuario=usuario.IdUsuario
        )

        return {
            "success": True,
            "message": "Documento cargado correctamente",
            "documento": {
                "id": documento.IdDocumento,
                "nombre_original": documento.NombreOriginal,
                "tipo": documento.TipoArchivo,
                "tamano_bytes": documento.TamanoBytes,
                "estado": documento.Estado,
                "fecha_carga": documento.FechaCarga
            }
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="No fue posible cargar el documento."
        )

@router.post("/{id_documento}/process")
def process_document(
    id_documento: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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

    try:

        documento = procesar_documento(
            db=db,
            id_documento=id_documento
        )

        return {
            "success": True,
            "message": "Documento procesado correctamente",
            "documento": {
                "id": documento.IdDocumento,
                "nombre": documento.NombreOriginal,
                "paginas": documento.CantidadPaginas,
                "estado": documento.Estado
            }
        }

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception:

        raise HTTPException(
            status_code=500,
            detail="No fue posible procesar el documento."
        )


@router.post("/{id_documento}/analyze")
def analyze_document(
    id_documento: int,
     regenerar: bool = False,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
   
):
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

    if documento.Estado != "PROCESADO":
        raise HTTPException(
            status_code=400,
            detail="El documento debe estar procesado antes de analizarlo."
        )

    try:

        analisis = analizar_documento(
        db=db,
         id_documento=id_documento,
        regenerar=regenerar
        )

        return {
            "success": True,
            "message": "Documento analizado correctamente",
            "analisis": {
                "id": analisis.IdAnalisis,
                "documento_id": analisis.IdDocumento,
                "modelo": analisis.ModeloIA,
                "resumen": analisis.Resumen,
                "puntos_importantes": analisis.PuntosImportantes,
                "estado": analisis.Estado,
                "fecha": analisis.FechaAnalisis
            }
        }

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception:

        raise HTTPException(
            status_code=503,
            detail="No fue posible analizar el documento."
        )



@router.get("/{id_documento}/analysis")
def get_document_analysis(
    id_documento: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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

    analisis = obtener_analisis_existente(
        db=db,
        id_documento=id_documento
    )

    if not analisis:
        return {
            "success": True,
            "exists": False,
            "message": "El documento todavía no tiene un análisis."
        }

    return {
        "success": True,
        "exists": True,
        "analisis": {
            "id": analisis.IdAnalisis,
            "documento_id": analisis.IdDocumento,
            "modelo": analisis.ModeloIA,
            "resumen": analisis.Resumen,
            "puntos_importantes": analisis.PuntosImportantes,
            "estado": analisis.Estado,
            "fecha": analisis.FechaAnalisis
        }
    }



@router.get("/{id_documento}/analysis/history")
def get_analysis_history(
    id_documento: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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

    historial = obtener_historial_analisis(
        db=db,
        id_documento=id_documento
    )

    return {
        "success": True,
        "total": len(historial),
        "historial": [
            {
                "id": analisis.IdAnalisis,
                "documento_id": analisis.IdDocumento,
                "modelo": analisis.ModeloIA,
                "estado": analisis.Estado,
                "fecha": analisis.FechaAnalisis
            }
            for analisis in historial
        ]
    }



@router.get("/{id_documento}/analysis/version/{id_analisis}")
def get_analysis_version(
    id_documento: int,
    id_analisis: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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

    analisis = db.scalar(
        select(Analisis).where(
            Analisis.IdAnalisis == id_analisis,
            Analisis.IdDocumento == id_documento
        )
    )

    if not analisis:
        raise HTTPException(
            status_code=404,
            detail="Versión de análisis no encontrada."
        )

    return {
        "success": True,
        "analisis": {
            "id": analisis.IdAnalisis,
            "documento_id": analisis.IdDocumento,
            "modelo": analisis.ModeloIA,
            "resumen": analisis.Resumen,
            "puntos_importantes": analisis.PuntosImportantes,
            "estado": analisis.Estado,
            "fecha": analisis.FechaAnalisis
        }
    }


@router.get("/{id_documento}/view")
def visualizar_documento(
    id_documento: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    # 1. Buscar el documento y comprobar que pertenece al usuario
    documento = db.query(Documento).filter(
        Documento.IdDocumento == id_documento,
        Documento.IdUsuario == usuario.IdUsuario
    ).first()

    if not documento:
        raise HTTPException(
            status_code=404,
            detail="Documento no encontrado."
        )

    # 2. Verificar que sea un PDF
    if documento.TipoArchivo != "PDF":
        raise HTTPException(
            status_code=400,
            detail="La visualización solo está disponible para archivos PDF."
        )

    # 3. Resolver la ruta física del archivo
    carpeta_uploads = (Path.cwd() / "uploads").resolve()
    ruta_guardada = Path(documento.RutaArchivo)

    if not ruta_guardada.is_absolute():
        ruta_guardada = Path.cwd() / ruta_guardada

    try:
        ruta_archivo = ruta_guardada.resolve(strict=True)
        ruta_archivo.relative_to(carpeta_uploads)
    except (ValueError, FileNotFoundError, OSError):
        raise HTTPException(
            status_code=404,
            detail="No se encontró el archivo PDF."
        )

    # 4. Comprobar que sea un archivo
    if not ruta_archivo.is_file():
        raise HTTPException(
            status_code=404,
            detail="El archivo no existe."
        )

    # 5. Entregar el PDF para visualizarlo en el navegador
    return FileResponse(
        path=str(ruta_archivo),
        media_type="application/pdf",
        content_disposition_type="inline",
        filename=documento.NombreOriginal
    )