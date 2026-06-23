import { useState } from "react";
import { Download, Share, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function InstallPwaButton({ className }: { className?: string }) {
  const { canInstall, ios, hasNativePrompt, promptInstall } = usePwaInstall();
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (!canInstall) return null;

  const handleClick = () => {
    if (hasNativePrompt) {
      promptInstall();
    } else if (ios) {
      setShowIosHelp(true);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        className={className}
      >
        <Download className="h-4 w-4 mr-2" />
        Instalar app
      </Button>

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
