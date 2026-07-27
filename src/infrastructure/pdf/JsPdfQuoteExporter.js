import { QuotePdfExporter } from "../../application/production/QuotePdfExporter.js";

const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("es-EC", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const PAGE = Object.freeze({
  width: 210,
  height: 297,
  margin: 16,
});

const COLORS = Object.freeze({
  ink: [13, 13, 13],
  paper: [250, 249, 246],
  muted: [108, 108, 104],
  line: [220, 219, 214],
  panel: [242, 241, 237],
  white: [255, 255, 255],
});

function formatUsd(value) {
  return USD_FORMATTER.format(value);
}

function yesNo(value) {
  return value ? "Sí" : "No";
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function drawHeader(doc, production, generatedAt) {
  doc.setFillColor(...COLORS.ink);
  doc.rect(0, 0, PAGE.width, 48, "F");

  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.text("CHRIS", PAGE.margin, 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setCharSpace(1.2);
  doc.text("COTIZACIÓN DE PRODUCCIÓN", PAGE.margin, 29);
  doc.setCharSpace(0);

  doc.setFontSize(9);
  doc.text(`${production.name} · ${production.format}`, PAGE.width - PAGE.margin, 18, {
    align: "right",
  });
  doc.setTextColor(190, 190, 186);
  doc.text(DATE_FORMATTER.format(generatedAt), PAGE.width - PAGE.margin, 28, {
    align: "right",
  });
}

function drawTotal(doc, total) {
  doc.setFillColor(...COLORS.panel);
  doc.roundedRect(PAGE.margin, 57, PAGE.width - (PAGE.margin * 2), 28, 4, 4, "F");

  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("TOTAL ESTIMADO", PAGE.margin + 7, 68);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("USD", PAGE.margin + 7, 75);

  doc.setTextColor(...COLORS.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(23);
  doc.text(formatUsd(total), PAGE.width - PAGE.margin - 7, 74, { align: "right" });
}

function drawSectionTitle(doc, title, y) {
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setCharSpace(1);
  doc.text(title.toUpperCase(), PAGE.margin, y);
  doc.setCharSpace(0);
}

function drawDetail(doc, label, value, x, y, width) {
  doc.setDrawColor(...COLORS.line);
  doc.line(x, y + 8, x + width, y + 8);

  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(label, x, y + 3);

  doc.setTextColor(...COLORS.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(String(value), x + width, y + 3, { align: "right", maxWidth: width * 0.58 });
}

function drawConfiguration(doc, quote, production) {
  drawSectionTitle(doc, "Configuración", 98);

  const columnGap = 12;
  const columnWidth = (PAGE.width - (PAGE.margin * 2) - columnGap) / 2;
  const rightX = PAGE.margin + columnWidth + columnGap;
  const leftDetails = [
    ["Tipo", production.name],
    ["Formato", production.format],
    ["Cámaras", quote.cameras],
    ["Luces", quote.lights],
    ["Producción", `${quote.hours} h`],
  ];
  const rightDetails = [
    ["Entregas", `${quote.videos} video${quote.videos === 1 ? "" : "s"}`],
    ["Fotografías", quote.photos],
    ["Casting", quote.casting || "Sin casting"],
    ["Maquillaje", yesNo(quote.makeup)],
    ["Sonido profesional", yesNo(quote.professionalSound)],
  ];

  leftDetails.forEach(([label, value], index) => {
    drawDetail(doc, label, value, PAGE.margin, 104 + (index * 10), columnWidth);
  });
  rightDetails.forEach(([label, value], index) => {
    drawDetail(doc, label, value, rightX, 104 + (index * 10), columnWidth);
  });

  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Extras", PAGE.margin, 162);
  doc.setTextColor(...COLORS.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(
    quote.extras.length > 0 ? quote.extras.join(" · ") : "Sin extras",
    PAGE.width - PAGE.margin,
    162,
    { align: "right", maxWidth: 145 },
  );
}

function drawBreakdownHeader(doc, y) {
  doc.setFillColor(...COLORS.panel);
  doc.rect(PAGE.margin, y, PAGE.width - (PAGE.margin * 2), 9, "F");
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("CONCEPTO", PAGE.margin + 4, y + 6);
  doc.text("CANT.", 152, y + 6, { align: "right" });
  doc.text("IMPORTE", PAGE.width - PAGE.margin - 4, y + 6, { align: "right" });
}

function drawBreakdown(doc, pricing) {
  drawSectionTitle(doc, "Desglose", 176);
  drawBreakdownHeader(doc, 181);

  const lines = [
    {
      label: "Paquete base",
      quantity: 1,
      total: pricing.basePrice,
    },
    ...pricing.additions,
  ];
  let y = 196;

  lines.forEach((item) => {
    doc.setTextColor(...COLORS.ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(item.label, PAGE.margin + 4, y, { maxWidth: 112 });
    doc.text(String(item.quantity), 152, y, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(formatUsd(item.total), PAGE.width - PAGE.margin - 4, y, {
      align: "right",
    });

    doc.setDrawColor(...COLORS.line);
    doc.line(PAGE.margin, y + 3, PAGE.width - PAGE.margin, y + 3);
    y += 5;
  });

  const totalY = Math.max(247, y + 2);
  doc.setFillColor(...COLORS.ink);
  doc.roundedRect(PAGE.margin, totalY, PAGE.width - (PAGE.margin * 2), 14, 3, 3, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TOTAL ESTIMADO", PAGE.margin + 6, totalY + 9);
  doc.setFontSize(13);
  doc.text(formatUsd(pricing.total), PAGE.width - PAGE.margin - 6, totalY + 9.5, {
    align: "right",
  });
}

function drawFooter(doc) {
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text(
    "Estimación en dólares estadounidenses. El valor final puede ajustarse según locación y requerimientos especiales.",
    PAGE.width / 2,
    291,
    { align: "center", maxWidth: PAGE.width - (PAGE.margin * 2) },
  );
}

export async function createProductionQuotePdf({
  quote,
  production,
  pricing,
  generatedAt = new Date(),
}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  doc.setFillColor(...COLORS.paper);
  doc.rect(0, 0, PAGE.width, PAGE.height, "F");
  drawHeader(doc, production, generatedAt);
  drawTotal(doc, pricing.total);
  drawConfiguration(doc, quote, production);
  drawBreakdown(doc, pricing);
  drawFooter(doc);

  return doc;
}

export class JsPdfQuoteExporter extends QuotePdfExporter {
  async export(data) {
    const doc = await createProductionQuotePdf(data);
    const date = new Date().toISOString().slice(0, 10);
    const filename = `cotizacion-chris-${slugify(data.production.name)}-${date}.pdf`;
    doc.save(filename);
  }
}
