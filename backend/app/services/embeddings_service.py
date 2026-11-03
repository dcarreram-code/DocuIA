from sentence_transformers import SentenceTransformer


# Modelo local para generar embeddings
MODELO_EMBEDDINGS = "all-MiniLM-L6-v2"

modelo_embeddings = SentenceTransformer(MODELO_EMBEDDINGS)


def generar_embedding(texto: str):
    """
    Convierte un texto en un vector numérico.
    """
    return modelo_embeddings.encode(
        texto,
        normalize_embeddings=True
    ).tolist()


def generar_embeddings(textos: list[str]):
    """
    Convierte varios textos en vectores numéricos.
    """
    return modelo_embeddings.encode(
        textos,
        normalize_embeddings=True
    ).tolist()