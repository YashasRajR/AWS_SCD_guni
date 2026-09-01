import { getPool } from '../../config/database.js';
import type { CertificateRow } from './certificates.types.js';

export const certificatesRepository = {
  async listByAttendeeId(attendeeId: string): Promise<CertificateRow[]> {
    const { rows } = await getPool().query<CertificateRow>(
      `SELECT * FROM certificates WHERE attendee_id = $1 AND status = 'ISSUED' ORDER BY issued_at DESC`,
      [attendeeId],
    );
    return rows;
  },
};
