import type { SchedulePdfStatus, Session, Venue } from '@scd/types';
import { schedulePdfRepository } from './schedule-pdf.repository.js';
import { toSchedulePdfStatus } from './schedule-pdf.types.js';
import { buildSchedulePdf } from './schedule-pdf.pdf.js';
import { agendaService } from '../agenda/agenda.service.js';
import { sessionsService } from '../sessions/sessions.service.js';
import { venuesService } from '../venues/venues.service.js';
import { eventService } from '../event/event.service.js';
import { AppError } from '../../utils/errors.js';

export const schedulePdfService = {
  async getStatus(): Promise<SchedulePdfStatus> {
    return toSchedulePdfStatus(await schedulePdfRepository.get());
  },

  /** Public download -- only ever serves the currently PUBLISHED PDF. */
  async getPublishedPdf(): Promise<Buffer> {
    const row = await schedulePdfRepository.getPdfData();
    if (!row?.pdf_data || !row.published) {
      throw AppError.notFound('Schedule PDF', 'No published schedule PDF is available yet.');
    }
    return row.pdf_data;
  },

  /** Admin preview/download -- the latest PDF regardless of publish state. */
  async getPdf(): Promise<Buffer> {
    const row = await schedulePdfRepository.getPdfData();
    if (!row?.pdf_data) throw AppError.notFound('Schedule PDF', 'Generate a schedule PDF first.');
    return row.pdf_data;
  },

  /** Admin action: (re)build the PDF from the current agenda/session/venue data. */
  async generate(): Promise<SchedulePdfStatus> {
    const [event, agenda, sessions, venues] = await Promise.all([
      eventService.getCurrent(),
      agendaService.list(),
      sessionsService.list(),
      venuesService.list(),
    ]);
    const sessionsById = new Map<string, Session>(sessions.map((s) => [s.id, s]));
    const venuesById = new Map<string, Venue>(venues.map((v) => [v.id, v]));
    const pdf = await buildSchedulePdf({ event, agenda, sessionsById, venuesById });
    return toSchedulePdfStatus(await schedulePdfRepository.save(pdf, false));
  },

  /** Admin action: upload a hand-built replacement (spec: "Replace manually if required"). */
  async replaceManually(pdf: Buffer): Promise<SchedulePdfStatus> {
    return toSchedulePdfStatus(await schedulePdfRepository.save(pdf, true));
  },

  async setPublished(published: boolean): Promise<SchedulePdfStatus> {
    const row = await schedulePdfRepository.setPublished(published);
    if (!row) throw AppError.notFound('Schedule PDF', 'Generate a schedule PDF before publishing it.');
    return toSchedulePdfStatus(row);
  },
};
