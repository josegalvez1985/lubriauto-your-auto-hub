import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Moon, Fingerprint, Bell, User, Mail, ChevronRight, LogOut, ShieldCheck, UserX, Camera,
  BookOpen,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/lib/auth";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { BajaCuentaDialog } from "@/components/baja-cuenta-dialog";
import { borrarFoto, guardarFoto, leerFoto, reducirFoto } from "@/lib/foto-perfil";
import { biometricEnabled, biometricAvailable, biometricEnroll, biometricDisable } from "@/lib/biometric";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "LubriAuto — Perfil" },
      { name: "description", content: "Configura tu cuenta, tema y acceso biométrico en LubriAuto." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { theme, toggle } = useTheme();
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [biometric, setBiometric] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [bajaOpen, setBajaOpen] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const archivo = useRef<HTMLInputElement>(null);
  const usuario = session?.username ?? "";

  useEffect(() => {
    setFoto(leerFoto(usuario));
  }, [usuario]);

  const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // que elegir la misma foto otra vez también dispare el cambio
    if (!f || !usuario) return;
    try {
      const dataUrl = await reducirFoto(f);
      guardarFoto(usuario, dataUrl);
      setFoto(dataUrl);
      toast.success("Foto de perfil actualizada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la foto.");
    }
  };

  const handleQuitarFoto = () => {
    borrarFoto(usuario);
    setFoto(null);
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  useEffect(() => {
    setBiometric(biometricEnabled());
    biometricAvailable().then(setBiometricSupported);
  }, []);

  const toggleBiometric = async (next: boolean) => {
    if (!next) {
      biometricDisable();
      setBiometric(false);
      return;
    }
    if (!biometricSupported) {
      toast.error("Este dispositivo no tiene un autenticador biométrico disponible.");
      return;
    }
    try {
      await biometricEnroll(session?.nombre ?? session?.username ?? "usuario");
      setBiometric(true);
      toast.success("Acceso biométrico activado.");
    } catch {
      setBiometric(false);
      toast.error("No se pudo activar el acceso biométrico.");
    }
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
            <button
              type="button"
              onClick={() => archivo.current?.click()}
              disabled={!usuario}
              aria-label={foto ? "Cambiar foto de perfil" : "Agregar foto de perfil"}
              title={foto ? "Cambiar foto" : "Agregar foto"}
              className="relative h-20 w-20 shrink-0 rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/15 flex items-center justify-center transition hover:ring-white/40 disabled:cursor-default"
            >
              {foto ? (
                <img src={foto} alt="Foto de perfil" className="h-full w-full rounded-2xl object-cover" />
              ) : (
                <User className="h-9 w-9 text-white/80" />
              )}
              <span className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full flex items-center justify-center text-white ring-2 ring-[color:var(--brand-navy-deep)]"
                    style={{ background: "var(--gradient-accent)" }}>
                <Camera className="h-3.5 w-3.5" />
              </span>
            </button>
            <input ref={archivo} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">{session?.nombre ?? "Mi cuenta"}</h1>
              <p className="text-white/70 text-sm flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {session?.username ?? "—"}
              </p>
              {foto && (
                <button type="button" onClick={handleQuitarFoto}
                        className="mt-1 text-xs text-white/60 hover:text-white underline-offset-2 hover:underline">
                  Quitar foto
                </button>
              )}
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

        {/* Ayuda */}
        <Card className="p-2 rounded-2xl shadow-[var(--shadow-card)]">
          <LinkRow icon={BookOpen} title="Manual de uso" onClick={() => navigate({ to: "/manual" })} />
        </Card>

        {/* Cuenta */}
        <Card className="p-2 rounded-2xl shadow-[var(--shadow-card)] divide-y divide-border">
          <LinkRow icon={User} title="Datos personales" />
          <LinkRow icon={ShieldCheck} title="Seguridad y contraseña" onClick={() => setPwdOpen(true)} />
          <LinkRow icon={UserX} title="Dar de baja mi cuenta" peligro onClick={() => setBajaOpen(true)} />
        </Card>

        {/* Cerrar sesión */}
        <Button onClick={handleLogout} variant="ghost"
                className="w-full h-12 rounded-[6px] text-destructive hover:text-destructive hover:bg-destructive/10">
          <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
        </Button>
      </main>

      <ChangePasswordDialog
        open={pwdOpen}
        onOpenChange={setPwdOpen}
        username={session?.username ?? ""}
      />

      <BajaCuentaDialog open={bajaOpen} onOpenChange={setBajaOpen} />
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

function LinkRow({
  icon: Icon, title, onClick, peligro = false,
}: {
  icon: React.ElementType; title: string; onClick?: () => void; peligro?: boolean;
}) {
  const color = peligro ? "var(--destructive)" : "var(--brand-navy)";
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 p-4 text-left">
      <span className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center"
            style={{ background: `color-mix(in oklab, ${color} 10%, transparent)`, color }}>
        <Icon className="h-5 w-5" />
      </span>
      <span className={`flex-1 font-semibold text-sm ${peligro ? "text-destructive" : "text-foreground"}`}>{title}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
