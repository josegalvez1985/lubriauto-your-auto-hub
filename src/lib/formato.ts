// Formatea un valor numérico (string del input) agregando separador de miles.
export function formatMiles(valor: string): string {
  const limpio = valor.replace(/\D/g, "");
  if (!limpio) return "";
  return Number(limpio).toLocaleString("es");
}

// Extrae el número crudo de un string formateado.
export function parseMiles(valor: string): number {
  const limpio = valor.replace(/\D/g, "");
  return limpio ? Number(limpio) : 0;
}
