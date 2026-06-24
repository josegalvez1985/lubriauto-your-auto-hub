const BASE_URL = "https://oracleapex.com/ords/josegalvez/lt/autos";

export type Auto = {
  id_auto: number;
  descripcion: string;
  placa: string;
  km_actual: number;
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
    res = await fetch(`${BASE_URL}/${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Token": token,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor." } as ApiResult<T>;
  }

  let data: ApiResult<T>;
  try {
    data = await res.json();
  } catch {
    data = { ok: false, error: "Respuesta inválida del servidor" } as ApiResult<T>;
  }

  if (!res.ok && data.ok === undefined) data.ok = false;
  return data;
}

export const autosApi = {
  lista: (token: string) => request(token, "lista", "GET"),
  obtener: (token: string, id: number) => request(token, String(id), "GET"),
  crear: (token: string, auto: AutoInput) => request(token, "crear", "POST", auto),
  actualizar: (token: string, id: number, auto: AutoInput) =>
    request(token, String(id), "PUT", auto),
  eliminar: (token: string, id: number) => request(token, String(id), "DELETE"),
};
