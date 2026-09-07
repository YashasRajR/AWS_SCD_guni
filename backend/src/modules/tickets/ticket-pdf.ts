import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export interface TicketPdfInput {
  ticketNumber: string;
  registrationNumber: string;
  issuedAt: string;
  attendeeName: string;
  university: string | null;
  department: string | null;
  year: string | null;
  phone: string | null;
  ticketPlanName: string | null;
  /** Pre-formatted, e.g. "INR 499.00" or "Free" -- the caller already knows
   * which of ticket-plan price / event fee / coupon discount applies. */
  amountLabel: string;
  eventName: string;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  registrationToken: string;
  goodieToken: string;
}

// ponytail: brand tokens copied from apps/web/src/styles/tokens.css rather
// than shared as a package -- this is the only server-side consumer of
// them. `border` is a flattened approximation of the site's
// rgba(51,32,82,0.18) hairline (pdfkit strokes don't take rgba strings).
const COLOR = {
  masthead: '#332052',
  primary: '#50377a',
  accent: '#f28a45',
  accentText: '#241934',
  foreground: '#14181f',
  muted: '#656d79',
  mutedDark: '#3d4451',
  border: '#e4e0e9',
  bannerBg: '#eef1f5',
  success: '#1c7a41',
  background: '#f8f6fc',
  white: '#ffffff',
  lavender: '#c9bcdf',
};

const PAGE_W = 400;
const PAD_X = 26;
const CONTENT_W = PAGE_W - PAD_X * 2;

