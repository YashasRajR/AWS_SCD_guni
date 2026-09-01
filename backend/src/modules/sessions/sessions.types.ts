import type { ContentStatus, Session, SessionType, Speaker } from '@scd/types';

export interface SessionRow {
  id: string;
  title: string;
  description: string | null;
  session_type: SessionType;
  track: string | null;
  duration_minutes: number | null;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export function toSession(row: SessionRow, speakers: Speaker[] = []): Session {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    sessionType: row.session_type,
    track: row.track,
    durationMinutes: row.duration_minutes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    speakers,
  };
}
