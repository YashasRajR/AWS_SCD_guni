export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED' | 'REJECTED';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type TicketStatus = 'ISSUED' | 'REVOKED';
export type EmailStatus = 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING';

export interface RegistrationInput {
  fullName: string;
  email: string;
  phone: string;
  university: string;
  department: string;
  year: string;
  registrationType: string;
  password?: string;
}

export interface RegistrationRecord {
  id: string;
  attendeeId: string;
  registrationNumber: string;
  status: RegistrationStatus;
  registeredAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  registrationId: string;
  provider?: string;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketRecord {
  id: string;
  registrationId: string;
  ticketNumber: string;
  status: TicketStatus;
  issuedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailRecord {
  id: string;
  userId?: string;
  recipient: string;
  template: string;
  subject: string;
  status: EmailStatus;
  providerMessageId?: string;
  sentAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}
