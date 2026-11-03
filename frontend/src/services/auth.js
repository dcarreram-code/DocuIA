
import api from "./api";

export async function iniciarSesion(correo, password) {
  const response = await api.post("/auth/login", {
    correo,
    password,
  });

  const data = response.data;

  if (!data.success || !data.access_token) {
    throw new Error("No se pudo iniciar sesión.");
  }

  localStorage.setItem("docuia_token", data.access_token);
  localStorage.setItem("docuia_usuario", JSON.stringify(data.usuario));

  return data.usuario;
}

export async function registrarUsuario(nombre, correo, password) {
  const response = await api.post("/auth/register", {
    nombre,
    correo,
    password,
  });

  return response.data;
}

export async function obtenerSesion() {
  const token = localStorage.getItem("docuia_token");

  if (!token) return null;

  try {
    const response = await api.get("/auth/me");
    localStorage.setItem(
      "docuia_usuario",
      JSON.stringify(response.data.usuario)
    );
    return response.data.usuario;
  } catch {
    localStorage.removeItem("docuia_token");
    localStorage.removeItem("docuia_usuario");
    return null;
  }
}

export function cerrarSesion() {
  localStorage.removeItem("docuia_token");
  localStorage.removeItem("docuia_usuario");
}
