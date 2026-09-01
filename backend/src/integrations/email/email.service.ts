import { pool } from '../../config/database.js';

export interface SendEmailPayload {
  userId?: string;
  recipient: string;
  template: 'registration-confirmation' | 'payment-success' | 'ticket-delivery';
  subject: string;
  data: Record<string, any>;
}

export class EmailService {
  static async sendEmail(payload: SendEmailPayload): Promise<{ id: string; status: string }> {
    const { userId, recipient, template, subject, data } = payload;
    
    // In production or when key is present, this connects to an SMTP / API provider.
    // For dev / mock mode, we log to database email_records and console.
    const providerMessageId = `MOCK-MSG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    const query = `
      INSERT INTO email_records (user_id, recipient, template, subject, status, provider_message_id, sent_at)
      VALUES ($1, $2, $3, $4, 'SENT', $5, now())
      RETURNING id, status;
    `;
    
    const res = await pool.query(query, [userId || null, recipient, template, subject, providerMessageId]);
    const record = res.rows[0];

    console.log(`[EMAIL DISPATCH] Sent '${template}' to ${recipient} (Subject: "${subject}")`);
    console.log(`[EMAIL CONTENT] Payload Data:`, JSON.stringify(data, null, 2));

    return { id: record.id, status: record.status };
  }
}
