import { useState } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi, mensajeLimpio } from "@/lib/auth-api";

export function ChangePasswordDialog({
  open, onOpenChange, username,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
}) {
  const [actual, setActual] = useState("");
  const [nuevo, setNuevo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevo.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    const r = await authApi.cambiarPassword(username, actual, nuevo);
    setLoading(false);
    if (r.ok) {
      toast.success(r.mensaje ?? "Contraseña actualizada");
      onOpenChange(false);
      setActual("");
      setNuevo("");
    } else {
      toast.error(mensajeLimpio(r.error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            Ingresa tu contraseña actual y la nueva.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Field id="pwd-actual" label="Contraseña actual">
            <Input id="pwd-actual" type="password" required autoComplete="current-password"
                   value={actual} onChange={(e) => setActual(e.target.value)}
                   placeholder="••••••••" className="pl-10 h-12 rounded-xl" />
          </Field>
          <Field id="pwd-nueva" label="Nueva contraseña">
            <Input id="pwd-nueva" type="password" required autoComplete="new-password" minLength={6}
                   value={nuevo} onChange={(e) => setNuevo(e.target.value)}
                   placeholder="Mínimo 6 caracteres" className="pl-10 h-12 rounded-xl" />
          </Field>
          <Button type="submit" disabled={loading}
                  className="w-full h-12 rounded-xl text-white border-0 disabled:opacity-60"
                  style={{ background: "var(--gradient-accent)" }}>
            {loading ? "Guardando…" : "Actualizar contraseña"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {children}
      </div>
    </div>
  );
}
