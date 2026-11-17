import { readFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { CAMP_CONFIG } from "@/config/site";
import { isMinorAtCamp } from "@/utils/minors";
import { formatTicketCode, ticketUrl } from "@/utils/ticket";

export type TicketPdfData = {
  first_name: string;
  last_name: string;
  birth_date: string;
  plan: string;
  price: number;
  ticket_code: string;
  remaining: number;
};

/** Las fuentes estándar del PDF solo cubren Latin-1: se quitan caracteres que no pueden dibujar. */
function pdfSafe(text: string) {
  return text.normalize("NFC").replace(/[^\x20-\x7E\xA0-\xFF·—’]/g, "").replace(/\s+/g, " ").trim();
}

const hex = (h: string) =>
  rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);

const C = {
  navy: hex("#0b2d36"),
  cream: hex("#f8f4e9"),
  paper: hex("#fffdf6"),
  yellow: hex("#ffc629"),
  teal: hex("#00aeb8"),
  muted: hex("#6b8586"),
  line: hex("#d5dcd9"),
  white: rgb(1, 1, 1),
  paidBg: hex("#dff3ec"),
  paidFg: hex("#0f6b4f"),
  dueBg: hex("#ffe9d6"),
  dueFg: hex("#a64300"),
  minorBg: hex("#fff4cf"),
  minorFg: hex("#5c4300"),
};

// Tamaño de boleto (pt): se ve bien en el celular y entra en media hoja A4.
const W = 340;
const H = 624;
const M = 16; // margen del boleto dentro de la página
const R = 18; // radio de esquinas

/** Rectángulo redondeado como path SVG (pdf-lib mide y hacia abajo desde el origen). */
function roundedRect(w: number, h: number, r: number, corners = { tl: r, tr: r, br: r, bl: r }) {
  const { tl, tr, br, bl } = corners;
  return [
    `M ${tl} 0`, `H ${w - tr}`, `Q ${w} 0 ${w} ${tr}`,
    `V ${h - br}`, `Q ${w} ${h} ${w - br} ${h}`,
    `H ${bl}`, `Q 0 ${h} 0 ${h - bl}`,
    `V ${tl}`, `Q 0 0 ${tl} 0`, "Z",
  ].join(" ");
}

function spaced(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, tracking: number, color = C.navy) {
  let cx = x;
  for (const ch of text) {
    page.drawText(ch, { x: cx, y, size, font, color });
    cx += font.widthOfTextAtSize(ch, size) + tracking;
  }
}

function spacedWidth(text: string, font: PDFFont, size: number, tracking: number) {
  return [...text].reduce((w, ch) => w + font.widthOfTextAtSize(ch, size) + tracking, -tracking);
}

