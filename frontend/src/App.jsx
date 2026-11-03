

import { useEffect, useState } from "react";

import "./App.css";



import AsistenteIA from "./components/AsistenteIA";

import AnalisisDocumento from "./components/AnalisisDocumento";

import Auth from "./components/Auth";



import { obtenerSesion, cerrarSesion } from "./services/auth";

import PdfViewer from "./components/PdfViewer";

import {

  obtenerDocumentos,

  subirDocumento,

  procesarDocumento,

} from "./services/documentos";



// Convertir los datos recibidos de FastAPI.

function formatearDocumentos(datos) {

  return datos.map((doc) => ({

    id: doc.id,

    name: doc.nombre_original,

    type: doc.tipo,

    status:

      doc.estado === "PROCESADO"

        ? "Procesado"

        : doc.estado === "PENDIENTE"

          ? "Pendiente"

          : doc.estado,

    date: doc.fecha_carga

      ? new Date(doc.fecha_carga).toLocaleDateString("es-GT")

      : "Sin fecha",

    pages: doc.paginas,

    size: doc.tamano_bytes,

  }));

}



function App() {

  const [activeSection, setActiveSection] = useState("Inicio");

  const [selectedPdf, setSelectedPdf] = useState(null);

  const [documents, setDocuments] = useState([]);

  const [documentsLoading, setDocumentsLoading] = useState(false);

  const [documentsError, setDocumentsError] = useState("");



  const [search, setSearch] = useState("");

  const [usuario, setUsuario] = useState(undefined);



  // Estados de carga de archivos.

  const [uploading, setUploading] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);

  const [uploadMessage, setUploadMessage] = useState("");

  const [uploadError, setUploadError] = useState("");



  // Estados de procesamiento.

  const [processingId, setProcessingId] = useState(null);

  const [processMessage, setProcessMessage] = useState("");

  const [processError, setProcessError] = useState("");



  // Recuperar sesión del usuario.

  useEffect(() => {

    let cancelled = false;



    obtenerSesion()

      .then((user) => {

        if (!cancelled) setUsuario(user);

      })

      .catch(() => {

        if (!cancelled) setUsuario(null);

      });



    return () => {

      cancelled = true;

    };

  }, []);



  // Consultar documentos reales.

  useEffect(() => {

    if (!usuario) {

      setDocuments([]);

      return;

    }



    let cancelled = false;



    async function cargarDocumentos() {

      setDocumentsLoading(true);

      setDocumentsError("");



      try {

        const datos = await obtenerDocumentos();



        if (!cancelled) {

          setDocuments(formatearDocumentos(datos));

        }

      } catch (error) {

        if (!cancelled) {

          setDocumentsError(

            error.response?.data?.detail ||

              "No fue posible cargar los documentos."

          );

        }

      } finally {

        if (!cancelled) {

          setDocumentsLoading(false);

        }

      }

    }



    cargarDocumentos();



    return () => {

      cancelled = true;

    };

  }, [usuario]);



  // Buscar documentos.

  const filteredDocuments = documents.filter((document) =>

    document.name.toLowerCase().includes(search.toLowerCase())

  );



  // Subir documentos.

  async function handleUpload(event) {

    const input = event.target;

    const files = Array.from(input.files || []);



    if (files.length === 0) return;



    const invalidFiles = files.filter(

      (file) => !/\\.(pdf|docx)$/i.test(file.name)

    );



    if (invalidFiles.length > 0) {

      setUploadError(

        `Formato no permitido: ${invalidFiles

          .map((file) => file.name)

          .join(", ")}. Utiliza PDF o DOCX.`

      );



      input.value = "";

      return;

    }



    setUploading(true);

    setUploadProgress(0);

    setUploadMessage("");

    setUploadError("");

    setProcessMessage("");

    setProcessError("");



    let uploaded = 0;



    try {

      for (let index = 0; index < files.length; index++) {

        const file = files[index];



        await subirDocumento(file, (progress) => {

          const progresoTotal =

            ((index + progress / 100) / files.length) * 100;



          setUploadProgress(Math.round(progresoTotal));

        });



        uploaded++;

      }



      const datos = await obtenerDocumentos();

      setDocuments(formatearDocumentos(datos));



      setUploadMessage(

        `${uploaded} documento(s) cargado(s) correctamente.`

      );

    } catch (error) {

      setUploadError(

        error.response?.data?.detail ||

          error.message ||

          `No fue posible completar la carga. Se cargaron ${uploaded} de ${files.length} archivo(s).`

      );



      // Actualizar la biblioteca si hubo cargas parciales.

      try {

        const datos = await obtenerDocumentos();

        setDocuments(formatearDocumentos(datos));

      } catch {

        // Conservar el error original.

      }

    } finally {

      setUploading(false);

      setUploadProgress(0);

      input.value = "";

    }

  }



  // Procesar un documento.

  async function handleProcess(idDocumento) {

    if (processingId !== null) return;



    setProcessingId(idDocumento);

    setProcessMessage("");

    setProcessError("");

    setUploadMessage("");

    setUploadError("");



    try {

      const resultado = await procesarDocumento(idDocumento);



      // Consultar nuevamente el estado real.

      const datos = await obtenerDocumentos();

      setDocuments(formatearDocumentos(datos));



      setProcessMessage(

        `Documento "${resultado.nombre}" procesado correctamente.`

      );

    } catch (error) {

      setProcessError(

        error.response?.data?.detail ||

          "No fue posible procesar el documento."

      );



      // Recuperar el estado real de la biblioteca.

      try {

        const datos = await obtenerDocumentos();

        setDocuments(formatearDocumentos(datos));

      } catch {

        // Conservar el error original.

      }

    } finally {

      setProcessingId(null);

    }

  }



  // Cerrar sesión.

  function handleLogout() {

    cerrarSesion();



    setUsuario(null);

    setActiveSection("Inicio");

    setSearch("");

    setUploadMessage("");

    setUploadError("");

    setProcessMessage("");

    setProcessError("");

  }



  // Pantalla de carga.

  if (usuario === undefined) {

    return (

      <div className="loading-screen">

        <div className="brand-icon">D</div>

        <h2>Preparando DocuIA...</h2>

        <p>Verificando tu sesión.</p>

      </div>

    );

  }



  // Si no hay sesión, mostrar login.

  if (!usuario) {

    return <Auth onLogin={setUsuario} />;

  }



  // Opciones del menú lateral.

  const menuItems = [

    { name: "Inicio", icon: "⌂" },

    { name: "Mis documentos", icon: "▤" },

    { name: "Asistente IA", icon: "✳" },

    { name: "Análisis documental", icon: "◈" },

  ];



  const processedCount = documents.filter(

    (doc) => doc.status === "Procesado"

  ).length;



  return (

    <div className="app-shell">



      {/* MENÚ LATERAL */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">D</div>



          <div>

            <h1>DocuIA</h1>

            <span>Inteligencia documental</span>

          </div>

        </div>



        <div className="workspace-label">

          ESPACIO DE TRABAJO

        </div>



        <nav className="navigation">

          {menuItems.map((item) => (

            <button

              key={item.name}

              type="button"

              className={`nav-item ${

                activeSection === item.name ? "active" : ""

              }`}

              onClick={() => setActiveSection(item.name)}

            >

              <span className="nav-icon">{item.icon}</span>

              <span>{item.name}</span>

            </button>

          ))}

        </nav>



        <div className="sidebar-bottom">

          <div className="ai-status">

            <span className="status-dot" />



            <div>

              <strong>DocuIA Intelligence</strong>

              <p>API conectada</p>

            </div>

          </div>



          <div className="profile">

            <div className="avatar">

              {usuario.nombre?.charAt(0).toUpperCase() || "D"}

            </div>



            <div className="profile-info">

              <strong>{usuario.nombre}</strong>

              <p>{usuario.correo}</p>

            </div>

          </div>



          <button

            type="button"

            className="logout-button"

            onClick={handleLogout}

          >

            <span className="logout-icon">↪</span>

            <span>Cerrar sesión</span>

          </button>

        </div>

      </aside>



      {/* CONTENIDO PRINCIPAL */}

      <main className="main-content">



        <header className="topbar">

          <div className="breadcrumb">

            Workspace <span>/</span>

            <strong>{activeSection}</strong>

          </div>



          <div className="topbar-right">

            <span className="environment-badge">

              <span className="status-dot" />

              Entorno local

            </span>



            <div className="avatar">

              {usuario.nombre?.charAt(0).toUpperCase() || "D"}

            </div>

          </div>

        </header>



        <div className="page-container">



          {/* INICIO */}

          {activeSection === "Inicio" && (

            <>

              <section className="welcome-section">

                <div>

                  <span className="eyebrow">

                    TU ESPACIO INTELIGENTE

                  </span>



                  <h2>¡Bienvenido, {usuario.nombre}!</h2>



                  <p>

                    Comprende tus documentos, encuentra información y genera

                    resúmenes con ayuda de inteligencia artificial.

                  </p>

                </div>



                <div className="welcome-art" aria-hidden="true">

                  <div className="art-orbit orbit-one" />

                  <div className="art-orbit orbit-two" />



                  <div className="art-document">

                    <span />

                    <span />

                    <span />

                    <b>✳</b>

                  </div>

                </div>

              </section>



              {/* ESTADÍSTICAS */}

              <section className="stats-grid">

                <article className="stat-card">

                  <div className="stat-icon purple">▤</div>

                  <span>Documentos registrados</span>



                  <strong>

                    {documentsLoading ? "…" : documents.length}

                  </strong>



                  <small>Documentos de tu biblioteca</small>

                </article>



                <article className="stat-card">

                  <div className="stat-icon green">✓</div>

                  <span>Documentos procesados</span>



                  <strong>

                    {documentsLoading ? "…" : processedCount}

                  </strong>



                  <small>Archivos procesados correctamente</small>

                </article>



                <article className="stat-card">

                  <div className="stat-icon blue">✳</div>

                  <span>Asistente inteligente</span>



                  <strong>IA</strong>



                  <small>Consulta tus documentos con IA</small>

                </article>

              </section>



              {/* DOCUMENTOS RECIENTES */}

              <section className="section-heading">

                <div>

                  <h3>Documentos recientes</h3>

                  <p>Documentos guardados en tu biblioteca.</p>

                </div>



                <button

                  type="button"

                  className="button-secondary"

                  onClick={() => setActiveSection("Mis documentos")}

                >

                  Ver todos <span>→</span>

                </button>

              </section>



              {documentsError && (

                <div className="info-banner">

                  <span>⚠</span>

                  <p>{documentsError}</p>

                </div>

              )}



              {documentsLoading && (

                <div className="info-banner">

                  <span>⏳</span>

                  <p>Cargando documentos desde SQL Server...</p>

                </div>

              )}



              <DocumentTable

                documents={filteredDocuments.slice(0, 4)}

                search={search}

                setSearch={setSearch}

                onProcess={handleProcess}

                processingId={processingId}
                onView={(document) => setSelectedPdf(document)}

              />



              <section className="cta-card">

                <div className="cta-symbol">✳</div>



                <div>

                  <h3>¿Listo para explorar un documento?</h3>



                  <p>

                    Accede a tu biblioteca para continuar trabajando con tus

                    archivos.

                  </p>

                </div>



                <button

                  type="button"

                  className="button-primary"

                  onClick={() => setActiveSection("Mis documentos")}

                >

                  Explorar documentos <span>→</span>

                </button>

              </section>

            </>

          )}



          {/* MIS DOCUMENTOS */}

          {activeSection === "Mis documentos" && (

            <>

              <section className="section-heading documents-heading">

                <div>

                  <span className="eyebrow">

                    BIBLIOTECA PERSONAL

                  </span>



                  <h2>Mis documentos</h2>



                  <p>

                    Consulta, carga y organiza tus documentos.

                  </p>

                </div>



                <label

                  className={`button-primary upload-button ${

                    uploading ? "disabled" : ""

                  }`}

                >

                  <span>＋</span>



                  {uploading ? "Subiendo..." : "Subir documentos"}



                  <input

                    type="file"

                    accept=".pdf,.docx"

                    multiple

                    hidden

                    disabled={uploading}

                    onChange={handleUpload}

                  />

                </label>

              </section>



              {/* PROGRESO DE CARGA */}

              {uploading && (

                <div className="info-banner">

                  <span>⏳</span>



                  <div style={{ flex: 1 }}>

                    <p>

                      Subiendo documentos: {uploadProgress}%

                    </p>



                    <div className="upload-progress-track">

                      <div

                        className="upload-progress-bar"

                        style={{

                          width: `${uploadProgress}%`,

                        }}

                      />

                    </div>

                  </div>

                </div>

              )}



              {/* MENSAJES DE CARGA */}

              {uploadMessage && (

                <div className="info-banner">

                  <span>✓</span>

                  <p>{uploadMessage}</p>

                </div>

              )}



              {uploadError && (

                <div className="info-banner">

                  <span>⚠</span>

                  <p>{uploadError}</p>

                </div>

              )}



              {/* MENSAJES DE PROCESAMIENTO */}

              {processMessage && (

                <div className="info-banner">

                  <span>✓</span>

                  <p>{processMessage}</p>

                </div>

              )}



              {processError && (

                <div className="info-banner">

                  <span>⚠</span>

                  <p>{processError}</p>

                </div>

              )}



              {documentsLoading && (

                <div className="info-banner">

                  <span>⏳</span>

                  <p>Cargando documentos desde SQL Server...</p>

                </div>

              )}



              {documentsError && (

                <div className="info-banner">

                  <span>⚠</span>

                  <p>{documentsError}</p>

                </div>

              )}



              <DocumentTable

                documents={filteredDocuments}

                search={search}

                setSearch={setSearch}

                onProcess={handleProcess}

                processingId={processingId}
                onView={(document) => setSelectedPdf(document)}

              />

            </>

          )}



          {/* ASISTENTE IA */}

          {activeSection === "Asistente IA" && (

            <AsistenteIA documents={documents} />

          )}



          {/* ANÁLISIS DOCUMENTAL */}

          {activeSection === "Análisis documental" && (

            <AnalisisDocumento documents={documents} />

          )}



          <footer className="footer">

            <span>DocuIA © 2026</span>

            <span>Tu conocimiento, más accesible.</span>

          </footer>



        </div>

      </main>

      {selectedPdf && (
        <PdfViewer
          documento={selectedPdf}
          onClose={() => setSelectedPdf(null)}
        />
      )}

    </div>

  );

}



