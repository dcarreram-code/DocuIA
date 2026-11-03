
import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { obtenerPdf } from "../services/documentos";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./PdfViewer.css";

// Configuración del trabajador PDF para Vite
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function PdfViewer({ documento, onClose }) {
  const [archivo, setArchivo] = useState(null);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarPdf() {
      try {
        setCargando(true);
        setError("");
        setArchivo(null);
        setPagina(1);
        setTotalPaginas(0);

        const blob = await obtenerPdf(documento.id);

        if (activo) {
          setArchivo(blob);
        }
      } catch (err) {
        console.error("Error al cargar PDF:", err);

        if (activo) {
          setError("No fue posible cargar el documento PDF.");
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarPdf();

    return () => {
      activo = false;
    };
  }, [documento.id]);

  function anteriorPagina() {
    setPagina((actual) => Math.max(1, actual - 1));
  }

  function siguientePagina() {
    setPagina((actual) => Math.min(totalPaginas, actual + 1));
  }

  function reducirZoom() {
    setZoom((actual) => Math.max(0.5, actual - 0.1));
  }

  function aumentarZoom() {
    setZoom((actual) => Math.min(2, actual + 0.1));
  }

  return (
    <div className="pdf-overlay">
      <div className="pdf-modal">

        <div className="pdf-header">
          <div className="pdf-title">
            <span className="pdf-icon">📄</span>
            <div>
              <h2>Visor de documentos</h2>
              <p>{documento.nombre}</p>
            </div>
          </div>

          <button
            className="pdf-close"
            onClick={onClose}
            title="Cerrar visor"
          >
            ✕
          </button>
        </div>

        <div className="pdf-toolbar">

          <div className="pdf-controls">
            <button
              onClick={anteriorPagina}
              disabled={pagina <= 1 || cargando}
            >
              ←
            </button>

            <span>
              Página {pagina} de {totalPaginas || "—"}
            </span>

            <button
              onClick={siguientePagina}
              disabled={pagina >= totalPaginas || cargando}
            >
              →
            </button>
          </div>

          <div className="pdf-controls">
            <button onClick={reducirZoom} disabled={zoom <= 0.5}>
              −
            </button>

            <span>{Math.round(zoom * 100)}%</span>

            <button onClick={aumentarZoom} disabled={zoom >= 2}>
              +
            </button>
          </div>

        </div>

        <div className="pdf-content">

          {cargando && (
            <div className="pdf-message">
              Cargando documento...
            </div>
          )}

          {error && (
            <div className="pdf-error">
              {error}
            </div>
          )}

          {archivo && !error && (
            <Document
              file={archivo}
              onLoadSuccess={({ numPages }) => {
                setTotalPaginas(numPages);
                setPagina(1);
              }}
              onLoadError={(err) => {
                console.error("Error interpretando PDF:", err);
                setError("No se pudo interpretar el archivo PDF.");
              }}
              loading="Preparando PDF..."
            >
              <Page
                pageNumber={pagina}
                scale={zoom}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          )}

        </div>

        <div className="pdf-footer">
          <span>
            {totalPaginas > 0
              ? `${totalPaginas} páginas`
              : "Documento PDF"}
          </span>

          <button onClick={onClose}>
            Cerrar visor
          </button>
        </div>

      </div>
    </div>
  );
}

export default PdfViewer;
