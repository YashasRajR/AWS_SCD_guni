import type { PaymentStatus, QrScanResult, QrTokenStatus, QrTokenType, RegistrationStatus, TicketStatus } from './enums.js';
import type { TicketPlan } from './event-content.js';
import type { Coupon } from './coupons.js';
import type { Invoice } from './invoices.js';
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
  year: string | null;
  profileImage: string | null;
  registrationType: string | null;
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
  payment: Payment | null;
  ticket: Ticket | null;
  invoice: Invoice | null;
  qrTokens: QrToken[];
  checkpointProgress: AttendeeCheckpointProgress[];
  activityHistory: AuditLog[];
  /** Ticket/invoice email delivery status (spec #35) -- so an admin never
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

export interface Payment {
  id: string;
  registrationId: string;
  provider: string | null;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  amount: string;
  currency: string;
  status: PaymentStatus;
  paidAt: string | null;
  /** Set once a refund (gateway-initiated or manually reconciled) is recorded (spec #36). */
  refundedAt: string | null;
  refundAmount: string | null;
  /** Null for a manual (non-gateway) refund -- the audit_logs entry the
   * action requires is the record for that case instead. */
  refundProviderId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Everything the admin payment-detail page (spec #36) needs, assembled
 * from the existing registrations/attendees data rather than duplicating it. */
export interface PaymentDetail {
  payment: Payment;
  registrationNumber: string | null;
  attendeeName: string | null;
  attendeeEmail: string | null;
  couponCode: string | null;
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
