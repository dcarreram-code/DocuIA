
import api from "./api";

// Obtener todas las conversaciones del usuario.
export async function obtenerConversaciones() {
  const response = await api.get("/ai/conversations");
  return response.data.conversaciones;
}

// Obtener una conversación con todos sus mensajes.
export async function obtenerConversacion(idConversacion) {
  const response = await api.get(
    `/ai/conversations/${idConversacion}`
  );

  return response.data;
}

// Obtener solamente los mensajes de una conversación.
export async function obtenerMensajes(idConversacion) {
  const response = await api.get(
    `/ai/conversations/${idConversacion}/messages`
  );

  return response.data.mensajes;
}
