import type { EmailRecord, EmailStatus, EmailTemplate } from '@scd/types';

export interface EmailRecordRow {
  id: string;
  user_id: string | null;
  recipient: string;
  template: EmailTemplate;
  subject: string;
  status: EmailStatus;
  provider_message_id: string | null;
  sent_at: string | null;
  failure_reason: string | null;
  /** Template variables (e.g. a verification link) captured at enqueue
   * time — this is what lets the worker render the email later without
   * re-deriving anything from a token or other state that may since have
   * changed or been consumed. */
  data: Record<string, unknown>;
  attempts: number;
  next_attempt_at: string;
  created_at: string;
  updated_at: string;
}

export function toEmailRecord(row: EmailRecordRow): EmailRecord {
  return {
    id: row.id,
    userId: row.user_id,
    recipient: row.recipient,
    template: row.template,
    subject: row.subject,
    status: row.status,
    providerMessageId: row.provider_message_id,
    sentAt: row.sent_at,
    failureReason: row.failure_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
