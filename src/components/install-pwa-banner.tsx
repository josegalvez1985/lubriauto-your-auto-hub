import { useEffect, useState } from "react";
import { Download, Share, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const DISMISS_KEY = "pwa-banner-dismissed";
const logoUrl = `${import.meta.env.BASE_URL}icon-512.png`;

// Banner automático e intuitivo: aparece solo si la app es instalable y el
// usuario no lo cerró antes. En iOS muestra los pasos; en Android/desktop usa
// el prompt nativo.
// liftOnMobile: sube el banner para no tapar un bottom-nav fijo en móvil.
export function InstallPwaBanner({ liftOnMobile = false }: { liftOnMobile?: boolean }) {
  const { canInstall, ios, hasNativePrompt, promptInstall } = usePwaInstall();
  const [visible, setVisible] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (!canInstall) return;
    if (localStorage.getItem(DISMISS_KEY) === "true") return;
    // Pequeño delay para no aparecer de golpe al cargar.
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, [canInstall]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  const handleInstall = async () => {
    if (hasNativePrompt) {
      const ok = await promptInstall();
      if (ok) dismiss();
    } else if (ios) {
      setShowIosHelp(true);
    }
  };

  if (!visible) return null;

  return (
    <>
      <div className={`fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:bottom-6 lg:left-auto lg:right-6 lg:px-0 lg:inset-x-auto animate-in slide-in-from-bottom-4 fade-in duration-300 ${liftOnMobile ? "mb-20 lg:mb-0" : ""}`}>
        <div className="mx-auto w-full max-w-md lg:max-w-sm rounded-2xl bg-card border border-border shadow-[var(--shadow-card)] p-4 flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 rounded-xl bg-white p-1 ring-1 ring-border flex items-center justify-center">
            <img src={logoUrl} alt="LubriAuto" className="h-full w-full object-contain rounded-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">Instala LubriAuto</p>
            <p className="text-xs text-muted-foreground">Acceso rápido desde tu pantalla de inicio.</p>
          </div>
          <Button
            type="button"
            onClick={handleInstall}
            className="shrink-0 h-9 rounded-xl text-white border-0 text-sm"
            style={{ background: "var(--gradient-accent)" }}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Instalar
          </Button>
          <button
            onClick={dismiss}
            aria-label="Cerrar"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showIosHelp && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
             onClick={() => setShowIosHelp(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-lg text-foreground">Instalar en iPhone / iPad</h3>
              <button onClick={() => setShowIosHelp(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ol className="mt-4 space-y-4 text-sm text-muted-foreground">
              <li className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Share className="h-4 w-4" />
                </span>
                Toca el botón <strong className="text-foreground">Compartir</strong> en la barra de Safari.
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Plus className="h-4 w-4" />
                </span>
                Selecciona <strong className="text-foreground">Agregar a inicio</strong>.
              </li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
