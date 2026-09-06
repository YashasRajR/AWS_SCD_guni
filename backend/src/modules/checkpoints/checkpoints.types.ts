import type { Checkpoint, CheckpointAttendance, CheckpointAttendanceStatus, ContentStatus } from '@scd/types';

export interface CheckpointRow {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  display_order: number;
  is_required: boolean;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface CheckpointAttendanceRow {
  id: string;
  attendee_id: string;
  checkpoint_id: string;
  volunteer_id: string | null;
  status: CheckpointAttendanceStatus;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

export interface CheckpointAttendanceExportRow {
  checkpoint_name: string;
  attendee_name: string;
  attendee_email: string;
  volunteer_name: string | null;
  status: CheckpointAttendanceStatus;
  completed_at: string;
}

export interface CheckpointProgressItem {
  checkpoint: Checkpoint;
  completed: boolean;
  completedAt: string | null;
  /** Present only when completed -- lets a caller (e.g. the admin
   * attendee-detail page) link straight to the correction endpoint
   * (POST /admin/checkpoints/attendance/:attendanceId/reverse). */
  attendanceId: string | null;
}

export function toCheckpoint(row: CheckpointRow): Checkpoint {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    description: row.description,
    location: row.location,
    startTime: row.start_time,
    endTime: row.end_time,
    displayOrder: row.display_order,
    isRequired: row.is_required,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * attendeeName/checkpointName are optional joined display fields — only
 * the volunteer history endpoint populates them (a raw checkpoint_attendance
 * row has no name columns of its own); every other caller omits them and
 * gets undefined, same as Session.speakers/AgendaItem.venue elsewhere.
 */
export function toCheckpointAttendance(
  row: CheckpointAttendanceRow,
  attendeeName?: string,
  checkpointName?: string,
): CheckpointAttendance {
  return {
    id: row.id,
    attendeeId: row.attendee_id,
    checkpointId: row.checkpoint_id,
    volunteerId: row.volunteer_id,
    status: row.status,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    attendeeName,
    checkpointName,
  };
}
