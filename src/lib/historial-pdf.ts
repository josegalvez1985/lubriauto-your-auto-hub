import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Auto } from "@/lib/autos-api";
import type { Servicio } from "@/lib/servicios-api";

const fmtMoneda = (n: number) =>
  new Intl.NumberFormat("es", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(n || 0);
const fmtFecha = (f: string) =>
  new Date(f).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });

async function cargarLogo(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportarHistorialPdf(auto: Auto, servicios: Servicio[], logoUrl: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const naranja: [number, number, number] = [234, 88, 12];
  const gris: [number, number, number] = [107, 114, 128];

  const logo = await cargarLogo(logoUrl);
  if (logo) doc.addImage(logo, "PNG", margin, 36, 40, 40);

  doc.setFontSize(16);
  doc.setTextColor(31, 41, 55);
  doc.setFont("helvetica", "bold");
  doc.text("LubriAuto — Historial de servicios", margin + (logo ? 52 : 0), 60);

  doc.setDrawColor(...naranja);
  doc.setLineWidth(2);
  doc.line(margin, 86, doc.internal.pageSize.getWidth() - margin, 86);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gris);
  const placa = auto.placa ? `   ·   Placa: ${auto.placa}` : "";
  doc.text(`Vehículo: ${auto.descripcion}${placa}`, margin, 106);
  doc.text(
    `Servicios: ${servicios.length}   ·   Emitido: ${fmtFecha(new Date().toISOString())}`,
    margin,
    120,
  );

  const total = servicios.reduce((acc, s) => acc + (s.costo || 0), 0);

  autoTable(doc, {
    startY: 136,
    margin: { left: margin, right: margin },
    head: [["Fecha", "Descripción", "Kilometraje", "Costo"]],
    body: servicios.map((s) => [
      fmtFecha(s.fecha),
      s.descripcion,
      `${(s.km ?? 0).toLocaleString("es")} km`,
      fmtMoneda(s.costo),
    ]),
    foot: [["", "", "Total gastado", fmtMoneda(total)]],
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55], fontStyle: "bold" },
    footStyles: { fillColor: [255, 255, 255], textColor: naranja, fontStyle: "bold", fontSize: 11 },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
    },
  });

  const nombre = `historial-${auto.descripcion.replace(/[^\w\d]+/g, "-").toLowerCase()}.pdf`;
  doc.save(nombre);
  return true;
}
