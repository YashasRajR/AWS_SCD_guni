import type { Checkpoint, CheckpointAttendance } from '@scd/types';
import type { CreateCheckpointInput, UpdateCheckpointInput } from '@scd/validation';
import { checkpointsRepository } from './checkpoints.repository.js';
import { toCsv } from '../../utils/csv.js';
import { toCheckpoint, toCheckpointAttendance, type CheckpointProgressItem } from './checkpoints.types.js';
import { attendeesRepository } from '../attendees/attendees.repository.js';
import { achievementsService } from '../achievements/achievements.service.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

interface PgError {
  code?: string;
}

export const checkpointsService = {
  async exportAttendanceCsv(): Promise<string> {
    const rows = await checkpointsRepository.listAttendanceForExport();
    return toCsv(
      ['Checkpoint', 'Attendee name', 'Attendee email', 'Volunteer', 'Status', 'Completed at'],
      rows.map((r) => [r.checkpoint_name, r.attendee_name, r.attendee_email, r.volunteer_name, r.status, r.completed_at]),
    );
  },

  async create(input: CreateCheckpointInput): Promise<Checkpoint> {
    try {
      return toCheckpoint(await checkpointsRepository.create(input));
    } catch (err) {
      if ((err as PgError).code === '23505') {
        throw AppError.duplicate('A checkpoint with this name already exists for this event.');
      }
      throw err;
    }
  },

  async update(id: string, patch: UpdateCheckpointInput): Promise<Checkpoint> {
    try {
      const row = await checkpointsRepository.update(id, patch);
      if (!row) throw AppError.notFound('Checkpoint');
      return toCheckpoint(row);
    } catch (err) {
      if ((err as PgError).code === '23505') {
        throw AppError.duplicate('A checkpoint with this name already exists for this event.');
      }
      throw err;
    }
  },

  async remove(id: string): Promise<void> {
    const deleted = await checkpointsRepository.delete(id);
    if (!deleted) throw AppError.notFound('Checkpoint');
  },

  async listForEvent(eventId: string): Promise<Checkpoint[]> {
    return (await checkpointsRepository.listByEvent(eventId)).map(toCheckpoint);
  },

  async getProgressForAttendee(attendeeId: string, eventId: string): Promise<CheckpointProgressItem[]> {
    const [checkpoints, completions] = await Promise.all([
      checkpointsRepository.listByEvent(eventId),
      checkpointsRepository.getAttendeeCompletions(attendeeId, eventId),
    ]);
    const completedMap = new Map(completions.map((c) => [c.checkpoint_id, c.completed_at]));
    const attendanceIdMap = new Map(completions.map((c) => [c.checkpoint_id, c.id]));
    return checkpoints.map((row) => ({
      checkpoint: toCheckpoint(row),
      completed: completedMap.has(row.id),
      completedAt: completedMap.get(row.id) ?? null,
      attendanceId: attendanceIdMap.get(row.id) ?? null,
    }));
  },

  /**
   * The full validation chain from the spec: volunteer must have an
   * active assignment to this checkpoint, the checkpoint must exist and be
   * published/active, the attendee must exist, and it must not already be
   * completed. The partial unique index on checkpoint_attendance is the
   * final backstop against a race between the app-level check and the
   * insert (two volunteers scanning the same attendee at once).
   */
  async completeCheckpoint(
    volunteerId: string,
    checkpointId: string,
    attendeeId: string,
  ): Promise<CheckpointAttendance> {
    const checkpoint = await checkpointsRepository.findById(checkpointId);
    if (!checkpoint) throw AppError.notFound('Checkpoint');
    if (checkpoint.status !== 'PUBLISHED') {
      throw new AppError('CHECKPOINT_INACTIVE', 'This checkpoint is not currently active.');
    }

    const isAssigned = await checkpointsRepository.hasActiveAssignment(volunteerId, checkpointId);
    if (!isAssigned) throw AppError.checkpointNotAssigned();

    const attendee = await attendeesRepository.findById(attendeeId);
    if (!attendee) throw AppError.notFound('Attendee');

    const existing = await checkpointsRepository.findCompletedAttendance(attendeeId, checkpointId);
    if (existing) throw AppError.checkpointAlreadyCompleted();

    let row;
    try {
      row = await checkpointsRepository.createAttendance(attendeeId, checkpointId, volunteerId);
    } catch (err) {
      if ((err as PgError).code === '23505') {
        // Lost the race to a concurrent completion — same outcome either way.
        throw AppError.checkpointAlreadyCompleted();
      }
      throw err;
    }

    // Best-effort: a freshly recorded attendance may unlock an achievement
    // (e.g. "attended first activity"). Evaluation failing must never undo
    // or fail the attendance record that already committed above.
    achievementsService.evaluateForAttendee(attendeeId).catch((err) => {
      logger.warn({ err, attendeeId, checkpointId }, 'Achievement evaluation after checkpoint failed');
    });

    return toCheckpointAttendance(row);
  },

  /**
   * Admin-only correction for a mis-recorded attendance (e.g. wrong
   * attendee confirmed at a checkpoint). Sets the record to REVERSED
   * rather than deleting it — the caller (controller) is responsible for
   * writing the audit log entry, since it has the request/actor context
   * this service layer doesn't.
   */
  async reverseAttendance(attendanceId: string): Promise<CheckpointAttendance> {
    const existing = await checkpointsRepository.findAttendanceById(attendanceId);
    if (!existing) throw AppError.notFound('Attendance record');
    if (existing.status !== 'COMPLETED') {
      throw AppError.validation('Only a COMPLETED attendance record can be reversed.');
    }
    const row = await checkpointsRepository.reverseAttendance(attendanceId);
    if (!row) throw AppError.validation('Only a COMPLETED attendance record can be reversed.');
    return toCheckpointAttendance(row);
  },
};
