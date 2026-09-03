import { getPool } from '../../config/database.js';
import { generateReferenceCode } from '@scd/utils';
import type { CertificateRow } from './certificates.types.js';

export const certificatesRepository = {
  async listByAttendeeId(attendeeId: string): Promise<CertificateRow[]> {
    const { rows } = await getPool().query<CertificateRow>(
      `SELECT * FROM certificates WHERE attendee_id = $1 AND status = 'ISSUED' ORDER BY issued_at DESC`,
      [attendeeId],
    );
    return rows;
  },

  async findById(id: string): Promise<CertificateRow | null> {
    const { rows } = await getPool().query<CertificateRow>(
      'SELECT * FROM certificates WHERE id = $1',
      [id],
    );
    return rows[0] ?? null;
  },

  /** Public verification lookup — by the certificate number printed on it, not its internal id. */
  async findByCertificateNumber(certificateNumber: string): Promise<CertificateRow | null> {
    const { rows } = await getPool().query<CertificateRow>(
      'SELECT * FROM certificates WHERE certificate_number = $1',
      [certificateNumber],
    );
    return rows[0] ?? null;
  },

  async findActiveByAttendeeAndType(attendeeId: string, certificateType: string): Promise<CertificateRow | null> {
    const { rows } = await getPool().query<CertificateRow>(
      `SELECT * FROM certificates WHERE attendee_id = $1 AND certificate_type = $2 AND status = 'ISSUED' LIMIT 1`,
      [attendeeId, certificateType],
    );
    return rows[0] ?? null;
  },

  async list(page: number, pageSize: number): Promise<{ rows: CertificateRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [{ rows }, countResult] = await Promise.all([
      getPool().query<CertificateRow>(
        'SELECT * FROM certificates ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [pageSize, offset],
      ),
      getPool().query<{ count: string }>('SELECT count(*) FROM certificates'),
    ]);
    return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
  },

  async issue(attendeeId: string, title: string, certificateType: string): Promise<CertificateRow> {
    const { rows } = await getPool().query<CertificateRow>(
      `INSERT INTO certificates (attendee_id, certificate_number, certificate_type, title)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [attendeeId, generateReferenceCode('CERT'), certificateType, title],
    );
    return rows[0]!;
  },

  async revoke(id: string): Promise<CertificateRow | null> {
    const { rows } = await getPool().query<CertificateRow>(
      `UPDATE certificates SET status = 'REVOKED' WHERE id = $1 AND status = 'ISSUED' RETURNING *`,
      [id],
    );
    return rows[0] ?? null;
  },
};
