import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { authApi, tokenValido, SESION_INVALIDA_EVENT } from "@/lib/auth-api";

type Session = {
  token: string;
  expira: string;
  id_usuario: number;
  nombre: string;
  username: string;
};

type AuthContextValue = {
  session: Session | null;
  isAuthenticated: boolean;
  login: (usuario: string, password: string, recordar?: boolean) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
};

const STORAGE_KEY = "auth-session";

const AuthContext = createContext<AuthContextValue | null>(null);

function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!tokenValido(s.expira)) {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    setSession(loadSession());
  }, []);

  useEffect(() => {
    const onInvalida = () => {
      logout();
      router.navigate({ to: "/" });
    };
    window.addEventListener(SESION_INVALIDA_EVENT, onInvalida);
    return () => window.removeEventListener(SESION_INVALIDA_EVENT, onInvalida);
  }, [router]);

  useEffect(() => {
    if (!session) return;
    const ms = new Date(session.expira).getTime() - Date.now();
    const expirar = () => {
      logout();
      router.navigate({ to: "/" });
    };
    if (ms <= 0) {
      expirar();
      return;
    }
    const t = setTimeout(expirar, ms);
    return () => clearTimeout(t);
  }, [session, router]);

  const login: AuthContextValue["login"] = async (usuario, password, recordar = true) => {
    const r = await authApi.login(usuario, password);
    if (r.ok && r.token && r.expira) {
      const s: Session = {
        token: r.token,
        expira: r.expira,
        id_usuario: r.id_usuario ?? 0,
        nombre: r.nombre ?? usuario,
        username: r.username ?? usuario,
      };
      const store = recordar ? localStorage : sessionStorage;
      const otro = recordar ? sessionStorage : localStorage;
      otro.removeItem(STORAGE_KEY);
      store.setItem(STORAGE_KEY, JSON.stringify(s));
      setSession(s);
      return { ok: true };
    }
    return { ok: false, error: r.error };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, isAuthenticated: session !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
