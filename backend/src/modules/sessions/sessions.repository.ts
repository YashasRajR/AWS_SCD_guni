import { getPool, withTransaction } from '../../config/database.js';
import { buildUpdateSet, paginatedListQuery, type ListQueryParams } from '../../utils/sql.js';
import type { SpeakerRow } from '../speakers/speakers.types.js';
import type { SessionRow } from './sessions.types.js';
import type { CreateSessionInput, UpdateSessionInput } from '@scd/validation';
import type { PoolClient } from 'pg';

export const sessionsRepository = {
  async listPublished(): Promise<SessionRow[]> {
    const { rows } = await getPool().query<SessionRow>(
      `SELECT * FROM sessions WHERE status = 'PUBLISHED' ORDER BY title`,
    );
    return rows;
  },

  async findById(id: string): Promise<SessionRow | null> {
    const { rows } = await getPool().query<SessionRow>('SELECT * FROM sessions WHERE id = $1', [
      id,
    ]);
    return rows[0] ?? null;
  },

  async getSpeakersForSessions(sessionIds: string[]): Promise<Map<string, SpeakerRow[]>> {
    if (sessionIds.length === 0) return new Map();
    const { rows } = await getPool().query<SpeakerRow & { session_id: string }>(
      `SELECT s.*, ss.session_id FROM speakers s
       JOIN session_speakers ss ON ss.speaker_id = s.id
       WHERE ss.session_id = ANY($1::uuid[])
       ORDER BY s.display_order, s.name`,
      [sessionIds],
    );
    const map = new Map<string, SpeakerRow[]>();
    for (const row of rows) {
      const list = map.get(row.session_id) ?? [];
      list.push(row);
      map.set(row.session_id, list);
    }
    return map;
  },

  /** Admin listing — every status. */
  async list(params: ListQueryParams): Promise<{ rows: SessionRow[]; total: number }> {
    return paginatedListQuery<SessionRow>(getPool(), {
      table: 'sessions',
      searchColumns: ['title', 'description', 'track'],
      sortableColumns: { title: 'title', duration: 'duration_minutes', status: 'status' },
      defaultOrderBy: 'title',
    }, params);
  },

  async replaceSpeakerLinks(client: PoolClient, sessionId: string, speakerIds: string[]): Promise<void> {
    await client.query('DELETE FROM session_speakers WHERE session_id = $1', [sessionId]);
    for (const speakerId of speakerIds) {
      await client.query(
        'INSERT INTO session_speakers (session_id, speaker_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [sessionId, speakerId],
      );
    }
  },

  /** Creates the session and, if `speakerIds` is provided, links them — as one transaction. */
  async create(input: CreateSessionInput): Promise<SessionRow> {
    return withTransaction(async (client) => {
      const { rows } = await client.query<SessionRow>(
        `INSERT INTO sessions (title, description, session_type, track, duration_minutes, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          input.title,
          input.description ?? null,
          input.sessionType ?? 'TALK',
          input.track ?? null,
          input.durationMinutes ?? null,
          input.status ?? 'DRAFT',
        ],
      );
      const session = rows[0]!;
      if (input.speakerIds) {
        await this.replaceSpeakerLinks(client, session.id, input.speakerIds);
      }
      return session;
    });
  },

  async update(id: string, patch: UpdateSessionInput): Promise<SessionRow | null> {
    return withTransaction(async (client) => {
      const { setClause, values, nextIndex } = buildUpdateSet({
        title: patch.title,
        description: patch.description,
        session_type: patch.sessionType,
        track: patch.track,
        duration_minutes: patch.durationMinutes,
        status: patch.status,
      });
      let session: SessionRow | null;
      if (values.length > 0) {
        values.push(id);
        const { rows } = await client.query<SessionRow>(
          `UPDATE sessions SET ${setClause} WHERE id = $${nextIndex} RETURNING *`,
          values,
        );
        session = rows[0] ?? null;
      } else {
        const { rows } = await client.query<SessionRow>('SELECT * FROM sessions WHERE id = $1', [id]);
        session = rows[0] ?? null;
      }
      if (session && patch.speakerIds) {
        await this.replaceSpeakerLinks(client, id, patch.speakerIds);
      }
      return session;
    });
  },

  async delete(id: string): Promise<boolean> {
    const result = await getPool().query('DELETE FROM sessions WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