function fitSize(text: string, font: PDFFont, max: number, maxWidth: number, min = 11) {
  let size = max;
  while (size > min && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.5;
  return size;
}


export async function buildTicketPdf(reg: TicketPdfData): Promise<Uint8Array> {
  const { remaining } = reg;
  const root = process.cwd();
  const [brushBytes, logoBytes] = await Promise.all([
    readFile(path.join(root, "public/fonts/blowbrush.ttf")),
    readFile(path.join(root, "app/mi-inscripcion/entrada/pdf/logo.png")),
  ]);

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle("Entrada Radical 2.0");
  pdf.setAuthor("Radical 2.0");
  pdf.setSubject(pdfSafe(`${reg.first_name} ${reg.last_name}`));

  const brush = await pdf.embedFont(brushBytes, { subset: true });
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.CourierBold);
  const logo = await pdf.embedPng(logoBytes);

  const page = pdf.addPage([W, H]);
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.cream });

  const tw = W - M * 2; // ancho del boleto
  const top = H - M; // borde superior del boleto
  const bandH = 170;
  const tearY = top - bandH; // y de la línea de corte

  // Cuerpo claro + cabecera oscura
  page.drawSvgPath(roundedRect(tw, H - M * 2, R), { x: M, y: top, color: C.paper });
  page.drawSvgPath(roundedRect(tw, bandH, R, { tl: R, tr: R, br: 0, bl: 0 }), { x: M, y: top, color: C.navy });

  // Cabecera
  const pad = 20;
  const logoW = 104;
  const logoH = (logo.height / logo.width) * logoW;
  page.drawImage(logo, { x: M + pad, y: top - pad - logoH, width: logoW, height: logoH });

  const tag = "ENTRADA";
  const tagW = spacedWidth(tag, bold, 9, 1.6) + 16;
  const tagX = M + tw - pad - tagW;
  const tagY = top - pad - 20;
  page.drawSvgPath(roundedRect(tagW, 20, 5), { x: tagX, y: tagY + 20, borderColor: C.yellow, borderWidth: 0.8 });
  spaced(page, tag, tagX + 8, tagY + 6.5, bold, 9, 1.6, C.yellow);

  page.drawText(CAMP_CONFIG.dates.badge, { x: M + pad, y: top - 104, size: 22, font: brush, color: C.white });

  const metaY = top - 130;
  const col2 = M + pad + (tw - pad * 2) / 2;
  spaced(page, "FECHAS", M + pad, metaY, bold, 7, 1.2, C.teal);
  spaced(page, "LUGAR", col2, metaY, bold, 7, 1.2, C.teal);
  page.drawText(CAMP_CONFIG.dates.range, { x: M + pad, y: metaY - 17, size: 13, font: bold, color: C.cream });
  page.drawText(CAMP_CONFIG.location.venue, { x: col2, y: metaY - 17, size: 13, font: bold, color: C.cream });

  // Línea de corte con muescas
  const notch = 11;
  page.drawCircle({ x: M, y: tearY, size: notch, color: C.cream });
  page.drawCircle({ x: M + tw, y: tearY, size: notch, color: C.cream });
  page.drawLine({
    start: { x: M + notch + 6, y: tearY },
    end: { x: M + tw - notch - 6, y: tearY },
    thickness: 1.2,
    color: C.line,
    dashArray: [5, 4],
  });

  // QR vectorial (cada módulo es un cuadrado: nítido a cualquier tamaño)
  const qr = QRCode.create(ticketUrl(reg.ticket_code), { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const qrBox = 176;
  const qrPad = 12;
  const mod = (qrBox - qrPad * 2) / n;
  const qrX = (W - qrBox) / 2;
  const qrTop = tearY - 26;
  page.drawSvgPath(roundedRect(qrBox, qrBox, 12), { x: qrX, y: qrTop, color: C.white, borderColor: C.line, borderWidth: 0.8 });
  // Tramos horizontales unidos: sin costuras visibles entre módulos.
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.modules.data[r * n + c]) continue;
      let end = c;
      while (end + 1 < n && qr.modules.data[r * n + end + 1]) end++;
      page.drawRectangle({
        x: qrX + qrPad + c * mod,
        y: qrTop - qrPad - (r + 1) * mod - 0.15,
        width: (end - c + 1) * mod,
        height: mod + 0.3,
        color: C.navy,
      });
      c = end;
    }
  }

  const code = formatTicketCode(reg.ticket_code);
  const codeW = spacedWidth(code, mono, 14, 1.6);
  spaced(page, code, (W - codeW) / 2, qrTop - qrBox - 22, mono, 14, 1.6);

  // Titular
  const holderTop = qrTop - qrBox - 44;
  page.drawLine({ start: { x: M + pad, y: holderTop }, end: { x: M + tw - pad, y: holderTop }, thickness: 0.6, color: C.line });

  spaced(page, "CAMPISTA", M + pad, holderTop - 18, bold, 7, 1.2, C.muted);
  // En una línea si entra con buen tamaño; si no, nombres y apellidos en dos.
  const maxNameW = tw - pad * 2;
  const full = pdfSafe(`${reg.first_name} ${reg.last_name}`).toUpperCase();
  const lines = bold.widthOfTextAtSize(full, 14) <= maxNameW
    ? [full]
    : [pdfSafe(reg.first_name).toUpperCase(), pdfSafe(reg.last_name).toUpperCase()];
  const nameSize = Math.min(...lines.map((l) => fitSize(l, bold, 17, maxNameW, 9)));
  lines.forEach((line, i) => {
    page.drawText(line, { x: M + pad, y: holderTop - 38 - i * (nameSize + 3), size: nameSize, font: bold, color: C.navy });
  });

  const rowY = holderTop - 62 - (lines.length - 1) * (nameSize + 3);
  spaced(page, "PLAN", M + pad, rowY, bold, 7, 1.2, C.muted);
  spaced(page, "ESTADO", col2, rowY, bold, 7, 1.2, C.muted);
  const plan = reg.plan.charAt(0).toUpperCase() + reg.plan.slice(1);
  page.drawText(`${plan} · S/${reg.price}`, { x: M + pad, y: rowY - 18, size: 12, font: bold, color: C.navy });

  const paid = remaining <= 0;
  const chip = paid ? "PAGADO" : `SALDO S/${remaining}`;
  const chipW = bold.widthOfTextAtSize(chip, 9) + 16;
  page.drawSvgPath(roundedRect(chipW, 18, 9), { x: col2, y: rowY - 6, color: paid ? C.paidBg : C.dueBg });
  page.drawText(chip, { x: col2 + 8, y: rowY - 18.5, size: 9, font: bold, color: paid ? C.paidFg : C.dueFg });

  const footY = rowY - 40;
  if (isMinorAtCamp(reg.birth_date)) {
    const text = "Menor de edad · presentar permiso notarial";
    page.drawSvgPath(roundedRect(tw - pad * 2, 22, 6), { x: M + pad, y: footY, color: C.minorBg });
    page.drawText(text, { x: M + pad + 9, y: footY - 14.5, size: 8.5, font: bold, color: C.minorFg });
  }

  const foot = "Muestra esta entrada al llegar. Es personal e intransferible.";
  page.drawText(foot, {
    x: (W - sans.widthOfTextAtSize(foot, 7.5)) / 2,
    y: M + 16,
    size: 7.5,
    font: sans,
    color: C.muted,
  });

  return pdf.save();
}
