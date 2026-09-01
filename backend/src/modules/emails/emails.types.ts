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
