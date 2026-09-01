import { pool } from '../../config/database.js';

export interface CreateRegistrationData {
  userId?: string;
  eventId: string;
  fullName: string;
  email: string;
  phone: string;
  university: string;
  department: string;
  year: string;
  registrationType: string;
  registrationNumber: string;
}

export class RegistrationRepository {
  static async createRegistrationWithAttendee(data: CreateRegistrationData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let userId = data.userId;
      if (!userId) {
        // Create user if not provided
        const userRes = await client.query(
          `INSERT INTO users (email, password_hash, status)
           VALUES ($1, $2, 'ACTIVE')
           ON CONFLICT (email) DO UPDATE SET updated_at = now()
           RETURNING id`,
          [data.email, '$2a$10$wT.46yvV9JdMh79.Nf/G/O3E.fT3aR2jWvW7g.KzY5t7K2'] // default placeholder hash
        );
        userId = userRes.rows[0].id;
      }

      // Create Attendee
      const attendeeRes = await client.query(
        `INSERT INTO attendees (user_id, event_id, full_name, phone, university, department, year, registration_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [userId, data.eventId, data.fullName, data.phone, data.university, data.department, data.year, data.registrationType]
      );
      const attendeeId = attendeeRes.rows[0].id;

      // Create Registration
      const regRes = await client.query(
        `INSERT INTO registrations (attendee_id, registration_number, status)
         VALUES ($1, $2, 'PENDING')
         RETURNING *`,
        [attendeeId, data.registrationNumber]
      );
      const registration = regRes.rows[0];

      await client.query('COMMIT');
      return { userId, attendeeId, registration };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id: string) {
    const query = `
      SELECT r.*, a.full_name, a.phone, a.university, a.department, a.year, a.registration_type, u.email
      FROM registrations r
      JOIN attendees a ON r.attendee_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE r.id = $1;
    `;
    const res = await pool.query(query, [id]);
    return res.rows[0] || null;
  }
}
