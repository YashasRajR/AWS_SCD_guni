import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Registration, User } from '@scd/types';
import type { AttendeeRow } from '../../../backend/src/modules/attendees/attendees.types.js';
import type { CertificateRow } from '../../../backend/src/modules/certificates/certificates.types.js';

vi.mock('../../../backend/src/modules/certificates/certificates.repository.js', () => ({
  certificatesRepository: {
    findActiveByAttendeeAndType: vi.fn(),
    issue: vi.fn(),
    findByCertificateNumber: vi.fn(),
  },
}));
vi.mock('../../../backend/src/modules/registrations/registrations.service.js', () => ({
  registrationsService: { getByAttendeeId: vi.fn() },
}));
vi.mock('../../../backend/src/modules/attendees/attendees.repository.js', () => ({
  attendeesRepository: { findById: vi.fn() },
}));
vi.mock('../../../backend/src/modules/users/users.service.js', () => ({
  usersService: { getPublicUserById: vi.fn() },
}));
vi.mock('../../../backend/src/modules/emails/emails.service.js', () => ({
  emailsService: { enqueue: vi.fn() },
}));

const { certificatesRepository } =
  await import('../../../backend/src/modules/certificates/certificates.repository.js');
const { registrationsService } =
  await import('../../../backend/src/modules/registrations/registrations.service.js');
const { attendeesRepository } =
  await import('../../../backend/src/modules/attendees/attendees.repository.js');
const { certificatesService } =
  await import('../../../backend/src/modules/certificates/certificates.service.js');

describe('certificatesService.isEligible', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is ineligible when there is no registration', async () => {
    vi.mocked(registrationsService.getByAttendeeId).mockResolvedValue(null);
    const result = await certificatesService.isEligible('attendee-1');
    expect(result).toEqual({ eligible: false, reason: 'Registration is not confirmed.' });
  });

  it('is ineligible when the registration is not CONFIRMED', async () => {
    vi.mocked(registrationsService.getByAttendeeId).mockResolvedValue({
      status: 'PENDING',
    } as Registration);
    const result = await certificatesService.isEligible('attendee-1');
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/not confirmed/i);
  });

  it('is eligible with a confirmed registration', async () => {
    vi.mocked(registrationsService.getByAttendeeId).mockResolvedValue({
      status: 'CONFIRMED',
    } as Registration);
    const result = await certificatesService.isEligible('attendee-1');
    expect(result).toEqual({ eligible: true });
  });
});

describe('certificatesService.issue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(attendeesRepository.findById).mockResolvedValue({
      id: 'attendee-1',
      user_id: 'user-1',
      full_name: 'Test Attendee',
    } as AttendeeRow);
  });

  it('refuses to issue a certificate to an ineligible attendee', async () => {
    vi.mocked(certificatesRepository.findActiveByAttendeeAndType).mockResolvedValue(null);
    vi.mocked(registrationsService.getByAttendeeId).mockResolvedValue(null);

    await expect(
      certificatesService.issue({ attendeeId: 'attendee-1', title: 'Participation' }),
    ).rejects.toThrow(/not yet eligible/i);
    expect(certificatesRepository.issue).not.toHaveBeenCalled();
  });

  it('is idempotent: returns the existing certificate instead of creating a second one', async () => {
    const existing = {
      id: 'cert-1',
      status: 'ISSUED',
      certificate_type: 'PARTICIPATION',
    } as CertificateRow;
    vi.mocked(certificatesRepository.findActiveByAttendeeAndType).mockResolvedValue(existing);

    const result = await certificatesService.issue({
      attendeeId: 'attendee-1',
      title: 'Participation',
    });

    expect(certificatesRepository.issue).not.toHaveBeenCalled();
    expect(result.id).toBe('cert-1');
  });

  it('issues a certificate and enqueues the certificate-ready email when eligible', async () => {
    vi.mocked(certificatesRepository.findActiveByAttendeeAndType).mockResolvedValue(null);
    vi.mocked(registrationsService.getByAttendeeId).mockResolvedValue({
      status: 'CONFIRMED',
    } as Registration);
    const issuedRow = {
      id: 'cert-2',
      status: 'ISSUED',
      certificate_type: 'PARTICIPATION',
    } as CertificateRow;
    vi.mocked(certificatesRepository.issue).mockResolvedValue(issuedRow);
    const { usersService } = await import('../../../backend/src/modules/users/users.service.js');
    const { emailsService } = await import('../../../backend/src/modules/emails/emails.service.js');
    vi.mocked(usersService.getPublicUserById).mockResolvedValue({
      id: 'user-1',
      email: 'a@example.test',
    } as User);

    const result = await certificatesService.issue({
      attendeeId: 'attendee-1',
      title: 'Participation',
    });

    expect(result.id).toBe('cert-2');
    expect(emailsService.enqueue).toHaveBeenCalledWith(
      'user-1',
      'a@example.test',
      'certificate-ready',
      expect.any(String),
      expect.objectContaining({ fullName: 'Test Attendee' }),
    );
  });

  it('recovers from a concurrent-issue race (23505) by returning the winner', async () => {
    vi.mocked(certificatesRepository.findActiveByAttendeeAndType)
      .mockResolvedValueOnce(null) // pre-check: nothing yet
      .mockResolvedValueOnce({
        id: 'cert-winner',
        status: 'ISSUED',
        certificate_type: 'PARTICIPATION',
      } as CertificateRow);
    vi.mocked(registrationsService.getByAttendeeId).mockResolvedValue({
      status: 'CONFIRMED',
    } as Registration);
    vi.mocked(certificatesRepository.issue).mockRejectedValue({ code: '23505' });

    const result = await certificatesService.issue({
      attendeeId: 'attendee-1',
      title: 'Participation',
    });

    expect(result.id).toBe('cert-winner');
  });
});
