import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Droplet, Wrench, Gauge, Bell, Car, Plus, Filter, ClipboardList,
  CalendarClock, ChevronRight, Settings, LogOut, Home as HomeIcon, History,
  ClipboardList as ServiceIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth";
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
            <Link to="/profile" className="flex items-center gap-3 rounded-2xl hover:bg-white/5 transition px-1 py-1 -mx-1">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/10 backdrop-blur p-2 ring-1 ring-white/15 flex items-center justify-center">
                <img src={logoUrl} alt="LubriAuto" className="h-full w-full object-contain rounded-xl" />
              </div>
              <div>
                <p className="text-xs text-white/60">Hola de nuevo,</p>
                <p className="font-semibold">{session?.nombre ?? "Bienvenido"}</p>
              </div>
            </Link>

            {/* Nav desktop (topbar) */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { icon: HomeIcon, label: "Inicio", active: true },
                { icon: Car, label: "Autos", to: "/autos" as const },
                { icon: History, label: "Historial" },
                { icon: ServiceIcon, label: "Servicios" },
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

          {/* Vehicle card */}
          <div className="mt-8 grid lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2 p-5 bg-white/10 backdrop-blur ring-1 ring-white/15 border-0 text-white rounded-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-white/15 text-white border-0 hover:bg-white/15">Vehículo activo</Badge>
                  <h2 className="mt-3 text-2xl font-bold">Toyota Corolla 2021</h2>
                  <p className="text-white/60 text-sm">Placa ABC-123 · Gasolina</p>
                </div>
                <Car className="h-10 w-10 text-white/40" />
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6">
                <Stat label="Kilometraje" value="48.250 km" />
                <Stat label="Último servicio" value="hace 28 días" />
                <Stat label="Estado" value="Óptimo" accent />
              </div>
            </Card>

            <Card className="p-5 rounded-2xl border-0 text-white relative overflow-hidden"
                  style={{ background: "var(--gradient-accent)", boxShadow: "var(--shadow-accent)" }}>
              <CalendarClock className="absolute -right-4 -bottom-4 h-28 w-28 text-white/15" />
              <p className="text-xs uppercase tracking-wider text-white/80">Próximo servicio</p>
              <h3 className="text-xl font-bold mt-2">Cambio de aceite</h3>
              <p className="text-white/90 text-sm mt-1">En 1.750 km o el 12 jul.</p>
              <Button className="mt-5 bg-white text-foreground hover:bg-white/90 rounded-xl font-semibold">
                Agendar ahora
              </Button>
            </Card>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 sm:px-8 -mt-12 space-y-8 relative z-10">
        {/* Quick actions */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Car, label: "Mis autos", to: "/autos" as const, cta: "Gestionar" },
            { icon: Droplet, label: "Cambio de aceite" },
            { icon: Filter, label: "Cambio de filtros" },
            { icon: Wrench, label: "Repuestos" },
          ].map(({ icon: Icon, label, to, cta }) => {
            const inner = (
              <>
                <span className="h-11 w-11 rounded-xl flex items-center justify-center text-white"
                      style={{ background: "var(--gradient-brand)" }}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-sm text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    {cta ?? "Registrar"} <ChevronRight className="h-3 w-3" />
                  </p>
                </div>
              </>
            );
            const cls = "group flex flex-col items-start gap-3 p-4 rounded-2xl bg-card border border-border hover:border-transparent hover:shadow-[var(--shadow-card)] transition text-left";
            return to ? (
              <Link key={label} to={to} className={cls}>{inner}</Link>
            ) : (
              <button key={label} className={cls}>{inner}</button>
            );
          })}
        </section>

        {/* History + reminders */}
        <section className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 rounded-2xl shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-lg">Historial reciente</h3>
                <p className="text-sm text-muted-foreground">Últimos servicios registrados</p>
              </div>
              <Button variant="ghost" size="sm" className="text-sm">Ver todo</Button>
            </div>
            <ul className="divide-y divide-border">
              {[
                { icon: Droplet, title: "Cambio de aceite 5W-30", date: "25 may 2026", km: "46.500 km", cost: "$ 180.000" },
                { icon: Filter, title: "Filtro de aire y combustible", date: "12 abr 2026", km: "44.120 km", cost: "$ 95.000" },
                { icon: Wrench, title: "Pastillas de freno delanteras", date: "03 mar 2026", km: "42.800 km", cost: "$ 240.000" },
                { icon: Gauge, title: "Alineación y balanceo", date: "18 feb 2026", km: "41.200 km", cost: "$ 70.000" },
              ].map((item) => (
                <li key={item.title} className="flex items-center gap-4 py-4">
                  <span className="h-11 w-11 rounded-xl flex items-center justify-center"
                        style={{ background: "color-mix(in oklab, var(--brand-navy) 10%, transparent)", color: "var(--brand-navy)" }}>
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.date} · {item.km}</p>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "var(--brand-orange)" }}>{item.cost}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 rounded-2xl shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">Recordatorios</h3>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {[
                { title: "Rotación de llantas", due: "En 800 km", urgent: true },
                { title: "Revisión de frenos", due: "12 ago 2026", urgent: false },
                { title: "Cambio de batería", due: "Sep 2026", urgent: false },
              ].map((r) => (
                <div key={r.title} className="p-4 rounded-xl border border-border hover:border-foreground/20 transition">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-sm">{r.title}</p>
                    {r.urgent && (
                      <Badge className="border-0 text-white text-[10px]"
                             style={{ background: "var(--brand-orange)" }}>
                        Pronto
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{r.due}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-5 rounded-xl">
              <Plus className="h-4 w-4 mr-1.5" /> Nuevo recordatorio
            </Button>
          </Card>
        </section>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur border-t border-border px-2 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-30">
        <ul className="flex items-end justify-around">
          {[
            { icon: HomeIcon, label: "Inicio", active: true },
            { icon: Car, label: "Autos", to: "/autos" as const },
            { icon: Plus, label: "Nuevo", primary: true, to: "/autos" as const },
            { icon: Bell, label: "Avisos" },
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
                  <Link to={it.to} className={cls}>{inner}</Link>
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