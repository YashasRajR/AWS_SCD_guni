import type { Certificate, PaginatedData } from '@scd/types';
import { certificatesRepository } from './certificates.repository.js';
import { toCertificate } from './certificates.types.js';
import { attendeesRepository } from '../attendees/attendees.repository.js';
import { registrationsService } from '../registrations/registrations.service.js';
import { usersService } from '../users/users.service.js';
import { emailsService } from '../emails/emails.service.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

interface IssueCertificateInput {
  attendeeId: string;
  certificateType?: string;
  title: string;
}

interface PgError {
  code?: string;
}

export interface CertificateEligibility {
  eligible: boolean;
  reason?: string;
}

/** Public, non-sensitive shape returned by the verification endpoint — no attendee contact info. */
export interface CertificateVerification {
  valid: boolean;
  certificateNumber: string;
  title?: string;
  certificateType?: string;
  attendeeName?: string;
  issuedAt?: string;
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
   * Eligibility rule: the attendee must have a CONFIRMED registration.
   * Attendance/check-in tracking (checkpoints) was removed, so a
   * confirmed registration is now the only floor for a PARTICIPATION
   * certificate; SESSION/ACHIEVEMENT-type certificates are issued at
   * admin discretion on top of this same floor.
   */
  async isEligible(attendeeId: string): Promise<CertificateEligibility> {
    const registration = await registrationsService.getByAttendeeId(attendeeId);
    if (!registration || registration.status !== 'CONFIRMED') {
      return { eligible: false, reason: 'Registration is not confirmed.' };
    }

    return { eligible: true };
  },

  /**
   * Admin issues a certificate for an attendee. Enforces isEligible()
   * before creating anything — a certificate is never issued to someone
   * who hasn't actually attended, even by an admin's own request. The
   * partial unique index on (attendee_id, certificate_type) WHERE status
   * = 'ISSUED' (see database/migrations/034) is the race-safe backstop
   * behind this same-type check.
   */
  async issue(input: IssueCertificateInput): Promise<Certificate> {
    const attendee = await attendeesRepository.findById(input.attendeeId);
    if (!attendee) throw AppError.notFound('Attendee');

    const certificateType = input.certificateType ?? 'PARTICIPATION';

    const existing = await certificatesRepository.findActiveByAttendeeAndType(
      input.attendeeId,
      certificateType,
    );
    if (existing) {
      logger.info({ certificateId: existing.id }, 'Certificate already issued for this attendee/type');
      return toCertificate(existing);
    }

    const eligibility = await this.isEligible(input.attendeeId);
    if (!eligibility.eligible) {
      throw AppError.validation(
        `This attendee is not yet eligible for a certificate: ${eligibility.reason ?? 'requirements not met.'}`,
      );
    }

    let row;
    try {
      row = await certificatesRepository.issue(input.attendeeId, input.title, certificateType);
    } catch (err) {
      if ((err as PgError).code === '23505') {
        // Lost the race to a concurrent issue request for the same attendee/type.
        const raceExisting = await certificatesRepository.findActiveByAttendeeAndType(
          input.attendeeId,
          certificateType,
        );
        if (raceExisting) return toCertificate(raceExisting);
      }
      throw err;
    }

    const user = await usersService.getPublicUserById(attendee.user_id);
    if (user) {
      await emailsService.enqueue(user.id, user.email, 'certificate-ready', 'Your certificate is ready', {
        fullName: attendee.full_name,
      });
    }

    return toCertificate(row);
  },

  async revoke(id: string): Promise<Certificate> {
    const row = await certificatesRepository.revoke(id);
    if (!row) throw AppError.notFound('Certificate');
    return toCertificate(row);
  },

  /**
   * Public verification by certificate number — deliberately returns only
   * non-sensitive fields (no attendee email/phone/user id) since this
   * endpoint has no authentication. A REVOKED or unknown number both
   * report valid: false, without distinguishing "revoked" from
   * "never existed" to avoid leaking which certificate numbers are real.
   */
  async verify(certificateNumber: string): Promise<CertificateVerification> {
    const row = await certificatesRepository.findByCertificateNumber(certificateNumber);
    if (!row || row.status !== 'ISSUED') {
      return { valid: false, certificateNumber };
    }
    const attendee = await attendeesRepository.findById(row.attendee_id);
    return {
      valid: true,
      certificateNumber: row.certificate_number,
      title: row.title,
      certificateType: row.certificate_type,
      attendeeName: attendee?.full_name,
      issuedAt: row.issued_at,
    };
  },
};
