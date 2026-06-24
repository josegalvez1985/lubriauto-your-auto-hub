const BASE_URL = "https://oracleapex.com/ords/josegalvez/autenticacion";

export type AuthResult = {
  ok: boolean;
  error?: string;
  mensaje?: string;
  token?: string;
  expira?: string;
  id_usuario?: number;
  nombre?: string;
  username?: string;
};

async function request(path: string, method: string, body?: unknown): Promise<AuthResult> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor." };
  }

  let data: AuthResult;
  try {
    data = await res.json();
  } catch {
    data = { ok: false, error: "Respuesta inválida del servidor" };
  }

  if (!res.ok && data.ok === undefined) {
    data.ok = false;
  }
  return data;
}

export const authApi = {
  registrar: (username: string, email: string, nombre: string, password: string, telefono?: string) =>
    request("registro", "POST", { username, email, nombre, password, telefono }),

  login: (usuario: string, password: string) =>
    request("login", "POST", { usuario, password }),

  cambiarPassword: (username: string, password_actual: string, password_nuevo: string) =>
    request("password", "PUT", { username, password_actual, password_nuevo }),

  resetPassword: (email: string) =>
    request("reset", "POST", { email }),
};

export function mensajeLimpio(error?: string): string {
  if (!error) return "Ocurrió un error inesperado.";
  return error.replace(/^ORA-\d+:\s*/, "");
}

export function tokenValido(expira?: string | null): boolean {
  if (!expira) return false;
  return new Date(expira) > new Date();
}