function formatDate(eventDate: string): string {
  return new Date(eventDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Renders the ticket as a tall "digital pass" card — mirrors the reference
 * design in Ticket PDF.dc.html (masthead, attendee block, registration/
 * ticket number stub, details grid, essentials, dual QR scan codes) using
 * the site's own brand colors. Called once at issuance time (see
 * ticketsService.issueIfNeeded / qrTokensService.reissuePdf) -- both raw
 * tokens must be passed in by the caller since neither is ever persisted
 * or retrievable again after that moment.
 */
export async function buildTicketPdf(input: TicketPdfInput): Promise<Buffer> {
  const [registrationQr, goodieQr] = await Promise.all([
    QRCode.toBuffer(input.registrationToken, { type: 'png', width: 260, margin: 1 }),
    QRCode.toBuffer(input.goodieToken, { type: 'png', width: 260, margin: 1 }),
  ]);

  const doc = new PDFDocument({ size: [PAGE_W, 1000], margin: 0 });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.rect(0, 0, PAGE_W, doc.page.height).fill(COLOR.background);

  // --- Masthead ---------------------------------------------------------
  const mastheadH = 132;
  doc.rect(0, 0, PAGE_W, mastheadH).fill(COLOR.masthead);
  doc.font('Helvetica-Bold').fontSize(20).fillColor(COLOR.white);
  ['AWS STUDENT', 'COMMUNITY', 'DAY 2026'].forEach((line, i) => {
    doc.text(line, PAD_X, 22 + i * 21, { width: 220 });
  });
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR.lavender).text('DIGITAL', PAD_X + 220, 24, {
    width: 154,
    align: 'right',
    characterSpacing: 1.5,
  });
  doc.font('Helvetica-Bold').fontSize(13).fillColor(COLOR.white).text('ATTENDEE PASS', PAD_X + 220, 36, {
    width: 154,
    align: 'right',
  });
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLOR.accent)
    .text('GANPAT UNIVERSITY · MEHSANA, GUJARAT', PAD_X, 100, { characterSpacing: 1, width: 300 });
  doc.rect(0, mastheadH, PAGE_W, 5).fill(COLOR.accent);

  let y = mastheadH + 5 + 24;

  // --- Attendee -----------------------------------------------------------
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLOR.muted).text('ATTENDEE', PAD_X, y, { characterSpacing: 1.5 });
  y += 14;
  doc.font('Helvetica-Bold').fontSize(24).fillColor(COLOR.masthead).text(input.attendeeName, PAD_X, y, {
    width: CONTENT_W,
  });
  y += 30;
  const subtitle = [input.university, input.department, input.year].filter(Boolean).join(' · ');
  if (subtitle) {
    doc.font('Helvetica').fontSize(10.5).fillColor(COLOR.mutedDark).text(subtitle, PAD_X, y, { width: CONTENT_W });
    y += 22;
  } else {
    y += 6;
  }
  y += 14;

  // --- Registration / ticket number stub -----------------------------------
  const boxH = 56;
  doc.roundedRect(PAD_X, y, CONTENT_W, boxH, 4).lineWidth(1.5).strokeColor(COLOR.masthead).stroke();
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR.muted).text('REGISTRATION NO.', PAD_X + 14, y + 11, {
    characterSpacing: 1,
  });
  doc
    .font('Courier-Bold')
    .fontSize(18)
    .fillColor(COLOR.primary)
    .text(input.registrationNumber, PAD_X + 14, y + 24);
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(COLOR.muted)
    .text('TICKET', PAD_X, y + 11, { width: CONTENT_W - 14, align: 'right', characterSpacing: 1 });
  doc
    .font('Courier-Bold')
    .fontSize(12)
    .fillColor(COLOR.foreground)
    .text(input.ticketNumber, PAD_X, y + 27, { width: CONTENT_W - 14, align: 'right' });
  y += boxH;

  const bannerH = 48;
  doc.rect(PAD_X, y, CONTENT_W, bannerH).fill(COLOR.bannerBg);
  doc.rect(PAD_X, y, 4, bannerH).fill(COLOR.primary);
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(COLOR.mutedDark)
    .text(
      'Two scan codes below: one for entry at Registration, one for Goodies collection. Each is single-use and tied to this registration number.',
      PAD_X + 16,
      y + 9,
      { width: CONTENT_W - 28, lineGap: 1.5 },
    );
  y += bannerH + 20;

  // --- Details grid (2x2) -------------------------------------------------
  const colW = CONTENT_W / 2;
  function gridCell(label: string, value: string, col: 0 | 1, row: 0 | 1, valueColor = COLOR.foreground): void {
    const x = PAD_X + col * colW;
    const cellY = y + row * 50;
    doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR.muted).text(label, x, cellY + 10, { characterSpacing: 1 });
    doc.font('Helvetica-Bold').fontSize(12.5).fillColor(valueColor).text(value, x, cellY + 22, { width: colW - 12 });
  }
  doc.moveTo(PAD_X, y).lineTo(PAD_X + CONTENT_W, y).strokeColor(COLOR.border).lineWidth(1).stroke();
  doc.moveTo(PAD_X, y + 50).lineTo(PAD_X + CONTENT_W, y + 50).strokeColor(COLOR.border).stroke();
  doc.moveTo(PAD_X, y + 100).lineTo(PAD_X + CONTENT_W, y + 100).strokeColor(COLOR.border).stroke();
  doc.moveTo(PAD_X + colW, y).lineTo(PAD_X + colW, y + 100).strokeColor(COLOR.border).stroke();
  gridCell('TICKET TYPE', input.ticketPlanName ?? 'General', 0, 0);
  gridCell('AMOUNT PAID', input.amountLabel, 1, 0, COLOR.success);
  gridCell('PHONE', input.phone ?? '—', 0, 1);
  gridCell('ISSUED ON', formatDateTime(input.issuedAt), 1, 1);
  y += 100 + 26;

  // --- The essentials -------------------------------------------------
  function sectionHeader(label: string): void {
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLOR.primary).text(label, PAD_X, y, { characterSpacing: 1.5 });
    doc.rect(PAD_X, y + 13, 32, 2).fill(COLOR.masthead);
    y += 26;
  }
  sectionHeader('THE ESSENTIALS');
  const labelW = 64;
  function essentialRow(label: string, value: string, valueLines = 1): void {
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLOR.muted).text(label, PAD_X, y + 2, {
      width: labelW,
      characterSpacing: 1,
    });
    doc.font('Helvetica-Bold').fontSize(11.5).fillColor(COLOR.foreground).text(value, PAD_X + labelW + 12, y, {
      width: CONTENT_W - labelW - 12,
    });
    y += 16 * valueLines + 10;
  }
  essentialRow('DATE', formatDate(input.eventDate));
  essentialRow(
    'TIME',
    input.startTime ? `${input.startTime}${input.endTime ? ` – ${input.endTime}` : ''} IST` : 'To be announced',
  );
  essentialRow('VENUE', input.venue ?? 'To be announced', 2);
  essentialRow('ENTRY', 'Ticket PDF + college ID card');
  y += 8;

  // --- Scan codes ---------------------------------------------------------
  sectionHeader('YOUR SCAN CODES');
  const boxGap = 12;
  const scanBoxW = (CONTENT_W - boxGap) / 2;
  const stripH = 20;
  const qrSize = 128;
  const scanBoxH = stripH + 16 + qrSize + 26;

  function scanBox(x: number, stripColor: string, stripTextColor: string, label: string, qr: Buffer): void {
    doc.roundedRect(x, y, scanBoxW, scanBoxH, 4).lineWidth(1.5).strokeColor(stripColor).stroke();
    doc.rect(x, y, scanBoxW, stripH).fill(stripColor);
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(stripTextColor)
      .text(label, x, y + 6.5, { width: scanBoxW, align: 'center', characterSpacing: 0.8 });
    doc.image(qr, x + (scanBoxW - qrSize) / 2, y + stripH + 12, { width: qrSize });
  }
  scanBox(PAD_X, COLOR.masthead, COLOR.white, 'REGISTRATION — ENTRY', registrationQr);
  scanBox(PAD_X + scanBoxW + boxGap, COLOR.accent, COLOR.accentText, 'GOODIES — COLLECTION', goodieQr);
  y += scanBoxH + 10;
  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor(COLOR.muted)
    .text("If a code won't scan, a volunteer can verify you by name or registration number instead.", PAD_X, y, {
      width: CONTENT_W,
    });
  y += 28;

  // --- Footer -------------------------------------------------------------
  doc.moveTo(PAD_X, y).lineTo(PAD_X + CONTENT_W, y).strokeColor(COLOR.border).lineWidth(1).stroke();
  y += 12;
  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor('#565d68')
    .text(
      `Non-transferable, admits one named attendee, void if altered or resold. Queries: quote ${input.registrationNumber}.`,
      PAD_X,
      y,
      { width: CONTENT_W, lineGap: 2 },
    );
  y += 44;

  doc.rect(0, y, PAGE_W, 34).fill(COLOR.masthead);
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(COLOR.lavender)
    .text('LIVE COPY IN YOUR DASHBOARD', PAD_X, y + 12, { characterSpacing: 1.2 });
  doc
    .font('Courier-Bold')
    .fontSize(12)
    .fillColor(COLOR.accent)
    .text(input.registrationNumber, PAD_X, y + 10, { width: CONTENT_W, align: 'right' });

  doc.end();
  return done;
}
