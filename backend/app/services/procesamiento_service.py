from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.documento import Documento
from app.models.fragmento_documento import FragmentoDocumento

from app.services.procesador_documento import extraer_texto
from app.services.vector_service import (
    eliminar_fragmentos_documento,
    guardar_fragmentos
)


TAMANO_FRAGMENTO = 1200


def dividir_texto(texto, tamano=TAMANO_FRAGMENTO):

    fragmentos = []
    inicio = 0

    while inicio < len(texto):

        fin = inicio + tamano

        fragmento = texto[inicio:fin].strip()

        if fragmento:
            fragmentos.append(fragmento)

        inicio = fin

    return fragmentos


def procesar_documento(
    db: Session,
    id_documento: int
):

    documento = db.scalar(
        select(Documento).where(
            Documento.IdDocumento == id_documento
        )
    )

    if not documento:
        raise ValueError(
            "Documento no encontrado."
        )

    try:

        # ==================================================
        # 1. Marcar como procesando
        # ==================================================

        documento.Estado = "PROCESANDO"

        db.commit()


        # ==================================================
        # 2. Extraer texto
        # ==================================================

        paginas, cantidad_paginas = extraer_texto(
            documento.RutaArchivo,
            documento.TipoArchivo
        )

        if not paginas:

            raise ValueError(
                "No se encontró texto en el documento."
            )


        # ==================================================
        # 3. Eliminar fragmentos anteriores de SQL Server
        # ==================================================

        db.query(
            FragmentoDocumento
        ).filter(
            FragmentoDocumento.IdDocumento == id_documento
        ).delete()

        db.commit()


        # ==================================================
        # 4. Crear nuevos fragmentos
        # ==================================================

        nuevos_fragmentos = []

        numero_fragmento = 1

        for pagina in paginas:

            fragmentos = dividir_texto(
                pagina["texto"]
            )

            for contenido in fragmentos:

                nuevo_fragmento = FragmentoDocumento(
                    IdDocumento=id_documento,
                    NumeroFragmento=numero_fragmento,
                    NumeroPagina=pagina["pagina"],
                    Contenido=contenido
                )

                db.add(nuevo_fragmento)

                nuevos_fragmentos.append(
                    nuevo_fragmento
                )

                numero_fragmento += 1


        # ==================================================
        # 5. Guardar fragmentos en SQL Server
        # ==================================================

        db.commit()


        # ==================================================
        # 6. Obtener IDs generados
        # ==================================================

        for fragmento in nuevos_fragmentos:

            db.refresh(fragmento)


        # ==================================================
        # 7. Eliminar embeddings anteriores
        # ==================================================

        eliminar_fragmentos_documento(
            id_documento
        )


        # ==================================================
        # 8. Generar y guardar embeddings
        # ==================================================

        cantidad_embeddings = guardar_fragmentos(
            id_documento,
            nuevos_fragmentos
        )


        # ==================================================
        # 9. Actualizar documento
        # ==================================================

        documento.CantidadPaginas = cantidad_paginas

        documento.Estado = "PROCESADO"

        db.commit()

        db.refresh(documento)


        print(
            f"Documento {id_documento}: "
            f"{len(nuevos_fragmentos)} fragmentos SQL Server, "
            f"{cantidad_embeddings} embeddings ChromaDB."
        )


        return documento


    except Exception:

        db.rollback()

        documento.Estado = "ERROR"

        db.commit()

        raise