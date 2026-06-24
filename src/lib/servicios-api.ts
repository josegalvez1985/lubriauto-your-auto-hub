import { sesionInvalida } from "@/lib/auth-api";

const BASE_URL = "https://oracleapex.com/ords/josegalvez/lt/servicios";

export type Servicio = {
  id_servicio: number;
  descripcion: string;
  km: number;
  costo: number;
  fecha: string;
};

export type ServicioDetalle = Servicio & {
  id_auto: number;
  auto: string;
  placa: string;
};

export type ServicioInput = {
  id_auto: number;
  descripcion: string;
  km: number;
  costo: number;
  fecha?: string;
};

export type ServicioUpdate = Omit<ServicioInput, "id_auto">;

type ApiResult<T = unknown> = {
  ok: boolean;
  error?: string;
  mensaje?: string;
  servicios?: Servicio[];
  id_servicio?: number;
} & T;

function esTokenInvalido(error?: string): boolean {
  if (!error) return false;
  return error.includes("ORA-20401") || /token (inv|no )/i.test(error);
}

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

export const serviciosApi = {
  porAuto: (token: string, idAuto: number) => request(token, `auto/${idAuto}`, "GET"),
  obtener: (token: string, id: number) => request<Partial<ServicioDetalle>>(token, String(id), "GET"),
  crear: (token: string, servicio: ServicioInput) => request(token, "crear", "POST", servicio),
  actualizar: (token: string, id: number, servicio: ServicioUpdate) =>
    request(token, String(id), "PUT", servicio),
  eliminar: (token: string, id: number) => request(token, String(id), "DELETE"),
};
