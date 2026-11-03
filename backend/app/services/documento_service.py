from datetime import datetime
from pathlib import Path
import uuid

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.documento import Documento


UPLOAD_DIR = Path("uploads")

ALLOWED_EXTENSIONS = {
    ".pdf": "PDF",
    ".docx": "DOCX"
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def guardar_documento(
    db: Session,
    archivo: UploadFile,
    id_usuario: int
) -> Documento:

    extension = Path(archivo.filename or "").suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError(
            "Tipo de archivo no permitido. Solo se aceptan PDF y DOCX."
        )

    contenido = archivo.file.read()

    if len(contenido) > MAX_FILE_SIZE:
        raise ValueError(
            "El archivo supera el tamaño máximo permitido de 10 MB."
        )

    if len(contenido) == 0:
        raise ValueError("El archivo está vacío.")

    UPLOAD_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    nombre_original = archivo.filename or "documento"

    nombre_archivo = (
        f"{uuid.uuid4().hex}{extension}"
    )

    ruta = UPLOAD_DIR / nombre_archivo

    with open(ruta, "wb") as archivo_guardado:
        archivo_guardado.write(contenido)

    documento = Documento(
        IdUsuario=id_usuario,
        NombreArchivo=nombre_archivo,
        NombreOriginal=nombre_original,
        TipoArchivo=ALLOWED_EXTENSIONS[extension],
        TamanoBytes=len(contenido),
        RutaArchivo=str(ruta),
        CantidadPaginas=None,
        Estado="PENDIENTE",
        FechaCarga=datetime.now()
    )

    db.add(documento)
    db.commit()
    db.refresh(documento)

    return documento