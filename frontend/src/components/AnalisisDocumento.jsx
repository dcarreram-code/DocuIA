
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

import {
  analizarDocumento,
  obtenerAnalisis,
  obtenerHistorialAnalisis,
  obtenerVersionAnalisis,
} from "../services/documentos";

function AnalisisDocumento({ documents = [] }) {
  const documentosProcesados = documents.filter((documento) => {
    const estado = documento.status || documento.estado;
    return estado?.toUpperCase() === "PROCESADO";
  });

  const [documentId, setDocumentId] = useState("");
  const [analisis, setAnalisis] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [versionSeleccionada, setVersionSeleccionada] = useState(null);

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Cargar análisis e historial al seleccionar documento.
  useEffect(() => {
    if (!documentId) {
      setAnalisis(null);
      setHistorial([]);
      setVersionSeleccionada(null);
      return;
    }

    let cancelled = false;

    async function cargarDatos() {
      setLoading(true);
      setAnalisis(null);
      setHistorial([]);
      setVersionSeleccionada(null);
      setError("");
      setNotice("");

      try {
        const [resultado, versiones] = await Promise.all([
          obtenerAnalisis(Number(documentId)),
          obtenerHistorialAnalisis(Number(documentId)),
        ]);

        if (cancelled) return;

        setHistorial(versiones);

        if (resultado.exists && resultado.analisis) {
          setAnalisis(resultado.analisis);
          setVersionSeleccionada(resultado.analisis.id);
          setNotice("Se recuperó el análisis guardado.");
        } else {
          setNotice(
            "Este documento todavía no tiene un análisis."
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.detail ||
              "No fue posible recuperar la información."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    cargarDatos();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  // Seleccionar una versión anterior.
  async function seleccionarVersion(idAnalisis) {
    if (!documentId || loading || generating) return;

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const resultado = await obtenerVersionAnalisis(
        Number(documentId),
        Number(idAnalisis)
      );

      setAnalisis(resultado);
      setVersionSeleccionada(resultado.id);
      setNotice(`Se está visualizando el análisis #${resultado.id}.`);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "No fue posible recuperar esta versión."
      );
    } finally {
      setLoading(false);
    }
  }

  // Generar o regenerar análisis.
  async function generarAnalisis(regenerar = false) {
    if (!documentId || generating || loading) return;

    setGenerating(true);
    setError("");
    setNotice(
      regenerar
        ? "Generando una nueva versión del análisis..."
        : "Analizando el documento..."
    );

    try {
      const resultado = await analizarDocumento(
        Number(documentId),
        regenerar
      );

      setAnalisis(resultado);
      setVersionSeleccionada(resultado.id);

      const versiones = await obtenerHistorialAnalisis(
        Number(documentId)
      );

      setHistorial(versiones);

      setNotice("Análisis generado correctamente.");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "No fue posible generar el análisis."
      );
    } finally {
      setGenerating(false);
    }
  }

  function cambiarDocumento(event) {
    setDocumentId(event.target.value);
    setAnalisis(null);
    setHistorial([]);
    setVersionSeleccionada(null);
    setError("");
    setNotice("");
  }

  function formatearFecha(fecha) {
    if (!fecha) return "No disponible";

    return new Date(fecha).toLocaleString("es-GT", {
      dateStyle: "long",
      timeStyle: "short",
    });
  }

  const esVersionMasReciente =
    historial.length > 0 &&
    Number(versionSeleccionada) === Number(historial[0].id);

  return (
    <section className="analysis-workspace">
      {/* ENCABEZADO */}
      <div className="analysis-header">
        <div>
          <span className="eyebrow">DOCUIA INTELLIGENCE</span>
          <h2>Análisis documental</h2>
          <p>
            Comprende tus documentos mediante resúmenes e inteligencia
            artificial.
          </p>
        </div>
      </div>

      {/* SELECTOR */}
      <div className="analysis-selector">
        <div className="analysis-selector-info">
          <label htmlFor="analysis-document">
            Selecciona un documento
          </label>
          <p>
            Elige un documento procesado para consultar su análisis.
          </p>
        </div>

        <select
          id="analysis-document"
          value={documentId}
          onChange={cambiarDocumento}
          disabled={loading || generating}
        >
          <option value="">Seleccionar documento...</option>

          {documentosProcesados.map((documento) => (
            <option key={documento.id} value={documento.id}>
              {documento.name || documento.nombre_original}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="button-primary"
          onClick={() =>
            generarAnalisis(Boolean(analisis))
          }
          disabled={!documentId || loading || generating}
        >
          {generating
            ? "Analizando..."
            : analisis
              ? "↻ Regenerar análisis"
              : "✳ Generar análisis"}
        </button>
      </div>

      {/* DOCUMENTOS VACÍOS */}
      {documentosProcesados.length === 0 && (
        <div className="analysis-empty">
          <h3>No hay documentos procesados</h3>
          <p>
            Primero carga y procesa un documento desde tu biblioteca.
          </p>
        </div>
      )}

      {/* CARGA */}
      {loading && (
        <div className="analysis-loading">
          <div className="analysis-spinner" />
          <h3>Consultando información</h3>
          <p>Recuperando el análisis y sus versiones.</p>
        </div>
      )}

      {generating && (
        <div className="analysis-loading">
          <div className="analysis-spinner" />
          <h3>DocuIA está analizando tu documento</h3>
          <p>
            La inteligencia artificial está preparando los resultados.
          </p>
        </div>
      )}

      {/* MENSAJES */}
      {notice && !loading && !generating && (
        <div className="info-banner">
          <span>✓</span>
          <p>{notice}</p>
        </div>
      )}

      {error && (
        <div className="analysis-error">
          <strong>No se pudo completar la operación</strong>
          <p>{error}</p>
        </div>
      )}

      {/* HISTORIAL */}
      {documentId && historial.length > 0 && !loading && (
        <article className="analysis-content-card">
          <div className="analysis-card-title">
            <span className="analysis-icon">◷</span>
            <div>
              <h3>Historial de análisis</h3>
              <p>
                {historial.length} versión(es) guardada(s).
                Selecciona una para consultar su contenido.
              </p>
            </div>
          </div>

          <div className="analysis-history">
            {historial.map((version, index) => (
              <button
                type="button"
                key={version.id}
                className={`analysis-history-item ${
                  Number(versionSeleccionada) === Number(version.id)
                    ? "active"
                    : ""
                }`}
                onClick={() => seleccionarVersion(version.id)}
                disabled={loading || generating}
              >
                <span className="history-icon">▤</span>

                <span className="history-information">
                  <strong>Análisis #{version.id}</strong>
                  <small>{formatearFecha(version.fecha)}</small>
                  <small>Modelo: {version.modelo}</small>
                </span>

                {index === 0 && (
                  <span className="analysis-status">
                    Más reciente
                  </span>
                )}

                {Number(versionSeleccionada) === Number(version.id) && (
                  <span className="history-selected">✓</span>
                )}
              </button>
            ))}
          </div>
        </article>
      )}

      {/* RESULTADOS */}
      {analisis && !loading && (
        <div className="analysis-results">
          <div className="analysis-result-header">
            <div>
              <span className="eyebrow">RESULTADO DEL ANÁLISIS</span>
              <h3>
                Análisis #{analisis.id}
              </h3>
            </div>

            <span className="analysis-status">
              ✓ {esVersionMasReciente
                ? "ÚLTIMA VERSIÓN"
                : "VERSIÓN ANTERIOR"}
            </span>
          </div>

          {/* METADATOS */}
          <div className="analysis-metadata">
            <div className="metadata-card">
              <span>Modelo de IA</span>
              <strong>{analisis.modelo}</strong>
            </div>

            <div className="metadata-card">
              <span>Documento</span>
              <strong>#{analisis.documento_id}</strong>
            </div>

            <div className="metadata-card">
              <span>Fecha de análisis</span>
              <strong>{formatearFecha(analisis.fecha)}</strong>
            </div>
          </div>

          {/* RESUMEN */}
          <article className="analysis-content-card">
            <div className="analysis-card-title">
              <span className="analysis-icon">▤</span>
              <div>
                <h3>Resumen ejecutivo</h3>
                <p>Síntesis del contenido del documento.</p>
              </div>
            </div>

            <div className="markdown-content">
              <ReactMarkdown>
                {analisis.resumen || "No hay resumen disponible."}
              </ReactMarkdown>
            </div>
          </article>

          {/* PUNTOS IMPORTANTES */}
          <article className="analysis-content-card">
            <div className="analysis-card-title">
              <span className="analysis-icon">✳</span>
              <div>
                <h3>Puntos importantes</h3>
                <p>Ideas y aspectos destacados del documento.</p>
              </div>
            </div>

            <div className="markdown-content">
              <ReactMarkdown>
                {analisis.puntos_importantes ||
                  "No hay puntos importantes disponibles."}
              </ReactMarkdown>
            </div>
          </article>

          <p className="analysis-disclaimer">
            Análisis generado mediante {analisis.modelo}. Verifica
            siempre la información con el documento original.
          </p>
        </div>
      )}
    </section>
  );
}

export default AnalisisDocumento;
