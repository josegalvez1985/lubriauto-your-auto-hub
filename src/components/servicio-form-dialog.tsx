import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { serviciosApi, type Servicio } from "@/lib/servicios-api";
import { mensajeLimpio } from "@/lib/auth-api";
import { formatMiles, parseMiles } from "@/lib/formato";

export function ServicioFormDialog({
  open, onOpenChange, token, idAuto, servicio, onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  idAuto: number;
  servicio?: Servicio | null;
  onSaved: () => void;
}) {
  const editando = !!servicio;
  const [descripcion, setDescripcion] = useState("");
  const [km, setKm] = useState("");
  const [costo, setCosto] = useState("");
  const [fecha, setFecha] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setDescripcion(servicio?.descripcion ?? "");
      setKm(servicio ? formatMiles(String(servicio.km)) : "");
      setCosto(servicio ? formatMiles(String(servicio.costo)) : "");
      setFecha(servicio?.fecha ?? new Date().toISOString().slice(0, 10));
    }
  }, [open, servicio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      descripcion: descripcion.trim(),
      km: parseMiles(km),
      costo: parseMiles(costo),
      fecha,
    };
    const r = editando
      ? await serviciosApi.actualizar(token, servicio!.id_servicio, payload)
      : await serviciosApi.crear(token, { id_auto: idAuto, ...payload });
    setLoading(false);
    if (r.ok) {
      toast.success(r.mensaje ?? (editando ? "Servicio actualizado" : "Servicio registrado"));
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
          <DialogTitle>{editando ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
          <DialogDescription>
            {editando ? "Actualiza los datos del servicio." : "Registra un servicio para este vehículo."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="srv-desc">Descripción</Label>
            <Input
              id="srv-desc"
              required
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Cambio de aceite 5W-30"
              className="h-12 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="srv-km">Kilometraje</Label>
              <Input
                id="srv-km"
                type="text"
                inputMode="numeric"
                value={km}
                onChange={(e) => setKm(formatMiles(e.target.value))}
                placeholder="46.500"
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="srv-costo">Costo</Label>
              <Input
                id="srv-costo"
                type="text"
                inputMode="numeric"
                value={costo}
                onChange={(e) => setCosto(formatMiles(e.target.value))}
                placeholder="180.000"
                className="h-12 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="srv-fecha">Fecha</Label>
            <Input
              id="srv-fecha"
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl text-white border-0 disabled:opacity-60"
            style={{ background: "var(--gradient-accent)" }}
          >
            {loading ? "Guardando…" : editando ? "Guardar cambios" : "Registrar servicio"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
