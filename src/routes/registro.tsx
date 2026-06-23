import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { User, Mail, Lock, AtSign, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { authApi, mensajeLimpio } from "@/lib/auth-api";
import { useAuth } from "@/lib/auth";

const logoUrl = `${import.meta.env.BASE_URL}icon-512.png`;

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "LubriAuto — Crear cuenta" },
      { name: "description", content: "Regístrate en LubriAuto y empieza a gestionar el mantenimiento de tu vehículo." },
    ],
  }),
  component: RegistroPage,
});

function RegistroPage() {
  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    const r = await authApi.registrar(username.trim(), email.trim(), nombre.trim(), password);
    if (!r.ok) {
      setLoading(false);
      toast.error(mensajeLimpio(r.error));
      return;
    }
    // Auto-login tras registro
    const l = await login(username.trim(), password);
    setLoading(false);
    if (l.ok) {
      navigate({ to: "/dashboard" });
    } else {
      toast.success("Cuenta creada. Inicia sesión para continuar.");
      navigate({ to: "/" });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-5 py-10">
      <ThemeToggle className="absolute top-4 right-4 z-20 text-muted-foreground hover:text-foreground" />
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="h-24 w-24 shrink-0 rounded-3xl bg-white dark:bg-white/10 p-3 flex items-center justify-center ring-1 ring-[color-mix(in_oklab,var(--brand-navy)_12%,transparent)] dark:ring-white/15 shadow-[var(--shadow-card)]">
            <img src={logoUrl} alt="LubriAuto" className="h-full w-full object-contain rounded-2xl" />
          </div>
        </div>

        <Card className="p-6 lg:p-8 rounded-2xl shadow-[var(--shadow-card)]">
          <div className="space-y-1.5 mb-7">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Crear cuenta</h2>
            <p className="text-sm text-muted-foreground">Únete y gestiona el mantenimiento de tu vehículo.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field id="nombre" label="Nombre completo" icon={User}>
              <Input id="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)}
                     placeholder="Jose Galvez" className="pl-10 h-12 rounded-xl" />
            </Field>

            <Field id="username" label="Nombre de usuario" icon={AtSign}>
              <Input id="username" required autoComplete="username" value={username}
                     onChange={(e) => setUsername(e.target.value)}
                     placeholder="jgalvez" className="pl-10 h-12 rounded-xl" />
            </Field>

            <Field id="email" label="Correo electrónico" icon={Mail}>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                     placeholder="tu@correo.com" className="pl-10 h-12 rounded-xl" />
            </Field>

            <Field id="password" label="Contraseña" icon={Lock}>
              <Input id="password" type={showPwd ? "text" : "password"} required autoComplete="new-password"
                     minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                     placeholder="Mínimo 6 caracteres" className="pl-10 pr-10 h-12 rounded-xl" />
              <button type="button" onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="Mostrar contraseña">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </Field>

            <Button type="submit" disabled={loading}
                    className="w-full h-12 rounded-xl text-base font-semibold text-white border-0 hover:opacity-95 transition disabled:opacity-60"
                    style={{ background: "var(--gradient-accent)", boxShadow: "var(--shadow-accent)" }}>
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </Button>
          </form>

          <Link to="/" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Ya tengo cuenta
          </Link>
        </Card>
      </div>
    </div>
  );
}

function Field({
  id, label, icon: Icon, children,
}: {
  id: string; label: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {children}
      </div>
    </div>
  );
}
