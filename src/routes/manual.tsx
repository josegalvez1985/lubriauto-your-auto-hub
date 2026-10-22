import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Search, Sparkles, X } from "lucide-react";
import manualMd from "../../MANUAL_USUARIO.md?raw";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Markdown } from "@/components/markdown";
import { useAuth } from "@/lib/auth";
import { abrirAsistente } from "@/lib/asistente";

export const Route = createFileRoute("/manual")({
  head: () => ({
    meta: [
      { title: "LubriAuto — Manual de uso" },
      {
        name: "description",
        content: "Cómo usar LubriAuto: vehículos, servicios, historial, ajustes y el asistente.",
      },
    ],
  }),
  component: ManualPage,
});

type Pregunta = { pregunta: string; respuesta: string };
type Seccion = { id: string; icono: string; titulo: string; cuerpo: string; preguntas: Pregunta[] };

/*
 * El manual es MANUAL_USUARIO.md (el mismo que lee el asistente), partido por
 * sus títulos `## `. Se saltea el índice (acá cada sección ya es un
 * desplegable) y las preguntas frecuentes (<details>) se vuelven un acordeón.
 */
function partir(md: string): { intro: string; secciones: Seccion[] } {
  const limpio = md
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<p align[\s\S]*?<\/p>/g, "")
    .replace(/^---\s*$/gm, "");
  const [cabecera, ...resto] = limpio.split(/^## /m);
  const intro = cabecera.replace(/^# .*$/m, "").trim();

  const secciones = resto
    .map((bloque, n) => {
      const [linea, ...cuerpo] = bloque.split("\n");
      const m = /^(\p{Extended_Pictographic}️?)\s*(.*)$/u.exec(linea.trim());
      const preguntas: Pregunta[] = [];
      const texto = cuerpo
        .join("\n")
        .replace(
          /<details>\s*<summary>(?:<b>)?([\s\S]*?)(?:<\/b>)?<\/summary>([\s\S]*?)<\/details>/g,
          (_, p: string, r: string) => {
            preguntas.push({ pregunta: p.trim(), respuesta: r.trim() });
            return "";
          },
        )
        .trim();
      return {
        id: `s${n}`,
        icono: m?.[1] ?? "📘",
        titulo: (m?.[2] ?? linea).trim(),
        cuerpo: texto,
        preguntas,
      };
    })
    .filter((s) => !/^contenido$/i.test(s.titulo));

  return { intro, secciones };
}

// Sin tildes ni mayúsculas: "vehiculo" encuentra "Vehículo".
const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const coincide = (s: Seccion, q: string) =>
  normalizar(
    [s.titulo, s.cuerpo, ...s.preguntas.flatMap((p) => [p.pregunta, p.respuesta])].join(" "),
  ).includes(q);

function ManualPage() {
  const { session } = useAuth();
  const { intro, secciones } = useMemo(() => partir(manualMd), []);
  const [busqueda, setBusqueda] = useState("");
  const [abiertas, setAbiertas] = useState<string[]>([]);

  const filtrar = (texto: string) => {
    const n = normalizar(texto.trim());
    return n ? secciones.filter((s) => coincide(s, n)) : secciones;
  };
  const q = busqueda.trim();
  const visibles = filtrar(busqueda);

  const buscar = (texto: string) => {
    setBusqueda(texto);
    // Buscando, se abren las que coinciden; al borrar, se cierran todas.
    setAbiertas(texto.trim() ? filtrar(texto).map((s) => s.id) : []);
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <header
        className="text-white px-5 sm:px-8 pt-8 pb-20 rounded-b-[2rem] relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div
          className="absolute -top-20 -right-10 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ background: "var(--brand-orange)" }}
        />
        <div className="relative z-10 max-w-3xl mx-auto">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Volver</span>
          </Link>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Manual de uso</h1>
              <p className="text-white/60 text-sm">Todo lo que necesitas para usar LubriAuto</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 -mt-10 relative z-10 space-y-4">
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(e) => buscar(e.target.value)}
            placeholder="Buscar: PDF, aceite, contraseña…"
            aria-label="Buscar en el manual"
            className="h-12 pl-10 pr-10 rounded-[6px] bg-card shadow-[var(--shadow-card)]"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => buscar("")}
              aria-label="Borrar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {!q && intro && (
          <Card className="p-5 rounded-2xl shadow-[var(--shadow-card)]">
            <Markdown texto={intro} />
          </Card>
        )}

        {visibles.length === 0 ? (
          <Card className="p-8 rounded-2xl text-center shadow-[var(--shadow-card)]">
            <p className="font-semibold">No encontramos "{q}"</p>
            <p className="text-sm text-muted-foreground mt-1">
              Prueba con otra palabra o pregúntale al asistente.
            </p>
          </Card>
        ) : (
          <Accordion
            type="multiple"
            value={abiertas}
            onValueChange={setAbiertas}
            className="space-y-3"
          >
            {visibles.map((s) => (
              <AccordionItem
                key={s.id}
                value={s.id}
                className="rounded-2xl border bg-card shadow-[var(--shadow-card)] px-4"
              >
                <AccordionTrigger className="py-4 hover:no-underline">
                  <span className="flex items-center gap-3 text-left">
                    <span
                      className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-lg"
                      style={{
                        background: "color-mix(in oklab, var(--brand-orange) 12%, transparent)",
                      }}
                      aria-hidden
                    >
                      {s.icono}
                    </span>
                    <span className="font-semibold text-[15px]">{s.titulo}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-5 space-y-4">
                  {s.cuerpo && <Markdown texto={s.cuerpo} />}
                  {s.preguntas.length > 0 && (
                    <Accordion type="multiple" className="rounded-[6px] border">
                      {s.preguntas.map((p, j) => (
                        <AccordionItem
                          key={j}
                          value={`${s.id}-${j}`}
                          className="px-3 last:border-b-0"
                        >
                          <AccordionTrigger className="py-3 text-left text-sm hover:no-underline">
                            {p.pregunta}
                          </AccordionTrigger>
                          <AccordionContent>
                            <Markdown texto={p.respuesta} />
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {session && (
          <button
            type="button"
            onClick={() => abrirAsistente(true)}
            className="w-full flex items-center gap-3 rounded-2xl border border-dashed border-border p-4 text-left transition hover:bg-muted/50"
          >
            <span
              className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-white"
              style={{ background: "var(--gradient-accent)" }}
            >
              <Sparkles className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold text-sm">¿No encuentras algo?</span>
              <span className="block text-xs text-muted-foreground">
                Pregúntale al asistente: conoce todo este manual.
              </span>
            </span>
          </button>
        )}
      </main>
    </div>
  );
}
