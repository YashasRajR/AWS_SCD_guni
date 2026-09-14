import type { QrScanResult, QrTokenStatus, QrTokenType, RegistrationStatus, TicketStatus } from './enums.js';
import type { TicketPlan } from './event-content.js';
import type { Coupon } from './coupons.js';
import type { AttendeeCheckpointProgress } from './checkpoints.js';
import type { AuditLog } from './identity.js';
import type { EmailRecord } from './engagement.js';

export interface Attendee {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  university: string | null;
  department: string | null;
  branch: string | null;
  year: string | null;
  dateOfBirth: string | null;
  companyName: string | null;
  designation: string | null;
  profileImage: string | null;
  registrationType: string | null;
  linkedinUrl: string | null;
  /** Soft-delete marker (spec #34/#55) -- non-null means archived, excluded
   * from normal listings/search/export. */
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Everything the admin attendee-detail page (spec #34) needs in one call --
 * assembled by attendeesService.getDetail() from the existing per-domain
 * services rather than duplicating their data. */
export interface AttendeeDetail {
  attendee: Attendee;
  /** From the linked user account -- not on Attendee itself. */
  email: string | null;
  registration: Registration | null;
  ticket: Ticket | null;
  qrTokens: QrToken[];
  checkpointProgress: AttendeeCheckpointProgress[];
  activityHistory: AuditLog[];
  /** Ticket email delivery status (spec #35) -- so an admin never
   * has to search the attendee's inbox to know whether a document email
   * actually went out. */
  documentEmails: EmailRecord[];
}

export interface Registration {
  id: string;
  attendeeId: string;
  registrationNumber: string;
  status: RegistrationStatus;
  ticketPlanId: string | null;
  /** Joined in for display -- null only for pre-ticket-plan-era rows. */
  ticketPlan: TicketPlan | null;
  couponId: string | null;
  coupon: Coupon | null;
  /** Decimal string, "0.00" when no coupon was applied. */
  discountAmount: string;
  registeredAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  registrationId: string;
  ticketNumber: string;
  status: TicketStatus;
  issuedAt: string;
  pdfAvailable: boolean;
  pdfGeneratedAt: string | null;
  /** Bumped by an admin reissue (spec #62) -- see document_versions. */
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface QrToken {
  id: string;
  ticketId: string;
  type: QrTokenType;
  status: QrTokenStatus;
  issuedAt: string;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QrScanLog {
  id: string;
  qrTokenId: string | null;
  type: QrTokenType;
  volunteerId: string | null;
  checkpointId: string | null;
  attendeeId: string | null;
  result: QrScanResult;
  createdAt: string;
}
