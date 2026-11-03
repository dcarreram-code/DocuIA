# DocuIA
### Sistema web inteligente para el análisis y consulta de documentos

DocuIA es una aplicación web que permite gestionar documentos digitales, generar análisis y realizar preguntas sobre su contenido mediante inteligencia artificial local.

El sistema utiliza procesamiento documental, recuperación semántica y generación aumentada por recuperación (RAG) para facilitar la búsqueda y comprensión de información dentro de archivos PDF y DOCX.

## Características principales

- Registro e inicio de sesión de usuarios.
- Carga y almacenamiento de documentos PDF y DOCX.
- Procesamiento y extracción de texto.
- División del contenido en fragmentos y generación de embeddings.
- Generación de resúmenes y puntos importantes.
- Consulta de documentos mediante inteligencia artificial (RAG).
- Historial de análisis y versiones.
- Historial de conversaciones.
- Visualización de documentos PDF dentro de la aplicación.
- Almacenamiento de información en SQL Server y ChromaDB.

## Tecnologías utilizadas

| Componente | Tecnología |
|---|---|
| Frontend | React + Vite |
| Comunicación HTTP | Axios |
| Visor PDF | React-PDF |
| Backend | Python + FastAPI |
| ORM | SQLAlchemy |
| Base de datos relacional | Microsoft SQL Server |
| Base de datos vectorial | ChromaDB |
| Embeddings | Sentence Transformers |
| Modelo de IA | Qwen3:4b |
| Ejecución del modelo | Ollama |
| Contenedores | Docker Compose |

## Arquitectura general

DocuIA utiliza una arquitectura cliente-servidor:

1. React presenta la interfaz y consume los servicios REST.
2. FastAPI administra la autenticación, documentos y operaciones del sistema.
3. SQL Server almacena usuarios, documentos, análisis, conversaciones y mensajes.
4. Los archivos originales se almacenan en el directorio de cargas del backend.
5. Sentence Transformers genera embeddings de los fragmentos documentales.
6. ChromaDB almacena los vectores para la recuperación semántica.
7. Ollama ejecuta Qwen3:4b para generar análisis y respuestas.

## Estructura del proyecto

```text
DocuIA/
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── models/
│   │   ├── services/
│   │   └── ...
│   ├── uploads/
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── database/
│   └── Scripts SQL
│
├── docs/
│   ├── Documento_Tecnico_DocuIA.pdf
│   └── Diagramas UML/
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Requisitos previos

Antes de ejecutar DocuIA, se necesita:

- Windows 10/11 o un sistema operativo compatible.
- Python 3.10 o superior, compatible con las dependencias del proyecto.
- Node.js y npm.
- Microsoft SQL Server.
- Docker Desktop con Docker Compose.
- Ollama.
- Acceso a los archivos de configuración y scripts SQL del proyecto.

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone URL_DEL_REPOSITORIO
cd DocuIA
```

### 2. Configurar variables de entorno

Crear el archivo `.env` tomando como referencia `.env.example`.

Configurar los datos de conexión a SQL Server, la clave de autenticación y los parámetros de los servicios utilizados.

No compartir ni publicar el archivo `.env` real.

### 3. Preparar la base de datos

1. Iniciar SQL Server.
2. Crear la base de datos `DocuIA_DB`.
3. Ejecutar los scripts SQL incluidos en el directorio `database`.
4. Configurar las credenciales de conexión utilizadas por el backend.

### 4. Iniciar Ollama

Iniciar el servicio mediante Docker Compose:

```bash
docker compose up -d
```

Descargar el modelo utilizado por DocuIA:

```bash
ollama pull qwen3:4b
```

Verificar que el servicio de Ollama esté disponible en:

```text
http://localhost:11434
```

### 5. Configurar el backend

Abrir una terminal en el directorio del backend:

```bash
cd backend
```

Crear un entorno virtual:

```bash
python -m venv venv
```

Activarlo en Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Instalar las dependencias:

```bash
pip install -r requirements.txt
```

Iniciar el servidor:

```bash
uvicorn app.main:app --reload
```

La documentación interactiva de la API estará disponible en:

```text
http://127.0.0.1:8000/docs
```

### 6. Configurar el frontend

Abrir otra terminal:

```bash
cd frontend
```

Instalar las dependencias:

```bash
npm install
```

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en:

```text
http://localhost:5173
```

## Flujo principal de funcionamiento

1. El usuario se registra e inicia sesión.
2. Carga un documento PDF o DOCX.
3. El backend valida y almacena el archivo.
4. El usuario solicita procesar el documento.
5. El sistema extrae el texto, genera fragmentos y crea embeddings.
6. Los vectores se almacenan en ChromaDB.
7. El usuario puede generar un análisis documental.
8. El usuario realiza preguntas sobre el documento.
9. El sistema recupera fragmentos relevantes y genera una respuesta mediante Qwen3:4b.
10. Las conversaciones y los análisis se conservan para consultas posteriores.

## Endpoints principales

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/auth/register` | Registro |
| POST | `/auth/login` | Inicio de sesión |
| GET | `/documents/` | Listado de documentos |
| POST | `/documents/upload` | Carga documental |
| POST | `/documents/{id}/process` | Procesamiento |
| POST | `/documents/{id}/analyze` | Análisis documental |
| GET | `/documents/{id}/analysis` | Consulta de análisis |
| GET | `/documents/{id}/view` | Visualización PDF |
| POST | `/ai/documents/{id}/question` | Consulta RAG |
| GET | `/ai/conversations` | Historial de conversaciones |

## Seguridad

- Las operaciones documentales requieren autenticación.
- Los documentos se asocian al usuario que los carga.
- Los endpoints verifican la propiedad de los recursos.
- Las credenciales se administran mediante variables de entorno.
- Los archivos originales, entornos virtuales, dependencias instaladas y datos persistentes locales no deben publicarse en el repositorio.

## Limitaciones y consideraciones

- La carga admite archivos PDF y DOCX de hasta 10 MB, según la configuración implementada.
- El visor integrado está destinado a documentos PDF.
- Las consultas requieren que el documento haya sido procesado.
- La generación de respuestas depende de la disponibilidad del modelo local y de los servicios asociados.
- La configuración incluida corresponde al entorno de desarrollo. Una instalación productiva requiere configuración adicional de infraestructura y seguridad.

## Autor

**David Oswaldo Carrera Mérida**

Universidad Mariano Gálvez de Guatemala  
Curso: Análisis de Sistemas II  
Docente: Ing. Edgar Raúl Molina Rey  
Año: 2026

## Proyecto académico

DocuIA fue desarrollado como proyecto académico con el propósito de integrar desarrollo web, gestión de bases de datos, procesamiento documental e inteligencia artificial local.