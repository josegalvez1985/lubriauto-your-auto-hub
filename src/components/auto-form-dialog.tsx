import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { autosApi, type Auto } from "@/lib/autos-api";
import { mensajeLimpio } from "@/lib/auth-api";
import { formatMiles, parseMiles } from "@/lib/formato";

export function AutoFormDialog({
  open, onOpenChange, token, auto, onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  auto?: Auto | null;
  onSaved: () => void;
}) {
  const editando = !!auto;
  const [descripcion, setDescripcion] = useState("");
  const [placa, setPlaca] = useState("");
  const [km, setKm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setDescripcion(auto?.descripcion ?? "");
      setPlaca(auto?.placa ?? "");
      setKm(auto ? formatMiles(String(auto.km_actual)) : "");
    }
  }, [open, auto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      descripcion: descripcion.trim(),
      placa: placa.trim(),
      km: parseMiles(km),
    };
    const r = editando
      ? await autosApi.actualizar(token, auto!.id_auto, payload)
      : await autosApi.crear(token, payload);
    setLoading(false);
    if (r.ok) {
      toast.success(r.mensaje ?? (editando ? "Auto actualizado" : "Auto creado"));
      onOpenChange(false);
      onSaved();
    } else {
      toast.error(mensajeLimpio(r.error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar auto" : "Nuevo auto"}</DialogTitle>
          <DialogDescription>
            {editando ? "Actualiza los datos de tu vehículo." : "Registra un vehículo en tu cuenta."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="auto-desc">Descripción</Label>
            <Input
              id="auto-desc"
              required
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Toyota Corolla 2018"
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auto-placa">Placa <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Input
              id="auto-placa"
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
              placeholder="ABC123"
              className="h-12 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auto-km">Kilometraje</Label>
            <Input
              id="auto-km"
              type="text"
              inputMode="numeric"
              required
              value={km}
              onChange={(e) => setKm(formatMiles(e.target.value))}
              placeholder="85.000"
              className="h-12 rounded-xl"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl text-white border-0 disabled:opacity-60"
            style={{ background: "var(--gradient-accent)" }}
          >
            {loading ? "Guardando…" : editando ? "Guardar cambios" : "Crear auto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
