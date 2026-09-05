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
 * Renders a one-page ticket PDF: event + attendee details, and the two QR
 * codes (entry / goodie claim) as embedded images. Called once at issuance
 * time (see ticketsService.issueIfNeeded / qrTokensService.reissuePdf) —
 * both raw tokens must be passed in by the caller since neither is ever
 * persisted or retrievable again after that moment.
 */
export async function buildTicketPdf(input: TicketPdfInput): Promise<Buffer> {
  const [registrationQr, goodieQr] = await Promise.all([
    QRCode.toBuffer(input.registrationToken, { type: 'png', width: 220, margin: 1 }),
    QRCode.toBuffer(input.goodieToken, { type: 'png', width: 220, margin: 1 }),
  ]);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.fontSize(20).fillColor('#332052').text(input.eventName, { align: 'center' });
  doc.moveDown(0.3);
  doc
    .fontSize(11)
    .fillColor('#656d79')
    .text(formatWhen(input.eventDate, input.startTime, input.endTime), {
      align: 'center',
    });
  if (input.venue) {
    doc.moveDown(0.1);
    doc.text(input.venue, { align: 'center' });
  }
  doc.moveDown(1.2);

  doc.fontSize(14).fillColor('#14181f').text(`Attendee: ${input.attendeeName}`);
  if (input.university) doc.fontSize(11).fillColor('#656d79').text(input.university);
  doc.fontSize(11).fillColor('#656d79').text(`Ticket: ${input.ticketNumber}`);
  doc.moveDown(1.5);

  const qrSize = 160;
  const leftX = doc.page.margins.left + 30;
  const rightX = doc.page.width / 2 + 30;
  const qrY = doc.y;

  doc.image(registrationQr, leftX, qrY, { width: qrSize });
  doc
    .fontSize(11)
    .fillColor('#14181f')
    .text('Entry Check-in', leftX, qrY + qrSize + 8, { width: qrSize, align: 'center' });

  doc.image(goodieQr, rightX, qrY, { width: qrSize });
  doc
    .fontSize(11)
    .fillColor('#14181f')
    .text('Goodie Claim', rightX, qrY + qrSize + 8, { width: qrSize, align: 'center' });

  doc.y = qrY + qrSize + 40;
  doc
    .fontSize(9)
    .fillColor('#97650c')
    .text('Each QR code is single-use and tied to this ticket. Do not share this PDF publicly.', {
      align: 'center',
    });

  doc.end();
  return done;
}
