import { getPool } from '../../config/database.js';
import type { EmailTemplate } from '@scd/types';
import type { EmailRecordRow } from './emails.types.js';

export const emailsRepository = {
  async record(
    userId: string | null,
    recipient: string,
    template: EmailTemplate,
    subject: string,
  ): Promise<EmailRecordRow> {
    const { rows } = await getPool().query<EmailRecordRow>(
      `INSERT INTO email_records (user_id, recipient, template, subject, status)
       VALUES ($1, $2, $3, $4, 'PENDING')
       RETURNING *`,
      [userId, recipient, template, subject],
    );
    return rows[0]!;
  },
};
