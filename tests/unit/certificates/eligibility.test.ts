import { describe, expect, it, vi, beforeEach } from 'vitest';

const REPO_PATH = '../../../backend/src/modules/certificates/certificates.repository.js';
const REGISTRATIONS_SERVICE_PATH = '../../../backend/src/modules/registrations/registrations.service.js';
const CHECKPOINTS_REPO_PATH = '../../../backend/src/modules/checkpoints/checkpoints.repository.js';
const EVENT_SERVICE_PATH = '../../../backend/src/modules/event/event.service.js';
const ATTENDEES_REPO_PATH = '../../../backend/src/modules/attendees/attendees.repository.js';
const USERS_SERVICE_PATH = '../../../backend/src/modules/users/users.service.js';
const EMAILS_SERVICE_PATH = '../../../backend/src/modules/emails/emails.service.js';

vi.mock(REPO_PATH, () => ({
  certificatesRepository: {
    findActiveByAttendeeAndType: vi.fn(),
    issue: vi.fn(),
    findByCertificateNumber: vi.fn(),
  },
}));
vi.mock(REGISTRATIONS_SERVICE_PATH, () => ({
  registrationsService: { getByAttendeeId: vi.fn() },
}));
vi.mock(CHECKPOINTS_REPO_PATH, () => ({
  checkpointsRepository: { getAttendeeCompletions: vi.fn() },
}));
vi.mock(EVENT_SERVICE_PATH, () => ({
  eventService: { getCurrent: vi.fn() },
}));
vi.mock(ATTENDEES_REPO_PATH, () => ({
  attendeesRepository: { findById: vi.fn() },
}));
vi.mock(USERS_SERVICE_PATH, () => ({
  usersService: { getPublicUserById: vi.fn() },
}));
vi.mock(EMAILS_SERVICE_PATH, () => ({
  emailsService: { enqueue: vi.fn() },
}));

const { certificatesRepository } = await import(REPO_PATH);
const { registrationsService } = await import(REGISTRATIONS_SERVICE_PATH);
const { checkpointsRepository } = await import(CHECKPOINTS_REPO_PATH);
const { eventService } = await import(EVENT_SERVICE_PATH);
const { attendeesRepository } = await import(ATTENDEES_REPO_PATH);
const { certificatesService } = await import(
  '../../../backend/src/modules/certificates/certificates.service.js'
);

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
    vi.mocked(registrationsService.getByAttendeeId).mockResolvedValue({ status: 'PENDING' });
    const result = await certificatesService.isEligible('attendee-1');
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/not confirmed/i);
  });

  it('is ineligible when there is no active event', async () => {
    vi.mocked(registrationsService.getByAttendeeId).mockResolvedValue({ status: 'CONFIRMED' });
    vi.mocked(eventService.getCurrent).mockRejectedValue(new Error('no event'));
    const result = await certificatesService.isEligible('attendee-1');
    expect(result).toEqual({ eligible: false, reason: 'No active event is configured.' });
  });

  it('is ineligible with a confirmed registration but zero checkpoint completions', async () => {
    vi.mocked(registrationsService.getByAttendeeId).mockResolvedValue({ status: 'CONFIRMED' });
    vi.mocked(eventService.getCurrent).mockResolvedValue({ id: 'event-1' });
    vi.mocked(checkpointsRepository.getAttendeeCompletions).mockResolvedValue([]);
    const result = await certificatesService.isEligible('attendee-1');
    expect(result).toEqual({ eligible: false, reason: 'No recorded event attendance yet.' });
  });

  it('is eligible with a confirmed registration and at least one checkpoint completion', async () => {
    vi.mocked(registrationsService.getByAttendeeId).mockResolvedValue({ status: 'CONFIRMED' });
    vi.mocked(eventService.getCurrent).mockResolvedValue({ id: 'event-1' });
    vi.mocked(checkpointsRepository.getAttendeeCompletions).mockResolvedValue([{ checkpoint_id: 'cp-1' }]);
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
    });
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
    const existing = { id: 'cert-1', status: 'ISSUED', certificate_type: 'PARTICIPATION' };
    vi.mocked(certificatesRepository.findActiveByAttendeeAndType).mockResolvedValue(existing);

    const result = await certificatesService.issue({ attendeeId: 'attendee-1', title: 'Participation' });

    expect(certificatesRepository.issue).not.toHaveBeenCalled();
    expect(result.id).toBe('cert-1');
  });

  it('issues a certificate and enqueues the certificate-ready email when eligible', async () => {
    vi.mocked(certificatesRepository.findActiveByAttendeeAndType).mockResolvedValue(null);
    vi.mocked(registrationsService.getByAttendeeId).mockResolvedValue({ status: 'CONFIRMED' });
    vi.mocked(eventService.getCurrent).mockResolvedValue({ id: 'event-1' });
    vi.mocked(checkpointsRepository.getAttendeeCompletions).mockResolvedValue([{ checkpoint_id: 'cp-1' }]);
    const issuedRow = { id: 'cert-2', status: 'ISSUED', certificate_type: 'PARTICIPATION' };
    vi.mocked(certificatesRepository.issue).mockResolvedValue(issuedRow);
    const { usersService } = await import(USERS_SERVICE_PATH);
    const { emailsService } = await import(EMAILS_SERVICE_PATH);
    vi.mocked(usersService.getPublicUserById).mockResolvedValue({ id: 'user-1', email: 'a@example.test' });

    const result = await certificatesService.issue({ attendeeId: 'attendee-1', title: 'Participation' });

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
      .mockResolvedValueOnce({ id: 'cert-winner', status: 'ISSUED', certificate_type: 'PARTICIPATION' });
    vi.mocked(registrationsService.getByAttendeeId).mockResolvedValue({ status: 'CONFIRMED' });
    vi.mocked(eventService.getCurrent).mockResolvedValue({ id: 'event-1' });
    vi.mocked(checkpointsRepository.getAttendeeCompletions).mockResolvedValue([{ checkpoint_id: 'cp-1' }]);
    vi.mocked(certificatesRepository.issue).mockRejectedValue({ code: '23505' });

    const result = await certificatesService.issue({ attendeeId: 'attendee-1', title: 'Participation' });

    expect(result.id).toBe('cert-winner');
  });
});
