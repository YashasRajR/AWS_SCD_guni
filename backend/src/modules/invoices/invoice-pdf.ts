import PDFDocument from 'pdfkit';

export interface InvoicePdfInput {
  invoiceNumber: string;
  registrationNumber: string;
  attendeeName: string;
  university: string | null;
  eventName: string;
  ticketPlanName: string | null;
  amount: string;
  discountAmount: string;
  taxAmount: string;
  currency: string;
  couponCode: string | null;
  paymentReference: string | null;
  paidAt: string | null;
}

function money(currency: string, amount: string): string {
  return `${currency} ${Number(amount).toFixed(2)}`;
}

/**
 * Renders a one-page fee receipt / invoice PDF. Built once, right after a
 * payment is confirmed (see payments.service.ts), from server-computed
 * amounts only -- never anything a client submitted.
 */
export async function buildInvoicePdf(input: InvoicePdfInput): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.fontSize(20).fillColor('#332052').text('Fee Receipt / Invoice', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor('#656d79').text(input.eventName, { align: 'center' });
  doc.moveDown(1.2);

  doc.fontSize(11).fillColor('#656d79').text(`Invoice number: ${input.invoiceNumber}`);
  doc.text(`Registration number: ${input.registrationNumber}`);
  if (input.paymentReference) doc.text(`Payment reference: ${input.paymentReference}`);
  if (input.paidAt) doc.text(`Paid: ${new Date(input.paidAt).toLocaleString('en-IN')}`);
  doc.moveDown(1);

  doc.fontSize(14).fillColor('#14181f').text(`Billed to: ${input.attendeeName}`);
  if (input.university) doc.fontSize(11).fillColor('#656d79').text(input.university);
  doc.moveDown(1);

  const rowY = () => doc.y;
  const label = (text: string, y: number) => doc.fontSize(11).fillColor('#656d79').text(text, 60, y);
  const value = (text: string, y: number) =>
    doc.fontSize(11).fillColor('#14181f').text(text, 300, y, { width: 240, align: 'right' });

  if (input.ticketPlanName) {
    label(`Ticket plan: ${input.ticketPlanName}`, rowY());
    doc.moveDown(0.6);
  }

  const originalAmount = (Number(input.amount) + Number(input.discountAmount)).toFixed(2);
  let y = rowY();
  label('Subtotal', y);
  value(money(input.currency, originalAmount), y);
  doc.moveDown(0.5);

  if (Number(input.discountAmount) > 0) {
    y = rowY();
    label(input.couponCode ? `Discount (${input.couponCode})` : 'Discount', y);
    value(`- ${money(input.currency, input.discountAmount)}`, y);
    doc.moveDown(0.5);
  }

  if (Number(input.taxAmount) > 0) {
    y = rowY();
    label('Tax', y);
    value(money(input.currency, input.taxAmount), y);
    doc.moveDown(0.5);
  }

  doc.moveDown(0.3);
  y = rowY();
  doc.fontSize(13).fillColor('#14181f').text('Total paid', 60, y);
  doc.fontSize(13).fillColor('#14181f').text(money(input.currency, input.amount), 300, y, {
    width: 240,
    align: 'right',
  });

  doc.moveDown(2);
  doc
    .fontSize(9)
    .fillColor('#97650c')
    .text('This is a system-generated receipt and does not require a signature.', { align: 'center' });

  doc.end();
  return done;
}
