import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Car, Plus, Pencil, Trash2, Gauge } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { autosApi, type Auto } from "@/lib/autos-api";
import { mensajeLimpio } from "@/lib/auth-api";
import { AutoFormDialog } from "@/components/auto-form-dialog";

export const Route = createFileRoute("/autos")({
  head: () => ({
    meta: [
      { title: "LubriAuto — Mis autos" },
      { name: "description", content: "Gestiona los vehículos registrados en tu cuenta." },
    ],
  }),
  component: AutosPage,
});

function AutosPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const token = session?.token ?? "";

  const [autos, setAutos] = useState<Auto[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Auto | null>(null);
  const [toDelete, setToDelete] = useState<Auto | null>(null);

  useEffect(() => {
    if (session === null) return;
    if (!token) navigate({ to: "/" });
  }, [session, token, navigate]);

  const cargar = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const r = await autosApi.lista(token);
    setLoading(false);
    if (r.ok) setAutos(r.autos ?? []);
    else toast.error(mensajeLimpio(r.error));
  }, [token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleNuevo = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEditar = (a: Auto) => {
    setEditing(a);
    setFormOpen(true);
  };

  const handleEliminar = async () => {
    if (!toDelete) return;
    const r = await autosApi.eliminar(token, toDelete.id_auto);
    if (r.ok) {
      toast.success(r.mensaje ?? "Auto eliminado");
      setToDelete(null);
      cargar();
    } else {
      toast.error(mensajeLimpio(r.error));
    }
  };

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
              className="rounded-xl text-white border-0 h-10"
              style={{ background: "var(--gradient-accent)", boxShadow: "var(--shadow-accent)" }}
            >
              <Plus className="h-4 w-4 mr-1.5" /> Nuevo auto
            </Button>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
              <Car className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Mis autos</h1>
              <p className="text-white/60 text-sm">
                {autos.length} {autos.length === 1 ? "vehículo registrado" : "vehículos registrados"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 sm:px-8 -mt-10 relative z-10">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="h-24 rounded-2xl animate-pulse bg-muted/50 border-0" />
            ))}
          </div>
        ) : autos.length === 0 ? (
          <Card className="p-10 rounded-2xl text-center shadow-[var(--shadow-card)]">
            <div className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
                 style={{ background: "color-mix(in oklab, var(--brand-navy) 10%, transparent)", color: "var(--brand-navy)" }}>
              <Car className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-lg">No tienes autos registrados</h3>
            <p className="text-sm text-muted-foreground mt-1">Agrega tu primer vehículo para empezar.</p>
            <Button onClick={handleNuevo} className="mt-5 rounded-xl text-white border-0"
                    style={{ background: "var(--gradient-accent)" }}>
              <Plus className="h-4 w-4 mr-1.5" /> Agregar auto
            </Button>
          </Card>
        ) : (
          <ul className="space-y-3">
            {autos.map((a) => (
              <li key={a.id_auto}>
                <Card className="p-4 rounded-2xl shadow-[var(--shadow-card)] flex items-center gap-4">
                  <span className="h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-white"
                        style={{ background: "var(--gradient-brand)" }}>
                    <Car className="h-6 w-6" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{a.descripcion}</p>
                    <p className="text-sm text-muted-foreground">
                      Placa {a.placa} · <Gauge className="inline h-3.5 w-3.5 -mt-0.5" /> {a.km_actual.toLocaleString()} km
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="rounded-xl" onClick={() => handleEditar(a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="rounded-xl text-destructive hover:text-destructive"
                            onClick={() => setToDelete(a)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>

      <AutoFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        token={token}
        auto={editing}
        onSaved={cargar}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este auto?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.descripcion} (placa {toDelete?.placa}) se eliminará de tu cuenta.
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
