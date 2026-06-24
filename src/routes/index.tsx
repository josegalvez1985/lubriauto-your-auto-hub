import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { mensajeLimpio } from "@/lib/auth-api";
import { ResetPasswordDialog } from "@/components/reset-password-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Droplet, Wrench, Gauge, ShieldCheck, Eye, EyeOff, Mail, Lock, Fingerprint } from "lucide-react";
import { biometricEnabled, biometricVerify } from "@/lib/biometric";
import { InstallPwaBanner } from "@/components/install-pwa-banner";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstallPwaButton } from "@/components/install-pwa-button";

const logoUrl = `${import.meta.env.BASE_URL}icon-512.png`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LubriAuto — Inicia sesión" },
      { name: "description", content: "Accede a LubriAuto y gestiona el mantenimiento de tu vehículo: aceites, filtros, repuestos e historial." },
      { property: "og:title", content: "LubriAuto — Tu app de mantenimiento vehicular" },
      { property: "og:description", content: "Tu vehículo, siempre en buenas manos." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [recordar, setRecordar] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [bioVisible, setBioVisible] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      // Sesión válida guardada: si NO hay biometría activa, entra directo.
      // Con biometría activa, el usuario debe verificarse con el botón.
      if (!biometricEnabled()) {
        navigate({ to: "/dashboard" });
        return;
      }
      setBioVisible(true);
    }
  }, [isAuthenticated, navigate]);

  const handleBiometric = async () => {
    const ok = await biometricVerify();
    if (ok) {
      navigate({ to: "/dashboard" });
    } else {
      toast.error("No se pudo verificar tu identidad.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await login(usuario.trim(), password, recordar);
    setLoading(false);
    if (r.ok) {
      navigate({ to: "/dashboard" });
    } else {
      toast.error(mensajeLimpio(r.error));
    }
  };

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      {/* Hero / Brand side */}
      <aside
        className="relative hidden lg:flex flex-col justify-between p-12 text-white overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        {/* decorative gears */}
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full opacity-10 blur-2xl"
             style={{ background: "var(--gradient-accent)" }} />
        <div className="absolute bottom-[-80px] left-[-60px] w-[300px] h-[300px] rounded-full opacity-10 blur-3xl"
             style={{ background: "white" }} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-16 w-16 shrink-0 rounded-2xl bg-white/10 backdrop-blur p-2 flex items-center justify-center ring-1 ring-white/15">
            <img src={logoUrl} alt="LubriAuto" className="h-full w-full object-contain rounded-xl" />
          </div>
          <div>
            <p className="font-extrabold tracking-tight text-xl leading-none">
              Lubri<span style={{ color: "var(--brand-orange)" }}>Auto</span>
            </p>
            <p className="text-xs text-white/60 mt-1">Mantenimiento vehicular</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
            Tu vehículo,<br />
            <span style={{ color: "var(--brand-orange)" }}>siempre en buenas manos.</span>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Lleva el control total de los servicios, cambios de aceite, filtros y repuestos de tu auto en una sola app.
          </p>

          <ul className="grid grid-cols-2 gap-3 pt-4">
            {[
              { icon: Droplet, label: "Cambios de aceite" },
              { icon: Wrench, label: "Repuestos y filtros" },
              { icon: Gauge, label: "Kilometraje" },
              { icon: ShieldCheck, label: "Historial seguro" },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 rounded-xl bg-white/5 backdrop-blur px-4 py-3 ring-1 ring-white/10">
                <span className="h-9 w-9 rounded-lg flex items-center justify-center"
                      style={{ background: "var(--gradient-accent)" }}>
                  <Icon className="h-4 w-4 text-white" />
                </span>
                <span className="text-sm font-medium text-white/90">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/40">© {new Date().getFullYear()} LubriAuto · Todos los derechos reservados</p>
      </aside>

      {/* Form side */}
      <main className="relative flex items-center justify-center px-5 py-10 sm:px-8">
        <ThemeToggle className="absolute top-4 right-4 z-20 text-muted-foreground hover:text-foreground" />
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="h-36 w-36 shrink-0 rounded-3xl bg-white dark:bg-white/10 dark:backdrop-blur p-1 flex items-center justify-center ring-1 ring-[color-mix(in_oklab,var(--brand-navy)_12%,transparent)] dark:ring-white/15 shadow-[var(--shadow-card)]">
              <img src={logoUrl} alt="LubriAuto" className="h-full w-full object-contain rounded-2xl" />
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground leading-relaxed">
              Lleva el control total de los servicios, cambios de aceite, filtros y repuestos de tu auto en una sola app.
            </p>
          </div>

          <Card className="border-0 shadow-none lg:border lg:shadow-[var(--shadow-card)] p-0 lg:p-8 bg-transparent lg:bg-card">
            <form className="space-y-5 lg:mt-0 mt-2" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="usuario">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="usuario"
                    type="text"
                    required
                    autoComplete="username"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder="tu@correo.com"
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <button
                    type="button"
                    onClick={() => setResetOpen(true)}
                    className="text-xs font-medium hover:underline"
                    style={{ color: "var(--brand-orange)" }}
                  >
                    ¿La olvidaste?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-12 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Mostrar contraseña"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="remember" checked={recordar} onCheckedChange={(v) => setRecordar(v === true)} />
                <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                  Mantener sesión iniciada
                </Label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-base font-semibold text-white border-0 hover:opacity-95 transition disabled:opacity-60"
                style={{ background: "var(--gradient-accent)", boxShadow: "var(--shadow-accent)" }}
              >
                {loading ? "Ingresando…" : "Iniciar sesión"}
              </Button>

              {bioVisible && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBiometric}
                  className="w-full h-12 rounded-xl text-base font-semibold"
                >
                  <Fingerprint className="h-5 w-5 mr-2" />
                  Entrar con biometría
                </Button>
              )}

              <InstallPwaButton className="w-full h-11 rounded-xl" />
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              ¿Aún no tienes cuenta?{" "}
              <Link to="/registro" className="font-semibold hover:underline" style={{ color: "var(--brand-navy)" }}>
                Regístrate gratis
              </Link>
            </p>
          </Card>
        </div>
      </main>

      <ResetPasswordDialog open={resetOpen} onOpenChange={setResetOpen} />
      <InstallPwaBanner />
    </div>
  );
}
