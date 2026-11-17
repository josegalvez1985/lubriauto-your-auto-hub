import { sesionInvalida } from "@/lib/auth-api";

const BASE_URL = "https://oracleapex.com/ords/josegalvez/lt/autos";

function esTokenInvalido(error?: string): boolean {
  if (!error) return false;
  return error.includes("ORA-20401") || /token (inv|no )/i.test(error);
}

export type Auto = {
  id_auto: number;
  descripcion: string;
  placa: string;
  km_actual: number;
  estado?: string;
  fecha_registro?: string;
};

export type AutoInput = {
  descripcion: string;
  placa: string;
  km: number;
};

type ApiResult<T = unknown> = {
  ok: boolean;
  error?: string;
  mensaje?: string;
  autos?: Auto[];
  id_auto?: number;
} & T;

async function request<T = unknown>(
  token: string,
  path: string,
  method: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  let res: Response;
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (body) headers["Content-Type"] = "application/json";
    res = await fetch(`${BASE_URL}/${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor." } as ApiResult<T>;
  }

  const texto = await res.text();
  let data: ApiResult<T>;
  if (texto) {
    try {
      data = JSON.parse(texto) as ApiResult<T>;
    } catch {
      data = { ok: res.ok } as ApiResult<T>;
      if (!res.ok) data.error = "Respuesta inválida del servidor";
    }
  } else {
    data = { ok: res.ok } as ApiResult<T>;
  }

  if (data.ok === undefined) data.ok = res.ok;

  if (esTokenInvalido(data.error)) sesionInvalida();

  return data;
}

export const autosApi = {
  lista: (token: string) => request(token, "lista", "GET"),
  obtener: (token: string, id: number) => request(token, String(id), "GET"),
  crear: (token: string, auto: AutoInput) => request(token, "crear", "POST", auto),
  actualizar: (token: string, id: number, auto: AutoInput) =>
    request(token, String(id), "PUT", auto),
  /** Inactiva (no borra): el auto deja de aparecer en Inicio y en Historial. */
  eliminar: (token: string, id: number) => request(token, String(id), "DELETE"),
  activar: (token: string, id: number) => request(token, `${id}/activar`, "POST"),
};
