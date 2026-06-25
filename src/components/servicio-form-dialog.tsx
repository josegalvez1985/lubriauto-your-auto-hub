import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { serviciosApi, type Servicio } from "@/lib/servicios-api";
import { mensajeLimpio } from "@/lib/auth-api";
import { formatMiles, parseMiles } from "@/lib/formato";

const SUGERENCIAS_SERVICIO = [
  // === ACEITE DE MOTOR ===
  "Cambio de aceite 5W-30",
  "Cambio de aceite 5W-40",
  "Cambio de aceite 10W-40",
  "Cambio de aceite 15W-40",
  "Cambio de aceite 20W-50",
  "Cambio de aceite sintético",
  "Cambio de aceite semisintético",
  "Cambio de aceite mineral",
  "Cambio de aceite y filtro",

  // === FILTROS ===
  "Cambio de filtro de aceite",
  "Cambio de filtro de aire",
  "Cambio de filtro de combustible",
  "Cambio de filtro de habitáculo / polen",
  "Cambio de filtro de caja automática",
  "Cambio de filtro secador (A/C)",

  // === ENCENDIDO Y COMBUSTIBLE ===
  "Cambio de bujías",
  "Cambio de bujías de precalentamiento (diésel)",
  "Cambio de bobinas de encendido",
  "Cambio de cables de bujías",
  "Cambio de distribuidor",
  "Limpieza de inyectores",
  "Cambio de inyectores",
  "Cambio de bomba de combustible",
  "Cambio de bomba de inyección (diésel)",
  "Cambio de regulador de presión de combustible",
  "Limpieza de cuerpo de aceleración",
  "Cambio de cuerpo de aceleración",
  "Cambio de sensor de oxígeno (sonda lambda)",
  "Cambio de sensor MAF",
  "Cambio de sensor MAP",
  "Cambio de sensor de cigüeñal (CKP)",
  "Cambio de sensor de árbol de levas (CMP)",
  "Cambio de sensor de temperatura (ECT)",
  "Cambio de sensor TPS",
  "Cambio de válvula EGR",
  "Cambio de válvula IAC (ralentí)",
  "Cambio de tapa de combustible",
  "Cambio de cánister / válvula purga",

  // === DISTRIBUCIÓN Y CORREAS ===
  "Cambio de correa de distribución",
  "Cambio de cadena de distribución",
  "Cambio de correa de accesorios",
  "Cambio de tensor de correa",
  "Cambio de poleas / rodillos",
  "Cambio de kit de distribución",

  // === REFRIGERACIÓN ===
  "Cambio de refrigerante",
  "Cambio de bomba de agua",
  "Cambio de termostato",
  "Cambio de radiador",
  "Cambio de mangueras de refrigeración",
  "Cambio de ventilador de radiador",
  "Cambio de tapa de radiador",
  "Cambio de depósito de expansión",
  "Cambio de intercooler",
  "Cambio de turbo",

  // === FRENOS ===
  "Cambio de pastillas de freno",
  "Cambio de discos de freno",
  "Cambio de balatas / zapatas",
  "Cambio de tambores de freno",
  "Cambio de líquido de frenos",
  "Cambio de cilindro de freno",
  "Cambio de bomba de freno",
  "Cambio de cáliper / mordaza",
  "Cambio de mangueras / latiguillos de freno",
  "Cambio de cable de freno de mano",
  "Cambio de servofreno",
  "Rectificado de discos",
  "Revisión de frenos",

  // === SUSPENSIÓN Y DIRECCIÓN ===
  "Cambio de amortiguadores",
  "Cambio de espirales / resortes",
  "Cambio de rótulas",
  "Cambio de terminales de dirección",
  "Cambio de bujes de suspensión",
  "Cambio de bieletas",
  "Cambio de barra estabilizadora",
  "Cambio de parrillas / horquillas",
  "Cambio de bases de amortiguador",
  "Cambio de rodamientos / mazas",
  "Cambio de cremallera de dirección",
  "Cambio de bomba de dirección hidráulica",
  "Cambio de líquido de dirección",
  "Cambio de cardán / junta homocinética",
  "Cambio de fuelles / guardapolvos",
  "Alineación y balanceo",
  "Revisión de suspensión",

  // === TRANSMISIÓN / EMBRAGUE ===
  "Cambio de aceite de caja",
  "Cambio de kit de embrague",
  "Cambio de disco de embrague",
  "Cambio de prensa / collarín",
  "Cambio de volante motor / bimasa",
  "Cambio de aceite de transmisión automática",
  "Cambio de aceite de diferencial",
  "Cambio de crucetas",
  "Cambio de semiejes / palieres",

  // === NEUMÁTICOS Y LLANTAS ===
  "Cambio de neumáticos",
  "Rotación de neumáticos",
  "Reparación de neumático",
  "Cambio de llantas / rines",
  "Cambio de válvulas de aire",
  "Cambio de sensores TPMS",

  // === SISTEMA ELÉCTRICO ===
  "Cambio de batería",
  "Cambio de alternador",
  "Cambio de motor de arranque",
  "Cambio de fusibles",
  "Cambio de relés",
  "Cambio de focos / luces",
  "Cambio de faros / ópticas",
  "Cambio de bombillas LED",
  "Cambio de switch / interruptor de encendido",
  "Cambio de cables de batería",
  "Cambio de bocina / claxon",
  "Cambio de motor limpiaparabrisas",
  "Cambio de escobillas limpiaparabrisas",

  // === MOTOR GENERAL ===
  "Cambio de empaque de culata",
  "Cambio de junta de tapa de válvulas",
  "Cambio de retenes de motor",
  "Cambio de soportes de motor",
  "Cambio de válvula PCV",
  "Cambio de cárter",
  "Cambio de bomba de aceite",
  "Ajuste de válvulas",
  "Rectificación de motor",
  "Cambio de pistones / anillos",
  "Cambio de bielas / metales",
  "Reparación de motor",
  "Cambio de catalizador",
  "Cambio de silenciador / mofle",
  "Cambio de escape / tubo de escape",
  "Cambio de múltiple de admisión",

  // === AIRE ACONDICIONADO / CLIMA ===
  "Recarga de gas A/C",
  "Cambio de compresor A/C",
  "Cambio de condensador A/C",
  "Cambio de evaporador A/C",
  "Cambio de ventilador de habitáculo",
  "Cambio de calefacción / heater",

  // === CARROCERÍA E INTERIOR ===
  "Cambio de parabrisas",
  "Cambio de vidrios / ventanas",
  "Cambio de elevavidrios",
  "Cambio de espejos retrovisores",
  "Cambio de plumillas / gomas",
  "Cambio de cerraduras / chapas",
  "Cambio de manijas de puerta",
  "Cambio de paragolpes / parachoques",
  "Cambio de tapizado / asientos",
  "Cambio de alfombras / tapetes",
  "Pintura / chapa y pintura",

  // === FLUIDOS ===
  "Cambio de líquido limpiaparabrisas",
  "Cambio de aditivos",

  // === DIAGNÓSTICO / GENERAL ===
  "Scanner / diagnóstico",
  "Revisión general",
  "Mantenimiento preventivo",
  "Inspección técnica vehicular (ITV)",
  "Lavado / detallado",

  // === MARCAS DE ACEITE ===
  "Liqui Moly 5W-30",
  "Liqui Moly 5W-40",
  "Liqui Moly 10W-40",
  "Castrol 5W-30",
  "Castrol 10W-40",
  "Castrol GTX 20W-50",
  "Mobil 1 5W-30",
  "Mobil Super 10W-40",
  "Shell Helix 5W-30",
  "Shell Helix 10W-40",
  "Total Quartz 5W-30",
  "Total Quartz 10W-40",
  "Valvoline 5W-30",
  "Motul 5W-30",
  "Motul 8100 5W-40",
  "Petronas Syntium 5W-30",
  "Repsol 5W-30",
  "ELF Evolution 5W-40",
  "Bardahl 10W-40",
];

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
  const [showSugerencias, setShowSugerencias] = useState(false);

  const ultimaLinea = descripcion.split("\n").pop() ?? "";
  const sugerencias = ultimaLinea.trim().length > 0
    ? SUGERENCIAS_SERVICIO.filter((s) =>
        s.toLowerCase().includes(ultimaLinea.trim().toLowerCase()) &&
        s.toLowerCase() !== ultimaLinea.trim().toLowerCase(),
      ).slice(0, 8)
    : [];

  const elegirSugerencia = (s: string) => {
    const lineas = descripcion.split("\n");
    lineas[lineas.length - 1] = s;
    setDescripcion(lineas.join("\n"));
    setShowSugerencias(false);
  };

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
          <div className="space-y-2 relative">
            <Label htmlFor="srv-desc">Descripción</Label>
            <Textarea
              id="srv-desc"
              required
              rows={4}
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                setShowSugerencias(true);
              }}
              onFocus={() => setShowSugerencias(true)}
              onBlur={() => setTimeout(() => setShowSugerencias(false), 150)}
              placeholder="Cambio de aceite 5W-30"
              className="rounded-xl resize-none"
            />
            {showSugerencias && sugerencias.length > 0 && (
              <ul className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border bg-popover text-popover-foreground shadow-md">
                {sugerencias.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => elegirSugerencia(s)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
