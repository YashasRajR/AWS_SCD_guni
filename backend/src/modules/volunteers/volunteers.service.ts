import type { Checkpoint, CheckpointAttendance, PaginatedData, Volunteer } from '@scd/types';
import type { CreateVolunteerInput, UpdateVolunteerInput } from '@scd/validation';
import { volunteersRepository } from './volunteers.repository.js';
import { toVolunteer } from './volunteers.types.js';
import { toCheckpoint, toCheckpointAttendance } from '../checkpoints/checkpoints.types.js';
import { usersRepository } from '../users/users.repository.js';
import { checkpointsRepository } from '../checkpoints/checkpoints.repository.js';
import { AppError } from '../../utils/errors.js';

interface PgError {
  code?: string;
}

export const volunteersService = {
  async requireByUserId(userId: string): Promise<Volunteer> {
    const row = await volunteersRepository.findByUserId(userId);
    if (!row) throw AppError.notFound('Volunteer profile');
    return toVolunteer(row);
  },

  async getById(id: string): Promise<Volunteer> {
    const row = await volunteersRepository.findById(id);
    if (!row) throw AppError.notFound('Volunteer');
    return toVolunteer(row);
  },

  /**
   * Admin creation: takes the email of an already-registered user, grants
   * them the VOLUNTEER role (in addition to whatever roles they already
   * have), and creates their volunteer profile row.
   */
  async create(input: CreateVolunteerInput): Promise<Volunteer> {
    const user = await usersRepository.findByEmail(input.email);
    if (!user) {
      throw AppError.validation(
        'No account found with that email. The person must register an account first.',
      );
    }
    const existing = await volunteersRepository.findByUserId(user.id);
    if (existing) {
      throw AppError.duplicate('This user is already a volunteer.');
    }
    await usersRepository.assignRole(user.id, 'VOLUNTEER');
    try {
      return toVolunteer(await volunteersRepository.create(user.id, input.name, input.phone ?? null));
    } catch (err) {
      if ((err as PgError).code === '23505') {
        throw AppError.duplicate('This user is already a volunteer.');
      }
      throw err;
    }
  },

  async update(id: string, patch: UpdateVolunteerInput): Promise<Volunteer> {
    const row = await volunteersRepository.update(id, patch);
    if (!row) throw AppError.notFound('Volunteer');
    return toVolunteer(row);
  },

  async assignCheckpoint(volunteerId: string, checkpointId: string): Promise<void> {
    const [volunteer, checkpoint] = await Promise.all([
      volunteersRepository.findById(volunteerId),
      checkpointsRepository.findById(checkpointId),
    ]);
    if (!volunteer) throw AppError.notFound('Volunteer');
    if (!checkpoint) throw AppError.notFound('Checkpoint');
    await volunteersRepository.assignCheckpoint(volunteerId, checkpointId);
  },

  async revokeCheckpoint(volunteerId: string, checkpointId: string): Promise<void> {
    const revoked = await volunteersRepository.revokeCheckpoint(volunteerId, checkpointId);
    if (!revoked) {
      throw AppError.notFound('Active assignment for this volunteer and checkpoint');
    }
  },

  async getAssignedCheckpoints(volunteerId: string): Promise<Checkpoint[]> {
    return (await volunteersRepository.listAssignedCheckpoints(volunteerId)).map(toCheckpoint);
  },

  async getHistory(volunteerId: string): Promise<CheckpointAttendance[]> {
    const rows = await volunteersRepository.getHistory(volunteerId);
    return rows.map((row) => toCheckpointAttendance(row, row.attendee_name, row.checkpoint_name));
  },

  async list(page: number, pageSize: number): Promise<PaginatedData<Volunteer>> {
    const { rows, total } = await volunteersRepository.list(page, pageSize);
    return {
      items: rows.map(toVolunteer),
      pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
    };
  },
};
