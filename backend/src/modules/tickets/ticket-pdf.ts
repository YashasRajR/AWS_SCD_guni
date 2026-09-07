import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export interface TicketPdfInput {
  ticketNumber: string;
  attendeeName: string;
  university: string | null;
  eventName: string;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  registrationToken: string;
  goodieToken: string;
}

// ponytail: brand tokens copied from apps/web/src/styles/tokens.css rather than
// shared as a package — this is the only server-side consumer of them.
const COLOR = {
  primary: '#50377a',
  secondary: '#332052',
  accent: '#f28a45',
  foreground: '#14181f',
  muted: '#656d79',
  border: '#d8d2e4',
  success: '#1c7a41',
  successBg: '#e5f6ec',
  warningBg: '#fdf1dc',
  warning: '#97650c',
  surface: '#ffffff',
  background: '#f8f6fc',
};

function formatWhen(eventDate: string, startTime: string | null, endTime: string | null): string {
  const date = new Date(eventDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  if (!startTime) return date;
  const time = endTime ? `${startTime} – ${endTime}` : startTime;
  return `${date}, ${time}`;
}

/**
 * Renders a one-page ticket PDF styled as a boarding-pass card (brand
 * colors from apps/web/src/styles/tokens.css): a purple header band, an
 * info stub, and a perforated QR stub with the two entry/goodie codes.
 * Called once at issuance time (see ticketsService.issueIfNeeded /
 * qrTokensService.reissuePdf) — both raw tokens must be passed in by the
 * caller since neither is ever persisted or retrievable again after that
 * moment.
 */
export async function buildTicketPdf(input: TicketPdfInput): Promise<Buffer> {
  const [registrationQr, goodieQr] = await Promise.all([
    QRCode.toBuffer(input.registrationToken, { type: 'png', width: 240, margin: 1 }),
    QRCode.toBuffer(input.goodieToken, { type: 'png', width: 240, margin: 1 }),
  ]);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLOR.background);

  const cardX = doc.page.margins.left;
  const cardW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const cardY = 90;
  const headerH = 74;
  const stubW = 190;
  const bodyH = 260;
  const cardBottom = cardY + headerH + bodyH;
  const stubX = cardX + cardW - stubW;

  // --- Card outline + header band -----------------------------------
  doc.roundedRect(cardX, cardY, cardW, headerH + bodyH, 14).fillAndStroke(COLOR.surface, COLOR.border);
  doc.save();
  doc.roundedRect(cardX, cardY, cardW, headerH + bodyH, 14).clip();
  doc.rect(cardX, cardY, cardW, headerH).fill(COLOR.primary);
  doc.rect(cardX, cardY + headerH, cardW, 4).fill(COLOR.accent);
  doc.restore();

  doc
    .fontSize(9)
    .fillColor('#d9cdef')
    .text('AWS STUDENT COMMUNITY DAY', cardX + 28, cardY + 16, { characterSpacing: 1.2 });
  doc
    .fontSize(19)
    .fillColor('#ffffff')
    .text(input.eventName, cardX + 28, cardY + 30, { width: cardW - 56 - stubW });
  doc
    .fontSize(9.5)
    .fillColor('#e4dbf2')
    .text(formatWhen(input.eventDate, input.startTime, input.endTime), cardX + 28, cardY + 54, {
      width: cardW - 56 - stubW,
    });

  // --- Perforated divider between info stub and QR stub ---------------
  const perfX = stubX;
  doc.save();
  doc.circle(perfX, cardY + headerH + 4, 9).fill(COLOR.background);
  doc.circle(perfX, cardBottom, 9).fill(COLOR.background);
  doc.restore();
  doc
    .dash(4, { space: 4 })
    .moveTo(perfX, cardY + headerH + 16)
    .lineTo(perfX, cardBottom - 16)
    .strokeColor(COLOR.border)
    .lineWidth(1)
    .stroke()
    .undash();

  // --- Left info stub ---------------------------------------------------
  const infoX = cardX + 28;
  const infoW = stubX - infoX - 24;
  let y = cardY + headerH + 26;

  doc.fontSize(8.5).fillColor(COLOR.muted).text('ATTENDEE', infoX, y, { characterSpacing: 1 });
  y += 13;
  doc.fontSize(14).fillColor(COLOR.foreground).text(input.attendeeName, infoX, y, { width: infoW });
  y += 20;
  if (input.university) {
    doc.fontSize(10).fillColor(COLOR.muted).text(input.university, infoX, y, { width: infoW });
    y += 22;
  } else {
    y += 8;
  }

  doc.fontSize(8.5).fillColor(COLOR.muted).text('VENUE', infoX, y, { characterSpacing: 1 });
  y += 13;
  doc
    .fontSize(10.5)
    .fillColor(COLOR.foreground)
    .text(input.venue ?? 'To be announced', infoX, y, { width: infoW });
  y += 30;

  // Status pill
  doc.roundedRect(infoX, y, 76, 20, 10).fill(COLOR.successBg);
  doc.fontSize(9).fillColor(COLOR.success).text('CONFIRMED', infoX, y + 5.5, { width: 76, align: 'center' });

  // Ticket number chip
  const chipY = y + 34;
  doc.roundedRect(infoX, chipY, infoW, 30, 6).lineWidth(1).strokeColor(COLOR.border).stroke();
  doc.fontSize(8).fillColor(COLOR.muted).text('TICKET NO.', infoX + 12, chipY + 6);
  doc.fontSize(12).fillColor(COLOR.secondary).text(input.ticketNumber, infoX + 12, chipY + 15, {
    characterSpacing: 0.5,
  });

  // --- Right QR stub ------------------------------------------------
  const qrSize = 108;
  const qrColX = stubX + (stubW - qrSize) / 2;
  let qy = cardY + headerH + 22;

  doc.image(registrationQr, qrColX, qy, { width: qrSize });
  doc
    .fontSize(9)
    .fillColor(COLOR.foreground)
    .text('ENTRY CHECK-IN', stubX, qy + qrSize + 6, { width: stubW, align: 'center' });

  qy += qrSize + 26;
  doc.image(goodieQr, qrColX, qy, { width: qrSize });
  doc
    .fontSize(9)
    .fillColor(COLOR.foreground)
    .text('GOODIE CLAIM', stubX, qy + qrSize + 6, { width: stubW, align: 'center' });

  // --- Footer notice --------------------------------------------------
  doc.roundedRect(cardX, cardBottom + 24, cardW, 34, 8).fill(COLOR.warningBg);
  doc
    .fontSize(9)
    .fillColor(COLOR.warning)
    .text('Each QR code is single-use and tied to this ticket. Do not share this PDF publicly.', cardX, cardBottom + 34, {
      width: cardW,
      align: 'center',
    });

  doc.end();
  return done;
}
