import PDFDocument from 'pdfkit';
import type { AgendaItem, EventConfig, Session, Venue } from '@scd/types';

export interface SchedulePdfInput {
  event: EventConfig;
  agenda: AgendaItem[];
  sessionsById: Map<string, Session>;
  venuesById: Map<string, Venue>;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

/**
 * Renders the full published agenda as one branded PDF -- built fresh
 * from agenda_items + sessions + venues each time (spec #12: "avoid
 * maintaining a separate hard-coded schedule"), never hand-typed.
 */
export async function buildSchedulePdf(input: SchedulePdfInput): Promise<Buffer> {
  const { event, agenda, sessionsById, venuesById } = input;
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.fontSize(20).fillColor('#232f3e').text(event.name, { align: 'center' });
  doc.fontSize(14).fillColor('#ff9900').text('Event Schedule', { align: 'center' });
  doc.moveDown(0.3);
  doc
    .fontSize(11)
    .fillColor('#656d79')
    .text(
      [
        new Date(event.eventDate).toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        event.venue,
      ]
        .filter(Boolean)
        .join('  ·  '),
      { align: 'center' },
    );
  doc.moveDown(1.2);

  for (const item of agenda) {
    const session = item.sessionId ? sessionsById.get(item.sessionId) : undefined;
    const venue = item.venueId ? venuesById.get(item.venueId) : undefined;
    const speakerNames = session?.speakers?.map((s) => s.name).join(', ');

    doc
      .fontSize(11)
      .fillColor('#ff9900')
      .text(`${formatTime(item.startTime)} – ${formatTime(item.endTime)}`, { continued: false });
    doc.fontSize(13).fillColor('#14181f').text(item.title);
    const meta = [venue?.name, speakerNames].filter(Boolean).join('  ·  ');
    if (meta) doc.fontSize(10).fillColor('#656d79').text(meta);
    if (session?.description) doc.fontSize(10).fillColor('#656d79').text(session.description);
    doc.moveDown(0.8);

    if (doc.y > doc.page.height - 100) doc.addPage();
  }

  doc.moveDown(1);
  doc
    .fontSize(8)
    .fillColor('#97650c')
    .text(`Generated ${new Date().toLocaleString('en-IN')}`, { align: 'center' });

  doc.end();
  return done;
}
