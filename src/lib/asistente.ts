/**
 * El asistente con IA: un chat en un botón flotante, en las pantallas con
 * sesión. Contrato del backend: `backend/asistente.sql`.
 *
 * La IA corre en Oracle (`PKG_IA_LT`, que llama a la API de Claude): acá solo
 * se manda la pregunta con lo que el backend no sabe —la conversación, la
 * pantalla abierta y el manual— y se muestra la respuesta.
 *
 * - **La conversación vive solo en memoria y va atada al token**: salir o
 *   entrar con otro usuario la borra. Trae datos del usuario; no se escribe en
 *   el disco.
 * - **El manual es `MANUAL_USUARIO.md`**, importado como texto: la IA conoce
 *   cada pantalla con el deploy, sin volver a correr el `.sql`. Se descarga
 *   recién al abrir el chat.
 */

import { useSyncExternalStore } from "react";

import { mensajeLimpio, sesionInvalida } from "@/lib/auth-api";

const BASE_URL = "https://oracleapex.com/ords/josegalvez/lt/asistente";

export type MensajeIA = {
  id: string;
  rol: "usuario" | "asistente";
  texto: string;
  /** Un fallo (sin respuesta): no se le manda a la IA como historial. */
  error?: boolean;
};

type Estado = {
  /** De qué sesión es: el token, que cambia en cada login. */
  sesion: string;
  mensajes: MensajeIA[];
  /** Esperando la respuesta (puede tardar: la IA corre consultas). */
  pendiente: boolean;
  usadasHoy: number | null;
  limite: number | null;
  /** El panel abierto. Acá y no en el componente: sigue abierto al navegar. */
  abierto: boolean;
};

const VACIO: Omit<Estado, "sesion"> = {
  mensajes: [],
  pendiente: false,
  usadasHoy: null,
  limite: null,
  abierto: false,
};

/* -------------------------------------------------------------------------- */
/* El pedido al backend                                                        */
/* -------------------------------------------------------------------------- */

type Respuesta = {
  ok: boolean;
  error?: string;
  respuesta?: string;
  usadas_hoy?: number;
  limite?: number;
};

function esTokenInvalido(error?: string): boolean {
  if (!error) return false;
  return error.includes("ORA-20401") || /token (inv|no )/i.test(error);
}

async function pedir(token: string, cuerpo: unknown): Promise<Respuesta> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/preguntar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor." };
  }

  let data: Respuesta;
  try {
    data = (await res.json()) as Respuesta;
  } catch {
    data = { ok: res.ok };
    if (!res.ok) data.error = "Respuesta inválida del servidor";
  }
  if (data.ok === undefined) data.ok = res.ok;

  if (esTokenInvalido(data.error)) sesionInvalida();

  return data;
}

/* -------------------------------------------------------------------------- */
/* La conversación: un store de módulo                                         */
/* -------------------------------------------------------------------------- */

/*
 * De módulo y no en un componente: el chat sobrevive a la navegación (cada
 * pantalla es su propia ruta) y una respuesta que llega con el panel cerrado
 * no se pierde.
 */
let estado: Estado = { sesion: "", ...VACIO };
const oyentes = new Set<() => void>();

function fijar(parcial: Partial<Estado>) {
  estado = { ...estado, ...parcial };
  oyentes.forEach((f) => f());
}

/** La conversación de esta sesión (la de una anterior, si quedó, se descarta). */
function actual(token: string): Estado {
  if (estado.sesion !== token) estado = { sesion: token, ...VACIO };
  return estado;
}

function suscribir(f: () => void) {
  oyentes.add(f);
  return () => oyentes.delete(f);
}

export function useAsistente(token: string) {
  return useSyncExternalStore(
    suscribir,
    () => actual(token),
    () => actual(token),
  );
}

export function abrirAsistente(abierto: boolean) {
  fijar({ abierto });
}

export function nuevaConversacion() {
  if (estado.pendiente) return;
  fijar({ mensajes: [] });
}

let secuencia = 0;
const nuevoId = () => `m${Date.now()}-${++secuencia}`;

/** Cuántos mensajes previos viajan como contexto (el backend corta en 12). */
const HISTORIAL = 12;

/**
 * Manda una pregunta y agrega la respuesta (o el error) a la conversación.
 * `pantalla`: la que está abierta, para "¿cómo uso esta pantalla?".
 */
export async function preguntar(texto: string, pantalla: string | null, token: string) {
  const pregunta = texto.trim();
  const previo = actual(token);
  if (!pregunta || previo.pendiente) return;

  const historial = previo.mensajes
    .filter((m) => !m.error)
    .slice(-HISTORIAL)
    .map((m) => ({ rol: m.rol, texto: m.texto }));

  fijar({
    mensajes: [...previo.mensajes, { id: nuevoId(), rol: "usuario", texto: pregunta }],
    pendiente: true,
  });

  const r = await pedir(token, {
    pregunta,
    historial,
    manual: await cargarManual(),
    pantalla,
  });

  // Si la sesión cambió mientras se esperaba, la respuesta ya no va.
  if (estado.sesion !== token) return;
  if (r.ok) {
    fijar({
      mensajes: [
        ...estado.mensajes,
        { id: nuevoId(), rol: "asistente", texto: String(r.respuesta ?? "") },
      ],
      usadasHoy: r.usadas_hoy ?? null,
      limite: r.limite ?? null,
      pendiente: false,
    });
  } else {
    fijar({
      mensajes: [
        ...estado.mensajes,
        { id: nuevoId(), rol: "asistente", texto: mensajeLimpio(r.error), error: true },
      ],
      pendiente: false,
    });
  }
}

/** Vuelve a mandar la última pregunta que falló. */
export function reintentar(pantalla: string | null, token: string) {
  const { mensajes, pendiente } = actual(token);
  const ultimo = mensajes[mensajes.length - 1];
  const pregunta = mensajes[mensajes.length - 2];
  if (pendiente || !ultimo?.error || pregunta?.rol !== "usuario") return;
  fijar({ mensajes: mensajes.slice(0, -2) });
  void preguntar(pregunta.texto, pantalla, token);
}

/* -------------------------------------------------------------------------- */
/* El manual                                                                   */
/* -------------------------------------------------------------------------- */

let manual: Promise<string> | null = null;

/**
 * El manual, una vez por carga del sitio. Import dinámico: no pesa en el
 * bundle de nadie que no abra el chat.
 */
export function cargarManual(): Promise<string> {
  manual ??= import("../../MANUAL_USUARIO.md?raw").then((m) => m.default).catch(() => "");
  return manual;
}
