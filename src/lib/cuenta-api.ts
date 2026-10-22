import { sesionInvalida } from "@/lib/auth-api";

const BASE_URL = "https://oracleapex.com/ords/josegalvez/lt/cuenta";

type ApiResult = {
  ok: boolean;
  error?: string;
  mensaje?: string;
  inactiva?: boolean;
};

function esTokenInvalido(error?: string): boolean {
  if (!error) return false;
  return error.includes("ORA-20401") || /token (inv|no )/i.test(error);
}

// token null: endpoint sin sesión (los de reactivar se usan desde el registro).
async function request(token: string | null, path: string, method: string, body?: unknown): Promise<ApiResult> {
  let res: Response;
  try {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body) headers["Content-Type"] = "application/json";
    res = await fetch(`${BASE_URL}/${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor." };
  }

  let data: ApiResult;
  try {
    data = (await res.json()) as ApiResult;
  } catch {
    data = { ok: res.ok };
    if (!res.ok) data.error = "Respuesta inválida del servidor";
  }
  if (data.ok === undefined) data.ok = res.ok;

  if (token && esTokenInvalido(data.error)) sesionInvalida();

  return data;
}

export const cuentaApi = {
  // Da de baja la cuenta (queda inactiva, sin borrar datos) y cierra todas sus sesiones.
  inactivar: (token: string, password: string, motivo?: string) =>
    request(token, "inactivar", "POST", { password, motivo }),

  // ¿El correo tiene una cuenta dada de baja? (inactiva: true/false)
  estado: (email: string) => request(null, "estado", "POST", { email }),

  // Reactiva con la contraseña de la cuenta.
  reactivar: (email: string, password: string) =>
    request(null, "reactivar", "POST", { email, password }),

  // Reactiva mandando una contraseña nueva al correo.
  reactivarPorCorreo: (email: string) => request(null, "reactivar-correo", "POST", { email }),
};
