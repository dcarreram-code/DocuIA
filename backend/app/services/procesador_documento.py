from pathlib import Path

import pymupdf
from docx import Document as DocxDocument


def extraer_pdf(ruta_archivo: str):
    documento = pymupdf.open(ruta_archivo)

    paginas = []

    for numero_pagina, pagina in enumerate(documento, start=1):
        texto = pagina.get_text("text").strip()

        if texto:
            paginas.append({
                "pagina": numero_pagina,
                "texto": texto
            })

    cantidad_paginas = len(documento)

    documento.close()

    return paginas, cantidad_paginas


def extraer_docx(ruta_archivo: str):
    documento = DocxDocument(ruta_archivo)

    texto = []

    for parrafo in documento.paragraphs:
        contenido = parrafo.text.strip()

        if contenido:
            texto.append(contenido)

    contenido_completo = "\n".join(texto)

    paginas = [{
        "pagina": 1,
        "texto": contenido_completo
    }]

    return paginas, 1


def extraer_texto(ruta_archivo: str, tipo_archivo: str):

    extension = Path(ruta_archivo).suffix.lower()

    if tipo_archivo == "PDF" or extension == ".pdf":
        return extraer_pdf(ruta_archivo)

    if tipo_archivo == "DOCX" or extension == ".docx":
        return extraer_docx(ruta_archivo)

    raise ValueError("Tipo de archivo no soportado.")