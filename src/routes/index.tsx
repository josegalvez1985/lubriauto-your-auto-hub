import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Droplet, Wrench, Gauge, ShieldCheck, Eye, EyeOff, Mail, Lock } from "lucide-react";
import logoAsset from "@/assets/lubriauto-logo.asset.json";

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
          <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/15">
            <img src={logoAsset.url} alt="LubriAuto" className="h-10 w-10 object-contain" />
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
      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <img src={logoAsset.url} alt="LubriAuto" className="h-24 w-24 object-contain drop-shadow" />
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Mantenimiento vehicular
            </p>
          </div>

          <Card className="border-0 shadow-none lg:border lg:shadow-[var(--shadow-card)] p-0 lg:p-8 bg-transparent lg:bg-card">
            <div className="space-y-1.5 mb-7">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Bienvenido de vuelta
              </h2>
              <p className="text-sm text-muted-foreground">
                Inicia sesión para continuar con el mantenimiento de tu vehículo.
              </p>
            </div>

            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                // Demo: navega al dashboard
                window.location.href = "/dashboard";
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="tu@correo.com"
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <a href="#" className="text-xs font-medium hover:underline" style={{ color: "var(--brand-orange)" }}>
                    ¿La olvidaste?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    required
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
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                  Mantener sesión iniciada
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold text-white border-0 hover:opacity-95 transition"
                style={{ background: "var(--gradient-accent)", boxShadow: "var(--shadow-accent)" }}
              >
                Iniciar sesión
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background lg:bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground">
                    o continúa con
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button type="button" variant="outline" className="h-11 rounded-xl">
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
                  Google
                </Button>
                <Button type="button" variant="outline" className="h-11 rounded-xl">
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  Apple
                </Button>
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              ¿Aún no tienes cuenta?{" "}
              <Link to="/" className="font-semibold hover:underline" style={{ color: "var(--brand-navy)" }}>
                Regístrate gratis
              </Link>
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
}
