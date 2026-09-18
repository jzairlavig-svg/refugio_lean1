// app.js — lógica compartida de "Mi espacio"

const CLAVE_ENTRADAS = "entradas_diario";

function obtenerEntradas() {
  const guardado = localStorage.getItem(CLAVE_ENTRADAS);
  return guardado ? JSON.parse(guardado) : [];
}

function agregarEntrada({ texto, mood }) {
  const entradas = obtenerEntradas();
  entradas.push({
    id: entradas.length > 0 ? Math.max(...entradas.map((e) => e.id)) + 1 : 1,
    texto,
    mood, // 0 = muy bajo ... 4 = muy bien
    fecha: new Date().toISOString(),
  });
  localStorage.setItem(CLAVE_ENTRADAS, JSON.stringify(entradas));
}

/**
 * Regla: si las últimas 3 entradas registradas tienen un ánimo bajo
 * (mood 0 o 1), se ofrece acompañamiento. No aplica con menos de 3
 * entradas todavía.
 */
function necesitaAcompanamiento() {
  const entradas = obtenerEntradas();
  if (entradas.length < 3) return false;

  const ultimasTres = entradas.slice(-3);
  return ultimasTres.every((e) => e.mood <= 1);
}

function formatearFecha(fechaIso) {
  const fecha = new Date(fechaIso);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);

  const esMismoDia = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (esMismoDia(fecha, hoy)) return "Hoy, " + fecha.toLocaleDateString("es-PE", { day: "numeric", month: "long" });
  if (esMismoDia(fecha, ayer)) return "Ayer, " + fecha.toLocaleDateString("es-PE", { day: "numeric", month: "long" });
  return fecha.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
}
