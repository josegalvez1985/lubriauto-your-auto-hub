// Desbloqueo biométrico LOCAL (sin backend).
// Usa WebAuthn solo como candado del dispositivo sobre la sesión ya guardada.
// NO verifica firma en servidor: protege el acceso local a la app, no autentica contra el backend.

const CRED_KEY = "biometric-cred-id";
const ENABLED_KEY = "biometric-enabled";

const RP_NAME = "LubriAuto";

function b64urlToBuf(s: string): ArrayBuffer {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function bufToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function biometricEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ENABLED_KEY) === "true" && !!localStorage.getItem(CRED_KEY);
}

export async function biometricAvailable(): Promise<boolean> {
  if (typeof window === "undefined" || !("PublicKeyCredential" in window)) return false;
  try {
    return await (window as unknown as {
      PublicKeyCredential: { isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean> };
    }).PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.() ?? false;
  } catch {
    return false;
  }
}

// Enrola la credencial de plataforma. p_usuario solo se usa como nombre visible.
export async function biometricEnroll(usuario: string): Promise<void> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: RP_NAME },
      user: { id: userId, name: usuario || "usuario", displayName: usuario || "Usuario" },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
      timeout: 60000,
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error("No se pudo registrar la credencial biométrica.");
  localStorage.setItem(CRED_KEY, bufToB64url(cred.rawId));
  localStorage.setItem(ENABLED_KEY, "true");
}

export function biometricDisable(): void {
  localStorage.removeItem(CRED_KEY);
  localStorage.setItem(ENABLED_KEY, "false");
}

// Pide la verificación biométrica del dispositivo. Devuelve true si pasa.
export async function biometricVerify(): Promise<boolean> {
  const id = localStorage.getItem(CRED_KEY);
  if (!id) return false;
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ type: "public-key", id: b64urlToBuf(id) }],
        userVerification: "required",
        timeout: 60000,
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
}
