import { useState } from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi, mensajeLimpio } from "@/lib/auth-api";

export function ResetPasswordDialog({
  open, onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await authApi.resetPassword(email.trim());
    setLoading(false);
    if (r.ok) {
      toast.success(r.mensaje ?? "Si el email existe, se envió una nueva contraseña.");
      onOpenChange(false);
      setEmail("");
    } else {
      toast.error(mensajeLimpio(r.error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Recuperar contraseña</DialogTitle>
          <DialogDescription>
            Ingresa tu correo y te enviaremos una contraseña temporal.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Correo electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="pl-10 h-12 rounded-xl"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl text-white border-0 disabled:opacity-60"
            style={{ background: "var(--gradient-accent)" }}
          >
            {loading ? "Enviando…" : "Enviar contraseña temporal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
