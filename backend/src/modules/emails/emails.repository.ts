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

  /**
   * Delivery status for a specific user's document emails (ticket/invoice
   * sends) -- the admin attendee-detail page (spec #35) needs this so an
   * admin never has to search the attendee's own inbox to know whether a
   * ticket/invoice email actually went out.
   */
  async listForUser(userId: string, templates: EmailTemplate[]): Promise<EmailRecordRow[]> {
    if (templates.length === 0) return [];
    const { rows } = await getPool().query<EmailRecordRow>(
      `SELECT * FROM email_records WHERE user_id = $1 AND template = ANY($2) ORDER BY created_at DESC LIMIT 20`,
      [userId, templates],
    );
    return rows;
  },

  /**
   * PENDING/RETRYING rows whose next_attempt_at has arrived, oldest first --
   * claimed via a short lease (next_attempt_at pushed forward) rather than
   * a plain SELECT, so a second worker instance polling at the same moment
   * (a normal horizontal-scaling deployment, not hypothetical) can't also
   * pick up the same row and send a duplicate email before either side
   * calls markSent. FOR UPDATE SKIP LOCKED also means two pollers hitting
   * this at once split the batch instead of blocking on each other. If the
   * worker crashes mid-send without reaching markSent/markFailedAttempt,
   * the lease simply expires and the row becomes due again -- a bonus,
   * not a requirement, of reusing next_attempt_at instead of adding a
   * dedicated "claimed" status/column.
   */
  async listDue(limit: number): Promise<EmailRecordRow[]> {
    const { rows } = await getPool().query<EmailRecordRow>(
      `UPDATE email_records
       SET next_attempt_at = now() + interval '2 minutes'
       WHERE id IN (
         SELECT id FROM email_records
         WHERE status IN ('PENDING', 'RETRYING') AND next_attempt_at <= now()
         ORDER BY created_at ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING *`,
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
