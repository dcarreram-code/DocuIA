
import { useState } from "react";
import { iniciarSesion, registrarUsuario } from "../services/auth";
import "./Auth.css";

export default function Auth({ onLogin }) {
  const [modoRegistro, setModoRegistro] = useState(false);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMensaje("");
    setCargando(true);

    try {
      if (modoRegistro) {
        await registrarUsuario(nombre.trim(), correo.trim(), password);
        setModoRegistro(false);
        setPassword("");
        setMensaje("Cuenta creada. Ahora puedes iniciar sesión.");
      } else {
        const usuario = await iniciarSesion(correo.trim(), password);
        onLogin(usuario);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : err.message || "Ocurrió un error. Intenta nuevamente."
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="auth-brand">
          <div className="auth-logo">D</div>
          <span>DocuIA</span>
        </div>

        <div className="auth-presentation">
          <span className="auth-eyebrow">INTELIGENCIA DOCUMENTAL</span>
          <h1>Todo tu conocimiento, en un solo lugar.</h1>
          <p>
            Analiza documentos, descubre información importante y conversa
            con tus archivos mediante inteligencia artificial.
          </p>

          <div className="auth-feature">
            <span>✳</span>
            <div>
              <strong>Análisis inteligente</strong>
              <p>Transforma documentos en información útil.</p>
            </div>
          </div>

          <div className="auth-feature">
            <span>⌕</span>
            <div>
              <strong>Respuestas fundamentadas</strong>
              <p>Consulta tus documentos con mayor facilidad.</p>
            </div>
          </div>
        </div>

        <span className="auth-footer-note">
          DocuIA · Tu conocimiento, más accesible.
        </span>
      </section>

      <section className="auth-form-side">
        <form className="auth-form" onSubmit={handleSubmit}>
          <span className="auth-eyebrow">
            {modoRegistro ? "ÚNETE A DOCUIA" : "BIENVENIDO DE NUEVO"}
          </span>

          <h2>{modoRegistro ? "Crear una cuenta" : "Inicia sesión"}</h2>
          <p className="auth-subtitle">
            {modoRegistro
              ? "Regístrate para comenzar a organizar tus documentos."
              : "Ingresa tus credenciales para acceder a tu espacio."}
          </p>

          {modoRegistro && (
            <label className="auth-field">
              Nombre completo
              <input
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Tu nombre"
                minLength={2}
                maxLength={100}
                autoComplete="name"
                required
              />
            </label>
          )}

          <label className="auth-field">
            Correo electrónico
            <input
              type="email"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              placeholder="tu@correo.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-field">
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              maxLength={128}
              autoComplete={modoRegistro ? "new-password" : "current-password"}
              required
            />
          </label>

          {error && <div className="auth-message error">{error}</div>}
          {mensaje && <div className="auth-message success">{mensaje}</div>}

          <button className="auth-submit" type="submit" disabled={cargando}>
            {cargando
              ? "Procesando..."
              : modoRegistro
                ? "Crear cuenta →"
                : "Ingresar a DocuIA →"}
          </button>

          <div className="auth-switch">
            {modoRegistro ? "¿Ya tienes una cuenta?" : "¿Aún no tienes cuenta?"}
            <button
              type="button"
              onClick={() => {
                setModoRegistro(!modoRegistro);
                setError("");
                setMensaje("");
              }}
            >
              {modoRegistro ? "Inicia sesión" : "Regístrate"}
            </button>
          </div>

          <p className="auth-security">
            Tus documentos están destinados a tu espacio personal.
          </p>
        </form>
      </section>
    </main>
  );
}
