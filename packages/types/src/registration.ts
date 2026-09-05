import type { PaymentStatus, QrScanResult, QrTokenStatus, QrTokenType, RegistrationStatus, TicketStatus } from './enums.js';

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
  createdAt: string;
  updatedAt: string;
}

export interface Registration {
  id: string;
  attendeeId: string;
  registrationNumber: string;
  status: RegistrationStatus;
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
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  registrationId: string;
  ticketNumber: string;
  status: TicketStatus;
  issuedAt: string;
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
