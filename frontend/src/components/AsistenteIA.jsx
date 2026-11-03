
import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

import { preguntarDocumento } from "../services/documentos";

import {
  obtenerConversaciones,
  obtenerConversacion,
} from "../services/ia";

function AsistenteIA({ documents = [] }) {
  const documentosProcesados = documents.filter(
    (documento) => documento.status === "Procesado"
  );

  const [documentId, setDocumentId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Cargar el historial del usuario.
  const cargarHistorial = useCallback(async () => {
    setLoadingHistory(true);

    try {
      const resultado = await obtenerConversaciones();
      setConversations(resultado);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "No fue posible cargar el historial."
      );
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  // Enviar pregunta al asistente.
  async function handleSubmit(event) {
    event.preventDefault();

    const pregunta = question.trim();

    if (!pregunta || !documentId || sending) return;

    const userMessage = {
      role: "user",
      content: pregunta,
    };

    setMessages((previous) => [...previous, userMessage]);
    setQuestion("");
    setSending(true);
    setError("");

    try {
      const resultado = await preguntarDocumento(
        Number(documentId),
        pregunta,
        conversationId
      );

      setConversationId(resultado.id_conversacion);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: resultado.respuesta,
          sources: resultado.fuentes || [],
        },
      ]);

      // Actualizar el historial después de guardar la conversación.
      await cargarHistorial();

    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "No fue posible obtener una respuesta del asistente."
      );
    } finally {
      setSending(false);
    }
  }

  // Recuperar una conversación anterior.
  async function seleccionarConversacion(conversacion) {
    if (loadingConversation || sending) return;

    setLoadingConversation(true);
    setError("");
    setMessages([]);

    try {
      const resultado = await obtenerConversacion(conversacion.id);

      const conversacionRecuperada = resultado.conversacion;

      setConversationId(conversacionRecuperada.id);
      setDocumentId(String(conversacionRecuperada.documento_id));

      const mensajesRecuperados = resultado.mensajes.map((mensaje) => ({
        id: mensaje.id,
        role:
          mensaje.tipo === "USER"
            ? "user"
            : "assistant",
        content: mensaje.contenido,
        sources: [],
      }));

      setMessages(mensajesRecuperados);

    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "No fue posible recuperar esta conversación."
      );

      setConversationId(null);
      setMessages([]);
    } finally {
      setLoadingConversation(false);
    }
  }

  // Crear conversación nueva.
  function nuevaConversacion() {
    setMessages([]);
    setConversationId(null);
    setQuestion("");
    setError("");
  }

  // Cambiar documento.
  function handleDocumentChange(event) {
    setDocumentId(event.target.value);
    setMessages([]);
    setConversationId(null);
    setQuestion("");
    setError("");
  }

  function formatearFecha(fecha) {
    if (!fecha) return "";

    return new Date(fecha).toLocaleString("es-GT", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <section className="ai-workspace">

      {/* ENCABEZADO */}
      <div className="ai-header">
        <div>
          <span className="eyebrow">DOCUIA INTELLIGENCE</span>
          <h2>Asistente inteligente</h2>
          <p>
            Haz preguntas y descubre información dentro de tus documentos.
          </p>
        </div>

        <button
          type="button"
          className="button-secondary"
          onClick={nuevaConversacion}
          disabled={sending || loadingConversation}
        >
          ＋ Nueva conversación
        </button>
      </div>

      {/* SELECTOR DE DOCUMENTO */}
      <div className="ai-document-selector">
        <div>
          <label htmlFor="ai-document">
            Documento de consulta
          </label>

          <p>Selecciona el documento con el que deseas conversar.</p>
        </div>

        <select
          id="ai-document"
          value={documentId}
          onChange={handleDocumentChange}
          disabled={sending || loadingConversation}
        >
          <option value="">Seleccionar documento...</option>

          {documentosProcesados.map((documento) => (
            <option key={documento.id} value={documento.id}>
              {documento.name}
            </option>
          ))}
        </select>
      </div>

      {documentosProcesados.length === 0 ? (
        <div className="ai-empty">
          <div className="assistant-symbol">✳</div>
          <h3>No tienes documentos procesados</h3>
          <p>
            Primero carga y procesa un documento para poder consultarlo
            mediante inteligencia artificial.
          </p>
        </div>
      ) : (

        /* CONTENEDOR DEL CHAT */
        <div className="ai-chat-layout">

          {/* HISTORIAL LATERAL */}
          <aside className="ai-history-panel">

            <div className="ai-history-header">
              <div>
                <h3>Conversaciones</h3>
                <p>Tu historial de consultas</p>
              </div>

              <span>{conversations.length}</span>
            </div>

            <button
              type="button"
              className="ai-new-chat"
              onClick={nuevaConversacion}
              disabled={sending || loadingConversation}
            >
              ＋ Nueva conversación
            </button>

            <div className="ai-history-list">

              {loadingHistory ? (
                <p className="ai-history-empty">
                  Cargando conversaciones...
                </p>
              ) : conversations.length === 0 ? (
                <p className="ai-history-empty">
                  Todavía no tienes conversaciones guardadas.
                </p>
              ) : (
                conversations.map((conversacion) => (
                  <button
                    type="button"
                    key={conversacion.id}
                    className={`ai-history-item ${
                      conversationId === conversacion.id
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      seleccionarConversacion(conversacion)
                    }
                    disabled={sending || loadingConversation}
                  >
                    <span className="ai-history-icon">▤</span>

                    <span className="ai-history-info">
                      <strong>{conversacion.titulo}</strong>

                      <small>
                        {conversacion.documento_nombre}
                      </small>

                      <small>
                        {formatearFecha(
                          conversacion.fecha_actualizacion
                        )}
                      </small>
                    </span>
                  </button>
                ))
              )}

            </div>
          </aside>

          {/* CHAT PRINCIPAL */}
          <div className="ai-chat">

            <div className="ai-chat-messages">

              {loadingConversation ? (
                <div className="ai-welcome">
                  <div className="analysis-spinner" />
                  <h3>Recuperando conversación</h3>
                  <p>Estamos cargando tus mensajes anteriores.</p>
                </div>
              ) : messages.length === 0 ? (

                <div className="ai-welcome">
                  <div className="assistant-symbol">✳</div>
                  <h3>¿Qué deseas saber?</h3>

                  <p>
                    Selecciona un documento y realiza una pregunta sobre su
                    contenido.
                  </p>

                  <div className="suggested-questions">
                    <button
                      type="button"
                      disabled={!documentId}
                      onClick={() =>
                        setQuestion(
                          "¿Cuál es el tema principal del documento?"
                        )
                      }
                    >
                      ¿Cuál es el tema principal?
                    </button>

                    <button
                      type="button"
                      disabled={!documentId}
                      onClick={() =>
                        setQuestion(
                          "¿Cuáles son los puntos más importantes?"
                        )
                      }
                    >
                      ¿Cuáles son los puntos importantes?
                    </button>
                  </div>
                </div>

              ) : (

                messages.map((message, index) => (
                  <article
                    key={message.id || index}
                    className={`chat-message ${message.role}`}
                  >
                    <div className="chat-avatar">
                      {message.role === "user" ? "D" : "✳"}
                    </div>

                    <div className="chat-bubble">
                      <span className="chat-author">
                        {message.role === "user" ? "Tú" : "DocuIA"}
                      </span>

                      <div className="markdown-content">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>

                      {message.role === "assistant" &&
                        message.sources?.length > 0 && (
                          <div className="chat-sources">
                            <strong>Fuentes consultadas</strong>

                            {message.sources.map((source, index) => {
                              const pagina =
                                source.pagina ??
                                source.numero_pagina ??
                                source.page;

                              const fragmento =
                                source.fragmento ??
                                source.numero_fragmento ??
                                source.fragment;

                              return (
                                <span key={index}>
                                  Página {pagina ?? "No indicada"}
                                  {fragmento != null
                                    ? ` · Fragmento ${fragmento}`
                                    : ""}
                                </span>
                              );
                            })}
                          </div>
                        )}
                    </div>
                  </article>
                ))
              )}

              {sending && (
                <div className="chat-typing">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  DocuIA está analizando tu pregunta...
                </div>
              )}

            </div>

            {error && (
              <div className="info-banner">
                <span>⚠</span>
                <p>{error}</p>
              </div>
            )}

            {/* FORMULARIO */}
            <form className="ai-chat-form" onSubmit={handleSubmit}>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={
                  documentId
                    ? "Escribe tu pregunta sobre el documento..."
                    : "Primero selecciona un documento..."
                }
                disabled={
                  !documentId ||
                  sending ||
                  loadingConversation
                }
                rows={2}
                maxLength={2000}
              />

              <button
                type="submit"
                className="button-primary"
                disabled={
                  !documentId ||
                  !question.trim() ||
                  sending ||
                  loadingConversation
                }
              >
                {sending ? "Consultando..." : "Enviar pregunta →"}
              </button>
            </form>

            <p className="ai-disclaimer">
              DocuIA genera respuestas basadas en el contenido del documento
              seleccionado.
            </p>

          </div>
        </div>
      )}

    </section>
  );
}

export default AsistenteIA;
