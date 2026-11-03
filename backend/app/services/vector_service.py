import chromadb

from app.services.embeddings_service import generar_embeddings


# Cliente local de ChromaDB
cliente_chroma = chromadb.PersistentClient(
    path="chroma_data"
)


# Colección donde almacenamos los fragmentos
coleccion_documentos = cliente_chroma.get_or_create_collection(
    name="documentos"
)


def eliminar_fragmentos_documento(id_documento: int):
    """
    Elimina de ChromaDB todos los fragmentos
    pertenecientes a un documento.
    """

    coleccion_documentos.delete(
        where={
            "id_documento": id_documento
        }
    )


def guardar_fragmentos(
    id_documento: int,
    fragmentos: list
):
    """
    Genera embeddings y guarda los fragmentos
    de un documento en ChromaDB.
    """

    if not fragmentos:
        return 0

    textos = [
        fragmento.Contenido
        for fragmento in fragmentos
    ]

    embeddings = generar_embeddings(textos)

    ids = [
        f"documento_{id_documento}_fragmento_{fragmento.IdFragmento}"
        for fragmento in fragmentos
    ]

    metadatos = [
        {
            "id_documento": id_documento,
            "id_fragmento": fragmento.IdFragmento,
            "numero_fragmento": fragmento.NumeroFragmento,
            "numero_pagina": fragmento.NumeroPagina
        }
        for fragmento in fragmentos
    ]

    coleccion_documentos.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=textos,
        metadatas=metadatos
    )

    return len(fragmentos)


def buscar_fragmentos(
    pregunta: str,
    id_documento: int,
    cantidad: int = 5
):
    """
    Busca los fragmentos más relacionados
    con una pregunta dentro de un documento.
    """

    embedding_pregunta = generar_embeddings(
        [pregunta]
    )[0]

    resultados = coleccion_documentos.query(
        query_embeddings=[embedding_pregunta],
        n_results=cantidad,
        where={
            "id_documento": id_documento
        }
    )

    return resultados