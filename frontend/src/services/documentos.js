
import api from "./api";

// Obtener los documentos del usuario autenticado.
export async function obtenerDocumentos() {
  const response = await api.get("/documents/");
  return response.data.documentos;
}

// Subir un archivo PDF o DOCX al backend.
export async function subirDocumento(archivo, onProgress) {
  const formData = new FormData();
  formData.append("archivo", archivo);

  const response = await api.post("/documents/upload", formData, {
    onUploadProgress: (event) => {
      if (event.total && onProgress) {
        const porcentaje = Math.round(
          (event.loaded * 100) / event.total
        );

        onProgress(porcentaje);
      }
    },
  });

  return response.data.documento;
}

// Procesar un documento ya cargado.
export async function procesarDocumento(idDocumento) {
  const response = await api.post(
    `/documents/${idDocumento}/process`
  );

  return response.data.documento;
}

// Analizar un documento procesado con IA.

export async function analizarDocumento(idDocumento, regenerar = false) {
  const response = await api.post(
    `/documents/${idDocumento}/analyze`,
    null,
    {
      params: { regenerar },
    }
  );

  return response.data.analisis;
}




// Realizar una pregunta sobre un documento mediante IA.
export async function preguntarDocumento(
  idDocumento,
  pregunta,
  idConversacion = null
) {
  const response = await api.post(
    `/ai/documents/${idDocumento}/question`,
    {
      pregunta,
      id_conversacion: idConversacion,
    }
  );

  return response.data;
}



// Recuperar el análisis guardado de un documento.
export async function obtenerAnalisis(idDocumento) {
  const response = await api.get(
    `/documents/${idDocumento}/analysis`
  );

  return response.data;
}



// Obtener todas las versiones del análisis de un documento.
export async function obtenerHistorialAnalisis(idDocumento) {
  const response = await api.get(
    `/documents/${idDocumento}/analysis/history`
  );

  return response.data.historial;
}

// Obtener el contenido completo de una versión específica.
export async function obtenerVersionAnalisis(
  idDocumento,
  idAnalisis
) {
  const response = await api.get(
    `/documents/${idDocumento}/analysis/version/${idAnalisis}`
  );

  return response.data.analisis;
}


export async function obtenerPdf(idDocumento) {
  const response = await api.get(
    `/documents/${idDocumento}/view`,
    {
      responseType: "blob",
    }
  );

  return response.data;
}