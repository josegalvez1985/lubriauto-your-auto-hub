import { useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUp,
  Check,
  Copy,
  RotateCcw,
  SquarePen,
  Sparkles,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { Markdown } from "@/components/markdown";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import {
  abrirAsistente,
  cargarManual,
  nuevaConversacion,
  preguntar,
  reintentar,
  useAsistente,
  type MensajeIA,
} from "@/lib/asistente";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * El asistente con IA: botón flotante y chat, en las pantallas con sesión.
 * Lógica y contrato en `lib/asistente.ts`; el backend, `backend/asistente.sql`.
 *
 * | | Botón | Chat |
 * | --- | --- | --- |
 * | Celular (`< lg`) | abajo a la derecha (en Inicio, encima de la barra) | hoja casi a pantalla completa |
 * | Escritorio (`≥ lg`) | abajo a la derecha | panel fijo a la derecha, **sin tapar** la pantalla, y sigue abierto al navegar |
 */

/** Pantallas sin sesión: ahí no hay asistente. */
const SIN_ASISTENTE = new Set(["/", "/registro"]);

/** Nombre de cada pantalla, para la IA ("¿cómo uso esta pantalla?"). */
const PANTALLAS: Record<string, string> = {
  "/dashboard": "Inicio",
  "/autos": "Mis vehículos",
  "/historial": "Historial",
  "/profile": "Ajustes",
  "/manual": "Manual de uso",
};

const ANCHO_PANEL = "lg:mr-[420px]";

/**
 * Envuelve las pantallas: monta el asistente cuando hay sesión y, en la
 * computadora, les hace lugar al panel abierto.
 */
export function ContenedorAsistente({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const token = session?.token ?? "";
  const { abierto } = useAsistente(token);
  const visible = !!session && !SIN_ASISTENTE.has(pathname);

  return (
    <>
      <div className={cn(visible && abierto && ANCHO_PANEL)}>{children}</div>
      {visible && <Asistente token={token} pathname={pathname} />}
    </>
  );
}

function Asistente({ token, pathname }: { token: string; pathname: string }) {
  const { abierto, pendiente } = useAsistente(token);
  const escritorio = useEscritorio();
  // En Inicio, en el celular, hay una barra fija abajo.
  const conBarra = pathname === "/dashboard";

  return (
    <>
      {!(escritorio && abierto) && (
        <BotonFlotante conBarra={conBarra} escritorio={escritorio} pendiente={pendiente} />
      )}

      {escritorio ? (
        abierto && (
          <aside
            aria-label="Asistente"
            className="animate-in slide-in-from-right fade-in fixed inset-y-0 right-0 z-40 flex w-[420px] flex-col border-l border-border/70 bg-background shadow-[var(--shadow-brand)] duration-200"
          >
            <PanelChat escritorio token={token} pathname={pathname} />
          </aside>
        )
      ) : (
        <Drawer open={abierto} onOpenChange={abrirAsistente} shouldScaleBackground={false}>
          <DrawerContent className="h-[94dvh] border-border/60 lg:hidden">
            <DrawerTitle className="sr-only">Asistente</DrawerTitle>
            <DrawerDescription className="sr-only">
              Pregúntale cómo se usa la app o sobre tus vehículos y servicios
            </DrawerDescription>
            <PanelChat escritorio={false} token={token} pathname={pathname} />
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* El botón flotante: se puede arrastrar                                       */
/* -------------------------------------------------------------------------- */

/** Dónde lo dejó el usuario: pegado a un costado, a cierta altura del borde de abajo. */
type Posicion = { lado: "izq" | "der"; abajo: number };

const CLAVE_POSICION = "asistente-boton";
const TAMANO = 56; // size-14
const MARGEN = 16;
// Más de esto es arrastrar; menos, un toque que abre el chat.
const UMBRAL = 6;
// En Inicio, en el celular, la barra fija de abajo.
const ALTO_BARRA = 92;

function leerPosicion(): Posicion | null {
  try {
    const p = JSON.parse(localStorage.getItem(CLAVE_POSICION) ?? "null") as Posicion | null;
    return p && (p.lado === "izq" || p.lado === "der") && typeof p.abajo === "number" ? p : null;
  } catch {
    return null;
  }
}

function guardarPosicion(p: Posicion) {
  try {
    localStorage.setItem(CLAVE_POSICION, JSON.stringify(p));
  } catch {
    // sin almacenamiento: vale para esta visita
  }
}

function BotonFlotante({
  conBarra,
  escritorio,
  pendiente,
}: {
  conBarra: boolean;
  escritorio: boolean;
  pendiente: boolean;
}) {
  const [posicion, setPosicion] = useState<Posicion | null>(null);
  // Mientras se arrastra: la esquina de arriba a la izquierda, en px.
  const [arrastre, setArrastre] = useState<{ x: number; y: number } | null>(null);
  const inicio = useRef<{ px: number; py: number; x: number; y: number; movido: boolean } | null>(
    null,
  );
  // Un arrastre termina con un click del navegador: ese no abre el chat.
  const ignorarClick = useRef(false);

  useEffect(() => {
    setPosicion(leerPosicion());
  }, []);

  const minAbajo = conBarra && !escritorio ? ALTO_BARRA : MARGEN;
  const limitarY = (y: number) =>
    Math.min(Math.max(y, MARGEN), window.innerHeight - TAMANO - minAbajo);

  const abrir = () => {
    void cargarManual(); // que esté listo para la primera pregunta
    abrirAsistente(true);
  };

  const estilo: React.CSSProperties = {
    background: "var(--gradient-accent)",
    boxShadow: "var(--shadow-accent)",
  };
  if (arrastre) {
    Object.assign(estilo, { left: arrastre.x, top: arrastre.y, right: "auto", bottom: "auto" });
  } else if (posicion) {
    // Si la ventana se achicó, que no quede afuera.
    const abajo = Math.min(
      Math.max(posicion.abajo, minAbajo),
      window.innerHeight - TAMANO - MARGEN,
    );
    Object.assign(estilo, {
      left: posicion.lado === "izq" ? MARGEN : "auto",
      right: posicion.lado === "der" ? MARGEN : "auto",
      bottom: abajo,
    });
  }

  return (
    <button
      type="button"
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        // En el celular, tras arrastrar a veces no llega el click: que no se trague este toque.
        ignorarClick.current = false;
        const r = e.currentTarget.getBoundingClientRect();
        inicio.current = { px: e.clientX, py: e.clientY, x: r.left, y: r.top, movido: false };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const i = inicio.current;
        if (!i) return;
        const dx = e.clientX - i.px;
        const dy = e.clientY - i.py;
        if (!i.movido && Math.hypot(dx, dy) < UMBRAL) return;
        i.movido = true;
        setArrastre({
          x: Math.min(Math.max(i.x + dx, MARGEN), window.innerWidth - TAMANO - MARGEN),
          y: limitarY(i.y + dy),
        });
      }}
      onPointerUp={() => {
        const i = inicio.current;
        inicio.current = null;
        if (!i?.movido || !arrastre) return;
        // Se pega al costado más cercano y queda a la altura donde lo soltó.
        const nueva: Posicion = {
          lado: arrastre.x + TAMANO / 2 < window.innerWidth / 2 ? "izq" : "der",
          abajo: window.innerHeight - arrastre.y - TAMANO,
        };
        setPosicion(nueva);
        guardarPosicion(nueva);
        setArrastre(null);
        ignorarClick.current = true;
      }}
      onPointerCancel={() => {
        inicio.current = null;
        setArrastre(null);
      }}
      onClick={() => {
        if (ignorarClick.current) {
          ignorarClick.current = false;
          return;
        }
        abrir();
      }}
      aria-label="Abrir el asistente (se puede arrastrar)"
      title="Asistente: tócalo para abrirlo o arrástralo para moverlo"
      className={cn(
        "fixed z-40 grid size-14 touch-none select-none place-items-center rounded-full text-white",
        arrastre
          ? "scale-110 cursor-grabbing"
          : "cursor-grab transition-[left,right,bottom,transform] duration-200 active:scale-95",
        !posicion &&
          !arrastre &&
          cn(
            "right-4 lg:right-6 lg:bottom-6",
            conBarra ? "bottom-[calc(5.75rem+env(safe-area-inset-bottom))]" : "bottom-4",
          ),
      )}
      style={estilo}
    >
      <Sparkles className="size-6" />
      {pendiente && (
        <span className="absolute top-0.5 right-0.5 flex size-3.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/70" />
          <span className="relative inline-flex size-3.5 rounded-full border-2 border-white bg-destructive" />
        </span>
      )}
    </button>
  );
}

/** `≥ lg`, el mismo corte que usan las pantallas. */
function useEscritorio() {
  return useSyncExternalStore(
    (f) => {
      const mq = window.matchMedia("(min-width: 1024px)");
      mq.addEventListener("change", f);
      return () => mq.removeEventListener("change", f);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => false,
  );
}

/* -------------------------------------------------------------------------- */
/* El chat                                                                     */
/* -------------------------------------------------------------------------- */

function PanelChat({
  escritorio,
  token,
  pathname,
}: {
  escritorio: boolean;
  token: string;
  pathname: string;
}) {
  const { mensajes, pendiente, usadasHoy, limite } = useAsistente(token);
  const nombrePantalla = PANTALLAS[pathname] ?? null;
  const pantalla = nombrePantalla ? `${nombrePantalla} (${pathname})` : pathname;
  const [texto, setTexto] = useState("");
  const lista = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLTextAreaElement>(null);

  // Siempre a la vista lo último: la pregunta recién mandada y la respuesta.
  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: "smooth" });
  }, [mensajes.length, pendiente]);

  // En la computadora se escribe enseguida; en el celular no se abre el
  // teclado solo, que tapa la mitad de la hoja.
  useEffect(() => {
    if (escritorio) entrada.current?.focus();
  }, [escritorio]);

  // Escape cierra el panel de la computadora (la hoja del celular ya lo hace).
  useEffect(() => {
    if (!escritorio) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") abrirAsistente(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [escritorio]);

  const enviar = (t = texto) => {
    if (!t.trim() || pendiente) return;
    void preguntar(t, pantalla, token);
    setTexto("");
    entrada.current?.style.removeProperty("height");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      enviar();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Cabecera */}
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-full text-white"
          style={{ background: "var(--gradient-accent)" }}
        >
          <Sparkles className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] leading-tight font-bold">Asistente</h2>
          <p className="truncate text-[11.5px] leading-tight text-muted-foreground">
            Sobre la app o sobre tus vehículos
          </p>
        </div>
        {mensajes.length > 0 && (
          <button
            type="button"
            onClick={nuevaConversacion}
            disabled={pendiente}
            title="Nueva conversación"
            aria-label="Nueva conversación"
            className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-40"
          >
            <SquarePen className="size-[18px]" />
          </button>
        )}
        <button
          type="button"
          onClick={() => abrirAsistente(false)}
          title="Cerrar"
          aria-label="Cerrar el asistente"
          className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Conversación */}
      <div ref={lista} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {mensajes.length === 0 ? (
          <Bienvenida pantalla={nombrePantalla} onElegir={enviar} />
        ) : (
          mensajes.map((m, i) => (
            <Mensaje
              key={m.id}
              m={m}
              ultimo={i === mensajes.length - 1}
              onReintentar={() => reintentar(pantalla, token)}
            />
          ))
        )}
        {pendiente && <Pensando />}
      </div>

      {/* Entrada */}
      <div className="border-t border-border/60 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2 rounded-[6px] border border-border bg-card px-3 py-2 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15">
          <textarea
            ref={entrada}
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              // Crece con el texto hasta unas 6 líneas.
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
            }}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={4000}
            enterKeyHint="send"
            placeholder="Escribe tu pregunta…"
            aria-label="Tu pregunta"
            className="max-h-[150px] min-h-[24px] flex-1 resize-none bg-transparent py-1 text-[14.5px] leading-snug outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => enviar()}
            disabled={!texto.trim() || pendiente}
            aria-label="Enviar"
            className="grid size-9 shrink-0 place-items-center rounded-[6px] bg-primary text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
          >
            <ArrowUp className="size-[18px]" />
          </button>
        </div>
        <p className="mt-1.5 px-1 text-center text-[10.5px] leading-tight text-muted-foreground">
          Responde una IA con tus datos: revisa lo importante.
          {usadasHoy != null && limite != null && (
            <>
              {" "}
              Hoy: {usadasHoy} de {limite} preguntas.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function Bienvenida({
  pantalla,
  onElegir,
}: {
  pantalla: string | null;
  onElegir: (t: string) => void;
}) {
  const sugerencias = [
    pantalla && pantalla !== "Inicio" ? `¿Cómo se usa ${pantalla}?` : null,
    "¿Cuándo fue mi último cambio de aceite?",
    "¿Cuánto gasté en mantenimiento este año?",
    "¿Qué servicios le hice a mi auto?",
    "¿Cómo descargo el historial en PDF?",
  ].filter((s): s is string => !!s);

  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <span
        className="grid size-14 place-items-center rounded-2xl text-white shadow-[var(--shadow-card)]"
        style={{ background: "var(--gradient-accent)" }}
      >
        <Sparkles className="size-7" />
      </span>
      <p className="mt-3 text-lg font-bold">¿En qué te ayudo?</p>
      <p className="mt-1 max-w-[19rem] text-[13px] text-muted-foreground">
        Pregúntame cómo se usa la app o cualquier cosa sobre tus vehículos: servicios, gastos,
        kilometraje, cambios de aceite…
      </p>
      <div className="mt-5 flex w-full flex-col gap-2">
        {sugerencias.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onElegir(s)}
            className="rounded-[6px] border border-border/70 bg-card px-3.5 py-2.5 text-left text-[13.5px] transition hover:border-primary/40 hover:bg-muted"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function Mensaje({
  m,
  ultimo,
  onReintentar,
}: {
  m: MensajeIA;
  ultimo: boolean;
  onReintentar: () => void;
}) {
  if (m.rol === "usuario") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-[14px] leading-snug whitespace-pre-wrap text-primary-foreground">
          {m.texto}
        </p>
      </div>
    );
  }

  if (m.error) {
    return (
      <div className="rounded-[6px] border border-destructive/30 bg-destructive/5 px-3.5 py-3">
        <p className="flex items-start gap-2 text-[13.5px] text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{m.texto}</span>
        </p>
        {ultimo && (
          <button
            type="button"
            onClick={onReintentar}
            className="mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-[6px] bg-muted px-3.5 text-[13px] font-semibold"
          >
            <RotateCcw className="size-3.5" />
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Markdown texto={m.texto} />
      <BotonCopiar texto={m.texto} />
    </div>
  );
}

function BotonCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          ?.writeText(texto)
          .then(() => {
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1500);
          })
          .catch(() => toast.error("No se pudo copiar"));
      }}
      className="inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[11.5px] font-medium text-muted-foreground hover:bg-muted"
    >
      {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copiado ? "Copiado" : "Copiar"}
    </button>
  );
}

/**
 * Mientras espera. No hay avance real que mostrar (la respuesta llega
 * entera), así que el texto cambia con el tiempo: una pregunta sobre datos
 * suele llevar varias consultas.
 */
function Pensando() {
  const [segundos, setSegundos] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const texto =
    segundos < 4
      ? "Pensando…"
      : segundos < 15
        ? "Revisando tus datos…"
        : `Sigue trabajando… (${segundos} s)`;

  return (
    <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground" aria-live="polite">
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-primary/70"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
      {texto}
    </div>
  );
}
