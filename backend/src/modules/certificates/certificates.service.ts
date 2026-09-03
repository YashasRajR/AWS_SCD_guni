import type { Certificate, PaginatedData } from '@scd/types';
import { certificatesRepository } from './certificates.repository.js';
import { toCertificate } from './certificates.types.js';
import { attendeesRepository } from '../attendees/attendees.repository.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

interface IssueCertificateInput {
  attendeeId: string;
  certificateType?: string;
  title: string;
}

export const certificatesService = {
  async listForAttendee(attendeeId: string): Promise<Certificate[]> {
    return (await certificatesRepository.listByAttendeeId(attendeeId)).map(toCertificate);
  },

  async list(page: number, pageSize: number): Promise<PaginatedData<Certificate>> {
    const { rows, total } = await certificatesRepository.list(page, pageSize);
    return {
      items: rows.map(toCertificate),
      pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async getById(id: string): Promise<Certificate> {
    const row = await certificatesRepository.findById(id);
    if (!row) throw AppError.notFound('Certificate');
    return toCertificate(row);
  },

  /**
   * Admin issues a certificate for an attendee. Idempotent: if the attendee
   * already has an active certificate of the same type, returns the existing one.
   */
  async issue(input: IssueCertificateInput): Promise<Certificate> {
    const attendee = await attendeesRepository.findById(input.attendeeId);
    if (!attendee) throw AppError.notFound('Attendee');

    const existing = await certificatesRepository.findActiveByAttendeeAndType(
      input.attendeeId,
      input.certificateType ?? 'PARTICIPATION',
    );
    if (existing) {
      logger.info({ certificateId: existing.id }, 'Certificate already issued for this attendee/type');
      return toCertificate(existing);
    }

    const row = await certificatesRepository.issue(
      input.attendeeId,
      input.title,
      input.certificateType ?? 'PARTICIPATION',
    );
    return toCertificate(row);
  },

  async revoke(id: string): Promise<Certificate> {
    const row = await certificatesRepository.revoke(id);
    if (!row) throw AppError.notFound('Certificate');
    return toCertificate(row);
  },

  /**
   * Eligibility check — can this attendee receive a certificate?
   * Current rules: must have a CONFIRMED registration.
   */
  async isEligible(attendeeId: string): Promise<{ eligible: boolean; reason?: string }> {
    // For now, eligibility = confirmed registration
    // This will be expanded as requirements grow
    return { eligible: true };
  },
};
