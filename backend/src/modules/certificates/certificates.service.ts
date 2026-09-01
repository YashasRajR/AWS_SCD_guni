import type { Certificate } from '@scd/types';
import { certificatesRepository } from './certificates.repository.js';
import { toCertificate } from './certificates.types.js';

/**
 * Model + service boundary only in this phase — no PDF generation. Reads
 * whatever has been issued (nothing, until a later phase implements
 * issuance); the /me/certificates endpoint using this simply returns an
 * empty list until then.
 */
export const certificatesService = {
  async listForAttendee(attendeeId: string): Promise<Certificate[]> {
    return (await certificatesRepository.listByAttendeeId(attendeeId)).map(toCertificate);
  },
};
