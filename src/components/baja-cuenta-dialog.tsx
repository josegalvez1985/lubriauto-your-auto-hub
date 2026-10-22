import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, TriangleAlert } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { mensajeLimpio } from "@/lib/auth-api";
import { biometricDisable } from "@/lib/biometric";
import { cuentaApi } from "@/lib/cuenta-api";

export function BajaCuentaDialog({
  open, onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [motivo, setMotivo] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cada vez que se abre, de cero: es una acción que no se deshace sola.
  useEffect(() => {
    if (open) {
      setPassword("");
      setMotivo("");
      setShowPwd(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setLoading(true);
    const r = await cuentaApi.inactivar(session.token, password, motivo.trim() || undefined);
    setLoading(false);
    if (r.ok) {
      toast.success(r.mensaje ?? "Tu cuenta fue dada de baja.");
      onOpenChange(false);
      biometricDisable();
      logout();
      navigate({ to: "/" });
    } else {
      toast.error(mensajeLimpio(r.error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Dar de baja mi cuenta</DialogTitle>
          <DialogDescription>
            Tu cuenta quedará inactiva y se cerrará la sesión en todos tus dispositivos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="flex gap-3 rounded-[6px] border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
            <p className="text-muted-foreground">
              No podrás entrar con este usuario. Tus vehículos y servicios no se borran: si cambias
              de idea, toca «Regístrate gratis» con el mismo correo y podrás reactivar tu cuenta.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="baja-motivo">
              ¿Por qué te vas? <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea id="baja-motivo" rows={3} maxLength={1000}
                      value={motivo} onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Nos ayuda a mejorar" className="rounded-[6px] resize-none" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="baja-password">Confirma con tu contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="baja-password" type={showPwd ? "text" : "password"} required
                     autoComplete="current-password"
                     value={password} onChange={(e) => setPassword(e.target.value)}
                     placeholder="••••••••" className="pl-10 pr-10 h-12 rounded-[6px]" />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading || !password}
                  className="w-full h-12 rounded-[6px] bg-destructive text-white hover:bg-destructive/90 disabled:opacity-60">
            {loading ? "Procesando…" : "Dar de baja mi cuenta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
