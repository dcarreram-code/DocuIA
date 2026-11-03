# DocuIA

**Sistema web de análisis y consulta inteligente de documentos mediante inteligencia artificial.**

## Descripción

DocuIA es una aplicación web que permite cargar documentos PDF y Word, procesar su contenido, generar resúmenes y puntos importantes, y realizar preguntas sobre la información mediante inteligencia artificial local.

El sistema utiliza técnicas de recuperación aumentada por generación (RAG) para recuperar fragmentos relevantes del documento y proporcionar contexto a las respuestas de la IA.

## Funcionalidades principales

- Registro e inicio de sesión de usuarios.
- Carga y administración de documentos PDF y DOCX.
- Extracción y procesamiento del contenido documental.
- Generación de resúmenes y puntos importantes.
- Historial de análisis y versiones.
- Consulta de documentos mediante un asistente de IA.
- Recuperación de fragmentos relevantes mediante RAG.
- Historial de conversaciones.
- Visualización de documentos PDF desde la aplicación.

## Tecnologías utilizadas

| Componente | Tecnología |
|---|---|
| Frontend | React y Vite |
| Backend | Python y FastAPI |
| Base de datos | Microsoft SQL Server |
| Inteligencia artificial | Ollama y Qwen3 |
| Embeddings | Sentence Transformers |
| Base vectorial | ChromaDB |
| Contenedores | Docker |

## Arquitectura general

DocuIA utiliza una arquitectura cliente-servidor:

1. El frontend permite interactuar con los documentos y el asistente.
2. El backend administra la autenticación, documentos y consultas.
3. SQL Server almacena la información del sistema.
4. ChromaDB almacena los fragmentos vectorizados.
5. Ollama ejecuta el modelo de inteligencia artificial localmente.

## Requisitos

- Python 3.
- Node.js y npm.
- Microsoft SQL Server.
- Docker Desktop.
- Ollama.
- Modelo Qwen3 configurado en Ollama.

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone URL_DEL_REPOSITORIO
cd DocuIA
```

### 2. Configurar el backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Configurar las variables de entorno necesarias tomando como referencia `.env.example`.

### 3. Iniciar Ollama

Desde la raíz del proyecto:

```bash
docker compose up -d
```

Comprobar que el contenedor esté funcionando:

```bash
docker ps
```

### 4. Ejecutar el backend

Desde la carpeta `backend`, con el entorno virtual activado:

```bash
uvicorn app.main:app --reload
```

Documentación de la API:

http://127.0.0.1:8000/docs

### 5. Ejecutar el frontend

En otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

Abrir la dirección que indique Vite, normalmente:

http://localhost:5173

## Seguridad

- Las credenciales y claves privadas deben mantenerse en variables de entorno.
- No publicar archivos `.env`.
- No incluir contraseñas, tokens ni información personal en el repositorio.
- Los archivos de configuración sensibles deben mantenerse fuera del control de versiones.

## Autor

**David Oswaldo Carrera Mérida**

Proyecto académico – 2026.