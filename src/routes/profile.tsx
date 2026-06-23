import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Moon, Fingerprint, Bell, User, Mail, ChevronRight, LogOut, ShieldCheck,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { InstallPwaButton } from "@/components/install-pwa-button";
import { useAuth } from "@/lib/auth";
import { ChangePasswordDialog } from "@/components/change-password-dialog";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "LubriAuto — Perfil" },
      { name: "description", content: "Configura tu cuenta, tema y acceso biométrico en LubriAuto." },
    ],
  }),
  component: ProfilePage,
});

const BIOMETRIC_KEY = "biometric-enabled";

function ProfilePage() {
  const { theme, toggle } = useTheme();
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [biometric, setBiometric] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [pwdOpen, setPwdOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  useEffect(() => {
    setBiometric(localStorage.getItem(BIOMETRIC_KEY) === "true");
    setBiometricSupported(
      typeof window !== "undefined" &&
      "PublicKeyCredential" in window
    );
  }, []);

  const toggleBiometric = async (next: boolean) => {
    if (next && biometricSupported) {
      try {
        const available =
          await (window as any).PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable?.();
        if (!available) {
          alert("Este dispositivo no tiene un autenticador biométrico disponible.");
          return;
        }
      } catch {
        // continúa de todos modos
      }
    }
    setBiometric(next);
    localStorage.setItem(BIOMETRIC_KEY, String(next));
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <header
        className="text-white px-5 sm:px-8 pt-8 pb-20 rounded-b-[2rem] relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="absolute -top-20 -right-10 w-72 h-72 rounded-full blur-3xl opacity-20"
             style={{ background: "var(--brand-orange)" }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <Link to="/dashboard">
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 -ml-2 rounded-full">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Volver
            </Button>
          </Link>
          <div className="mt-6 flex items-center gap-4">
            <div className="h-20 w-20 shrink-0 rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/15 flex items-center justify-center">
              <User className="h-9 w-9 text-white/80" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{session?.nombre ?? "Mi cuenta"}</h1>
              <p className="text-white/70 text-sm flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {session?.username ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 sm:px-8 -mt-12 space-y-6 relative z-10">
        {/* Apariencia y seguridad */}
        <Card className="p-2 rounded-2xl shadow-[var(--shadow-card)] divide-y divide-border">
          <SettingRow
            icon={Moon}
            title="Modo oscuro"
            desc="Cambia entre tema claro y oscuro"
          >
            <Switch checked={theme === "dark"} onCheckedChange={toggle} aria-label="Modo oscuro" />
          </SettingRow>

          <SettingRow
            icon={Fingerprint}
            title="Acceso biométrico"
            desc={biometricSupported ? "Inicia sesión con huella o rostro" : "No disponible en este dispositivo"}
          >
            <Switch
              checked={biometric}
              onCheckedChange={toggleBiometric}
              disabled={!biometricSupported}
              aria-label="Acceso biométrico"
            />
          </SettingRow>

          <SettingRow
            icon={Bell}
            title="Notificaciones"
            desc="Recordatorios de servicios y mantenimiento"
          >
            <Switch checked={notifications} onCheckedChange={setNotifications} aria-label="Notificaciones" />
          </SettingRow>
        </Card>

        {/* Cuenta */}
        <Card className="p-2 rounded-2xl shadow-[var(--shadow-card)] divide-y divide-border">
          <LinkRow icon={User} title="Datos personales" />
          <LinkRow icon={ShieldCheck} title="Seguridad y contraseña" onClick={() => setPwdOpen(true)} />
        </Card>

        {/* Instalar app */}
        <InstallPwaButton className="w-full h-12 rounded-xl" />

        {/* Cerrar sesión */}
        <Button onClick={handleLogout} variant="ghost"
                className="w-full h-12 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10">
          <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
        </Button>
      </main>

      <ChangePasswordDialog
        open={pwdOpen}
        onOpenChange={setPwdOpen}
        username={session?.username ?? ""}
      />
    </div>
  );
}

function SettingRow({
  icon: Icon, title, desc, children,
}: {
  icon: React.ElementType; title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 p-4">
      <span className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center"
            style={{ background: "color-mix(in oklab, var(--brand-navy) 10%, transparent)", color: "var(--brand-navy)" }}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function LinkRow({ icon: Icon, title, onClick }: { icon: React.ElementType; title: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 p-4 text-left">
      <span className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center"
            style={{ background: "color-mix(in oklab, var(--brand-navy) 10%, transparent)", color: "var(--brand-navy)" }}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex-1 font-semibold text-sm text-foreground">{title}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
