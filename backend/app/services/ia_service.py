import requests

from app.core.config import settings


def consultar_ollama(
    prompt: str
) -> str:

    url = f"{settings.OLLAMA_BASE_URL}/api/chat"

    payload = {
        "model": settings.OLLAMA_MODEL,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "stream": False
    }

    try:

        respuesta = requests.post(
            url,
            json=payload,
            timeout=120
        )

        respuesta.raise_for_status()

        datos = respuesta.json()

        return datos["message"]["content"]

    except requests.exceptions.Timeout:
        raise ValueError(
            "El modelo de IA tardó demasiado en responder."
        )

    except requests.exceptions.ConnectionError:
        raise ValueError(
            "No se pudo conectar con el servicio de IA."
        )

    except requests.exceptions.RequestException:
        raise ValueError(
            "Ocurrió un error al comunicarse con el servicio de IA."
        )