// TABLA DE DOCUMENTOS

function DocumentTable({

  documents,

  search,

  setSearch,

  onProcess,

  processingId,

  onView,
}) {

  return (

    <section className="document-panel">



      <div className="table-toolbar">

        <div className="search-box">

          <span>⌕</span>



          <input

            type="search"

            placeholder="Buscar un documento..."

            value={search}

            onChange={(event) => setSearch(event.target.value)}

          />

        </div>



        <span className="document-count">

          {documents.length} archivo(s)

        </span>

      </div>



      {documents.length === 0 ? (

        <div className="empty-state">

          <span>⌕</span>



          <strong>

            {search

              ? "No encontramos documentos"

              : "Todavía no hay documentos"}

          </strong>



          <p>

            {search

              ? "Prueba con otro nombre de archivo."

              : "Los documentos registrados aparecerán aquí."}

          </p>

        </div>

      ) : (

        <div className="table-scroll">

          <table>

            <thead>

              <tr>

                <th>DOCUMENTO</th>

                <th>FORMATO</th>

                <th>ESTADO</th>

                <th>INFORMACIÓN</th>

                <th>ACCIONES</th>

              </tr>

            </thead>



            <tbody>

              {documents.map((document) => (

                <tr key={document.id}>

                  <td>

                    <div className="file-cell">

                      <div className="file-icon">▤</div>

                      <strong>{document.name}</strong>

                    </div>

                  </td>



                  <td>

                    <span className="file-type">

                      {document.type}

                    </span>

                  </td>



                  <td>

                    <span

                      className={`status-badge ${

                        document.status === "Procesado"

                          ? "processed"

                          : document.status === "Pendiente"

                            ? "pending"

                            : "development"

                      }`}

                    >

                      {document.status}

                    </span>

                  </td>



                  <td className="date-cell">

                    {document.pages != null

                      ? `${document.pages} páginas`

                      : document.date}

                  </td>



                  <td>
                    <div className="document-actions">
                      {document.type === "PDF" && (
                        <button
                          type="button"
                          className="view-button"
                          onClick={() => onView(document)}
                        >
                          Ver PDF
                        </button>
                      )}

                      {document.status === "Pendiente" ? (
                        <button
                          type="button"
                          className="process-button"
                          disabled={processingId !== null}
                          onClick={() => onProcess(document.id)}
                        >
                          {processingId === document.id
                            ? "Procesando..."
                            : "Procesar →"}
                        </button>
                      ) : document.status === "Procesado" ? (
                        <span className="processed-label">
                          ✓ Listo
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </section>

  );

}



export default App;
