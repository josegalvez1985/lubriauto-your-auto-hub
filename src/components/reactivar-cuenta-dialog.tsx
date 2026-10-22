import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, RotateCcw } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { mensajeLimpio } from "@/lib/auth-api";
import { cuentaApi } from "@/lib/cuenta-api";

// Desde el registro: el correo ya tiene una cuenta dada de baja. Se reactiva con
// la contraseña de esa cuenta o con una nueva que llega al correo.
export function ReactivarCuentaDialog({
  open, onOpenChange, email, passwordInicial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  passwordInicial: string;
}) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Viene con la que escribió en el registro: suele ser la misma de antes.
  useEffect(() => {
    if (open) {
      setPassword(passwordInicial);
      setShowPwd(false);
    }
  }, [open, passwordInicial]);

  const handleReactivar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await cuentaApi.reactivar(email, password);
    if (!r.ok) {
      setLoading(false);
      toast.error(mensajeLimpio(r.error));
      return;
    }
    const l = await login(email, password);
    setLoading(false);
    onOpenChange(false);
    if (l.ok) {
      toast.success("¡Bienvenido de vuelta! Tu cuenta fue reactivada.");
      navigate({ to: "/dashboard" });
    } else {
      toast.success("Tu cuenta fue reactivada. Inicia sesión para continuar.");
      navigate({ to: "/" });
    }
  };

  const handleCorreo = async () => {
    setEnviando(true);
    const r = await cuentaApi.reactivarPorCorreo(email);
    setEnviando(false);
    if (r.ok) {
      toast.success(r.mensaje ?? "Te enviamos una contraseña nueva a tu correo.");
      onOpenChange(false);
      navigate({ to: "/" });
    } else {
      toast.error(mensajeLimpio(r.error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Ya tienes una cuenta</DialogTitle>
          <DialogDescription>
            La cuenta de <span className="font-medium text-foreground">{email}</span> fue dada de baja.
            ¿Quieres reactivarla? Recuperas tus vehículos y servicios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleReactivar} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="react-password">Contraseña de tu cuenta</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="react-password" type={showPwd ? "text" : "password"} required
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
          <Button type="submit" disabled={loading || enviando || !password}
                  className="w-full h-12 rounded-[6px] text-white border-0 disabled:opacity-60"
                  style={{ background: "var(--gradient-accent)" }}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {loading ? "Reactivando…" : "Reactivar mi cuenta"}
          </Button>
          <button
            type="button"
            onClick={handleCorreo}
            disabled={loading || enviando}
            className="w-full text-center text-sm font-medium hover:underline disabled:opacity-60"
            style={{ color: "var(--brand-orange)" }}
          >
            {enviando ? "Enviando…" : "¿No la recuerdas? Envíame una contraseña nueva al correo"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
