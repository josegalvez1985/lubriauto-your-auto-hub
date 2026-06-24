import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, History, Plus, Pencil, Trash2, Gauge, Wrench } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { autosApi, type Auto } from "@/lib/autos-api";
import { serviciosApi, type Servicio } from "@/lib/servicios-api";
import { mensajeLimpio } from "@/lib/auth-api";
import { ServicioFormDialog } from "@/components/servicio-form-dialog";

export const Route = createFileRoute("/historial")({
  validateSearch: (s: Record<string, unknown>): { nuevo?: boolean } => ({
    nuevo: s.nuevo === true || s.nuevo === "true" || s.nuevo === 1,
  }),
  head: () => ({
    meta: [
      { title: "LubriAuto — Historial" },
      { name: "description", content: "Historial de servicios y mantenimientos de tu vehículo." },
    ],
  }),
  component: HistorialPage,
});

function HistorialPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { nuevo } = Route.useSearch();
  const token = session?.token ?? "";

  const [autos, setAutos] = useState<Auto[]>([]);
  const [autoId, setAutoId] = useState<number | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loadingAutos, setLoadingAutos] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Servicio | null>(null);
  const [toDelete, setToDelete] = useState<Servicio | null>(null);

  useEffect(() => {
    if (session === null) return;
    if (!token) navigate({ to: "/" });
  }, [session, token, navigate]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoadingAutos(true);
      const r = await autosApi.lista(token);
      setLoadingAutos(false);
      if (r.ok) {
        const list = (r.autos ?? []).filter((a) => a.estado !== "N");
        setAutos(list);
        setAutoId((prev) => prev ?? list[0]?.id_auto ?? null);
      } else {
        toast.error(mensajeLimpio(r.error));
      }
    })();
  }, [token]);

  useEffect(() => {
    if (nuevo && autoId !== null) {
      setEditing(null);
      setFormOpen(true);
      navigate({ to: "/historial", search: {}, replace: true });
    }
  }, [nuevo, autoId, navigate]);

  const cargar = useCallback(async () => {
    if (!token || autoId === null) return;
    setLoading(true);
    const r = await serviciosApi.porAuto(token, autoId);
    setLoading(false);
    if (r.ok) setServicios(r.servicios ?? []);
    else toast.error(mensajeLimpio(r.error));
  }, [token, autoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleNuevo = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEditar = (s: Servicio) => {
    setEditing(s);
    setFormOpen(true);
  };

  const handleEliminar = async () => {
    if (!toDelete) return;
    const r = await serviciosApi.eliminar(token, toDelete.id_servicio);
    if (r.ok) {
      toast.success(r.mensaje ?? "Servicio eliminado");
      setToDelete(null);
      cargar();
    } else {
      toast.error(mensajeLimpio(r.error));
    }
  };

  const fmtMoneda = (n: number) =>
    new Intl.NumberFormat("es", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(n || 0);
  const fmtFecha = (f: string) =>
    new Date(f).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });

  const autoSel = autos.find((a) => a.id_auto === autoId) ?? null;
  const totalGastado = servicios.reduce((acc, s) => acc + (s.costo || 0), 0);

  return (
    <div className="min-h-screen bg-background pb-12">
      <header
        className="text-white px-5 sm:px-8 pt-8 pb-20 rounded-b-[2rem] relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="absolute -top-20 -right-10 w-72 h-72 rounded-full blur-3xl opacity-20"
             style={{ background: "var(--brand-orange)" }} />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 text-white/80 hover:text-white transition">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Volver</span>
            </Link>
            <Button
              onClick={handleNuevo}
              disabled={autoId === null}
              className="rounded-xl text-white border-0 h-10 disabled:opacity-50"
              style={{ background: "var(--gradient-accent)", boxShadow: "var(--shadow-accent)" }}
            >
              <Plus className="h-4 w-4 mr-1.5" /> Nuevo servicio
            </Button>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
              <History className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Historial</h1>
              <p className="text-white/60 text-sm">
                {autoSel ? `${autoSel.descripcion} · ${servicios.length} servicios` : "Selecciona un vehículo"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 sm:px-8 -mt-10 relative z-10 space-y-5">
        {/* Selector de auto */}
        {loadingAutos ? (
          <Card className="h-12 rounded-2xl animate-pulse bg-muted/50 border-0" />
        ) : autos.length === 0 ? (
          <Card className="p-8 rounded-2xl text-center shadow-[var(--shadow-card)]">
            <h3 className="font-bold text-lg">No tienes autos registrados</h3>
            <p className="text-sm text-muted-foreground mt-1">Agrega un vehículo para registrar servicios.</p>
            <Link to="/autos">
              <Button className="mt-5 rounded-xl text-white border-0" style={{ background: "var(--gradient-accent)" }}>
                Ir a mis autos
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {autos.map((a) => (
              <button
                key={a.id_auto}
                onClick={() => setAutoId(a.id_auto)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition border ${
                  a.id_auto === autoId
                    ? "bg-foreground text-background border-transparent"
                    : "bg-card text-foreground border-border hover:border-foreground/30"
                }`}
              >
                {a.descripcion}
              </button>
            ))}
          </div>
        )}

        {/* Totalizador */}
        {autos.length > 0 && !loading && servicios.length > 0 && (
          <Card className="p-4 rounded-2xl shadow-[var(--shadow-card)] flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total gastado</p>
              <p className="text-2xl font-bold" style={{ color: "var(--brand-orange)" }}>{fmtMoneda(totalGastado)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Servicios</p>
              <p className="text-2xl font-bold">{servicios.length}</p>
            </div>
          </Card>
        )}

        {/* Lista de servicios */}
        {autos.length > 0 && (
          loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Card key={i} className="h-20 rounded-2xl animate-pulse bg-muted/50 border-0" />
              ))}
            </div>
          ) : servicios.length === 0 ? (
            <Card className="p-10 rounded-2xl text-center shadow-[var(--shadow-card)]">
              <div className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
                   style={{ background: "color-mix(in oklab, var(--brand-navy) 10%, transparent)", color: "var(--brand-navy)" }}>
                <Wrench className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-lg">Sin servicios registrados</h3>
              <p className="text-sm text-muted-foreground mt-1">Registra el primer servicio de este vehículo.</p>
              <Button onClick={handleNuevo} className="mt-5 rounded-xl text-white border-0"
                      style={{ background: "var(--gradient-accent)" }}>
                <Plus className="h-4 w-4 mr-1.5" /> Registrar servicio
              </Button>
            </Card>
          ) : (
            <ul className="space-y-3">
              {servicios.map((s) => (
                <li key={s.id_servicio}>
                  <Card className="p-4 rounded-2xl shadow-[var(--shadow-card)] flex items-center gap-4">
                    <span className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center"
                          style={{ background: "color-mix(in oklab, var(--brand-navy) 10%, transparent)", color: "var(--brand-navy)" }}>
                      <Wrench className="h-5 w-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{s.descripcion}</p>
                      <p className="text-sm text-muted-foreground">
                        {fmtFecha(s.fecha)} · <Gauge className="inline h-3.5 w-3.5 -mt-0.5" /> {(s.km ?? 0).toLocaleString("es")} km
                      </p>
                    </div>
                    <span className="text-sm font-semibold shrink-0" style={{ color: "var(--brand-orange)" }}>
                      {fmtMoneda(s.costo)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="rounded-xl" onClick={() => handleEditar(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="rounded-xl text-destructive hover:text-destructive"
                              onClick={() => setToDelete(s)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )
        )}
      </main>

      {autoId !== null && (
        <ServicioFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          token={token}
          idAuto={autoId}
          servicio={editing}
          onSaved={cargar}
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.descripcion} se eliminará del historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEliminar}
                               className="rounded-xl bg-destructive text-white hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
