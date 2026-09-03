import { getPool } from '../../config/database.js';
import type { EmailTemplate } from '@scd/types';
import type { EmailRecordRow } from './emails.types.js';

export const emailsRepository = {
  async record(
    userId: string | null,
    recipient: string,
    template: EmailTemplate,
    subject: string,
    data: Record<string, unknown>,
  ): Promise<EmailRecordRow> {
    const { rows } = await getPool().query<EmailRecordRow>(
      `INSERT INTO email_records (user_id, recipient, template, subject, data, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')
       RETURNING *`,
      [userId, recipient, template, subject, JSON.stringify(data)],
    );
    return rows[0]!;
  },

  async listAll(page: number, pageSize: number): Promise<{ rows: EmailRecordRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [{ rows }, countResult] = await Promise.all([
      getPool().query<EmailRecordRow>(
        'SELECT * FROM email_records ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [pageSize, offset],
      ),
      getPool().query<{ count: string }>('SELECT count(*) FROM email_records'),
    ]);
    return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
  },

  /** PENDING/RETRYING rows whose next_attempt_at has arrived, oldest first. */
  async listDue(limit: number): Promise<EmailRecordRow[]> {
    const { rows } = await getPool().query<EmailRecordRow>(
      `SELECT * FROM email_records
       WHERE status IN ('PENDING', 'RETRYING') AND next_attempt_at <= now()
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit],
    );
    return rows;
  },

  async markSent(id: string, providerMessageId: string): Promise<void> {
    await getPool().query(
      `UPDATE email_records
       SET status = 'SENT', provider_message_id = $2, sent_at = now(), failure_reason = NULL
       WHERE id = $1`,
      [id, providerMessageId],
    );
  },

  /** RETRYING while attempts remain, FAILED (terminal) once maxAttempts is reached. */
  async markFailedAttempt(
    id: string,
    reason: string,
    attempts: number,
    maxAttempts: number,
    nextAttemptAt: Date,
  ): Promise<void> {
    const status = attempts >= maxAttempts ? 'FAILED' : 'RETRYING';
    await getPool().query(
      `UPDATE email_records
       SET status = $2, attempts = $3, next_attempt_at = $4, failure_reason = $5
       WHERE id = $1`,
      [id, status, attempts, nextAttemptAt.toISOString(), reason],
    );
  },
};
