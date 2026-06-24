import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wrench, Bell, Car, Plus,
  CalendarClock, Settings, LogOut, Home as HomeIcon, History,
  ClipboardList as ServiceIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth";
import { autosApi, type Auto } from "@/lib/autos-api";
import { serviciosApi, type Servicio } from "@/lib/servicios-api";
import { InstallPwaBanner } from "@/components/install-pwa-banner";

const logoUrl = `${import.meta.env.BASE_URL}icon-512.png`;

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "LubriAuto — Panel" },
      { name: "description", content: "Resumen de mantenimiento, próximos servicios e historial de tu vehículo." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { session, logout } = useAuth();
  const token = session?.token ?? "";
  const [autos, setAutos] = useState<Auto[]>([]);
  const [autoId, setAutoId] = useState<number | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const auto = autos.find((a) => a.id_auto === autoId) ?? null;
  const ultimo = servicios[0] ?? null;

  useEffect(() => {
    if (!token) return;
    (async () => {
      const r = await autosApi.lista(token);
      const list = (r.ok ? (r.autos ?? []) : []).filter((a) => a.estado !== "N");
      setAutos(list);
      setAutoId(list[0]?.id_auto ?? null);
    })();
  }, [token]);

  useEffect(() => {
    if (!token || autoId === null) {
      setServicios([]);
      setCargando(false);
      return;
    }
    (async () => {
      setCargando(true);
      const s = await serviciosApi.porAuto(token, autoId);
      setServicios(s.ok ? (s.servicios ?? []) : []);
      setCargando(false);
    })();
  }, [token, autoId]);

  const diasDesde = (f?: string) => {
    if (!f) return null;
    const d = Math.floor((Date.now() - new Date(f).getTime()) / 86_400_000);
    return d < 0 ? 0 : d;
  };
  const dias = diasDesde(ultimo?.fecha);

  const KM_INTERVALO = 6000;
  const ultimoAceite = servicios.find((s) => /aceite/i.test(s.descripcion)) ?? null;
  const kmBase = ultimoAceite?.km ?? null;
  const kmActual = auto?.km_actual ?? ultimo?.km ?? null;
  const kmProximo = kmBase != null ? kmBase + KM_INTERVALO : null;
  const kmRestante = kmProximo != null && kmActual != null ? kmProximo - kmActual : null;

  const fmtMoneda = (n: number) =>
    new Intl.NumberFormat("es", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(n || 0);
  const fmtFecha = (f: string) =>
    new Date(f).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-0 overflow-x-hidden">
      {/* Top hero header */}
      <header
        className="text-white px-5 sm:px-8 pt-8 pb-24 rounded-b-[2rem] relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="absolute -top-20 -right-10 w-72 h-72 rounded-full blur-3xl opacity-20"
             style={{ background: "var(--brand-orange)" }} />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 px-1 py-1 -mx-1">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/10 backdrop-blur p-2 ring-1 ring-white/15 flex items-center justify-center">
                <img src={logoUrl} alt="LubriAuto" className="h-full w-full object-contain rounded-xl" />
              </div>
              <div>
                <p className="text-xs text-white/60">Hola de nuevo,</p>
                <p className="font-semibold">{session?.nombre ?? "Bienvenido"}</p>
              </div>
            </div>

            {/* Nav desktop (topbar) */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { icon: HomeIcon, label: "Inicio", active: true },
                { icon: Car, label: "Autos", to: "/autos" as const },
                { icon: History, label: "Historial", to: "/historial" as const },
                { icon: ServiceIcon, label: "Servicios", to: "/historial" as const },
                { icon: Bell, label: "Avisos" },
              ].map(({ icon: Icon, label, active, to }) => {
                const cls = `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                  active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`;
                const inner = (<><Icon className="h-4 w-4" />{label}</>);
                return to ? (
                  <Link key={label} to={to} className={cls}>{inner}</Link>
                ) : (
                  <button key={label} className={cls}>{inner}</button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle className="text-white hover:bg-white/10 rounded-full" />
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 rounded-full lg:hidden">
                <Bell className="h-5 w-5" />
              </Button>
              <Link to="/profile" className="hidden lg:block">
                <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 rounded-full">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/" onClick={() => logout()}>
                <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 rounded-full">
                  <LogOut className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Selector de vehículo (si hay más de uno) */}
          {autos.length > 1 && (
            <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
              {autos.map((a) => (
                <button
                  key={a.id_auto}
                  onClick={() => setAutoId(a.id_auto)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ring-1 ${
                    a.id_auto === autoId
                      ? "bg-white text-foreground ring-transparent"
                      : "bg-white/10 text-white/80 ring-white/15 hover:bg-white/20"
                  }`}
                >
                  {a.descripcion}
                </button>
              ))}
            </div>
          )}

          {/* Vehicle card */}
          <div className="mt-8 grid lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2 p-5 bg-white/10 backdrop-blur ring-1 ring-white/15 border-0 text-white rounded-2xl">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <Badge className="bg-white/15 text-white border-0 hover:bg-white/15">Vehículo activo</Badge>
                  <h2 className="mt-3 text-2xl font-bold truncate">
                    {cargando ? "Cargando…" : auto?.descripcion ?? "Sin vehículos"}
                  </h2>
                  <p className="text-white/60 text-sm">
                    {auto ? (auto.placa ? `Placa ${auto.placa}` : "Sin placa") : "Agrega tu primer auto"}
                  </p>
                </div>
                <Car className="h-10 w-10 text-white/40 shrink-0" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-6">
                <Stat
                  label="Kilometraje"
                  value={
                    ultimo?.km != null
                      ? `${ultimo.km.toLocaleString("es")} km`
                      : auto
                        ? `${auto.km_actual.toLocaleString("es")} km`
                        : "—"
                  }
                />
                <Stat
                  label="Último servicio"
                  value={dias === null ? "—" : dias === 0 ? "hoy" : `hace ${dias} ${dias === 1 ? "día" : "días"}`}
                />
              </div>
            </Card>

            <Card className="p-5 rounded-2xl border-0 text-white relative overflow-hidden"
                  style={{ background: "var(--gradient-accent)", boxShadow: "var(--shadow-accent)" }}>
              <CalendarClock className="absolute -right-4 -bottom-4 h-28 w-28 text-white/15" />
              <p className="text-xs uppercase tracking-wider text-white/80">Próximo cambio de aceite</p>
              <h3 className="text-xl font-bold mt-2">
                {kmProximo != null ? `${kmProximo.toLocaleString("es")} km` : "—"}
              </h3>
              <p className="text-white/90 text-sm mt-1">
                {kmRestante == null
                  ? "Registra un servicio para estimarlo."
                  : kmRestante > 0
                    ? `Faltan ${kmRestante.toLocaleString("es")} km`
                    : `Vencido por ${Math.abs(kmRestante).toLocaleString("es")} km`}
              </p>
              <Link to="/historial">
                <Button className="mt-5 bg-white text-foreground hover:bg-white/90 rounded-xl font-semibold">
                  Registrar servicio
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 sm:px-8 -mt-12 space-y-8 relative z-10">
        {/* History */}
        <section>
          <Card className="p-6 rounded-2xl shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-lg">Historial reciente</h3>
                <p className="text-sm text-muted-foreground">Últimos servicios registrados</p>
              </div>
              <Link to="/historial">
                <Button variant="ghost" size="sm" className="text-sm">Ver todo</Button>
              </Link>
            </div>
            {cargando ? (
              <ul className="divide-y divide-border">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex items-center gap-4 py-4">
                    <span className="h-11 w-11 rounded-xl bg-muted/50 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 rounded bg-muted/50 animate-pulse" />
                      <div className="h-2.5 w-1/3 rounded bg-muted/50 animate-pulse" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : servicios.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aún no hay servicios registrados.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {servicios.slice(0, 4).map((s) => (
                  <li key={s.id_servicio} className="flex items-center gap-4 py-4">
                    <span className="h-11 w-11 rounded-xl flex items-center justify-center"
                          style={{ background: "color-mix(in oklab, var(--brand-navy) 10%, transparent)", color: "var(--brand-navy)" }}>
                      <Wrench className="h-5 w-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{s.descripcion}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtFecha(s.fecha)}{s.km != null ? ` · ${s.km.toLocaleString("es")} km` : ""}
                      </p>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: "var(--brand-orange)" }}>{fmtMoneda(s.costo)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur border-t border-border px-2 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-30">
        <ul className="flex items-end justify-around">
          {[
            { icon: HomeIcon, label: "Inicio", active: true },
            { icon: Car, label: "Autos", to: "/autos" as const },
            { icon: Plus, label: "Servicio", primary: true, to: "/historial" as const, search: { nuevo: true } },
            { icon: History, label: "Historial", to: "/historial" as const },
            { icon: Settings, label: "Ajustes", to: "/profile" as const },
          ].map((it) => {
            const inner = (
              <>
                {it.primary ? (
                  <span className="h-12 w-12 -mt-7 rounded-full flex items-center justify-center text-white shadow-lg ring-4 ring-card"
                        style={{ background: "var(--gradient-accent)", boxShadow: "var(--shadow-accent)" }}>
                    <it.icon className="h-5 w-5" />
                  </span>
                ) : (
                  <it.icon className="h-5 w-5" />
                )}
                <span className="leading-none">{it.label}</span>
              </>
            );
            const cls = `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-[10px] font-medium transition ${
              it.active ? "text-foreground" : "text-muted-foreground"
            }`;
            return (
              <li key={it.label}>
                {it.to ? (
                  <Link to={it.to} search={it.search} className={cls}>{inner}</Link>
                ) : (
                  <button className={cls}>{inner}</button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <InstallPwaBanner liftOnMobile />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-white/50 truncate">{label}</p>
      <p className={`mt-1 text-sm sm:text-base font-bold ${accent ? "" : "text-white"}`}
         style={accent ? { color: "var(--brand-orange)" } : undefined}>
        {value}
      </p>
    </div>
  );
}