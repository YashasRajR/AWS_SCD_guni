import type { Achievement, AttendeeAchievement, PaginatedData } from '@scd/types';
import { achievementsRepository } from './achievements.repository.js';
import { toAchievement, toAttendeeAchievement } from './achievements.types.js';
import { checkpointsRepository } from '../checkpoints/checkpoints.repository.js';
import { AppError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

interface EvaluationResult {
  achievementId: string;
  name: string;
  unlocked: boolean;
  alreadyUnlocked: boolean;
}

export const achievementsService = {
  async listForAttendee(attendeeId: string): Promise<AttendeeAchievement[]> {
    return (await achievementsRepository.listUnlockedForAttendee(attendeeId)).map(
      toAttendeeAchievement,
    );
  },

  async list(page: number, pageSize: number): Promise<PaginatedData<Achievement>> {
    const { rows, total } = await achievementsRepository.list(page, pageSize);
    return {
      items: rows.map(toAchievement),
      pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async getById(id: string): Promise<Achievement> {
    const row = await achievementsRepository.findById(id);
    if (!row) throw AppError.notFound('Achievement');
    return toAchievement(row);
  },

  async create(input: Record<string, unknown>): Promise<Achievement> {
    return toAchievement(await achievementsRepository.create(input));
  },

  async update(id: string, patch: Record<string, unknown>): Promise<Achievement> {
    const row = await achievementsRepository.update(id, patch);
    if (!row) throw AppError.notFound('Achievement');
    return toAchievement(row);
  },

  async remove(id: string): Promise<void> {
    const deleted = await achievementsRepository.delete(id);
    if (!deleted) throw AppError.notFound('Achievement');
  },

  /**
   * Rule-based achievement evaluation for a single attendee.
   * Checks every PUBLISHED achievement's condition_type and condition_config
   * against the attendee's real data. Returns evaluation results.
   */
  async evaluateForAttendee(attendeeId: string): Promise<EvaluationResult[]> {
    const achievements = await achievementsRepository.listPublished();
    const results: EvaluationResult[] = [];

    for (const achievement of achievements) {
      const alreadyUnlocked = await achievementsRepository.hasUnlocked(
        attendeeId,
        achievement.id,
      );

      if (alreadyUnlocked) {
        results.push({
          achievementId: achievement.id,
          name: achievement.name,
          unlocked: true,
          alreadyUnlocked: true,
        });
        continue;
      }

      const eligible = await this.evaluateCondition(attendeeId, achievement);
      if (eligible) {
        try {
          await achievementsRepository.unlock(attendeeId, achievement.id);
          results.push({
            achievementId: achievement.id,
            name: achievement.name,
            unlocked: true,
            alreadyUnlocked: false,
          });
        } catch (err) {
          // Race condition: another request unlocked it first — that's fine.
          logger.debug({ err, achievementId: achievement.id, attendeeId }, 'Achievement unlock race');
          results.push({
            achievementId: achievement.id,
            name: achievement.name,
            unlocked: true,
            alreadyUnlocked: true,
          });
        }
      } else {
        results.push({
          achievementId: achievement.id,
          name: achievement.name,
          unlocked: false,
          alreadyUnlocked: false,
        });
      }
    }

    return results;
  },

  /**
   * Evaluate a single achievement's condition against an attendee.
   */
  async evaluateCondition(
    attendeeId: string,
    achievement: { condition_type: string; condition_config: Record<string, unknown> | null },
  ): Promise<boolean> {
    const config = achievement.condition_config ?? {};

    switch (achievement.condition_type) {
      case 'CHECKPOINT_COUNT': {
        const minCount = Number((config as { minCount?: number }).minCount ?? 1);
        const completions = await checkpointsRepository.getAttendeeCompletions(
          attendeeId,
          // If config specifies an event_id, use it; otherwise check all
          (config as { eventId?: string }).eventId ?? '',
        );
        return completions.length >= minCount;
      }

      case 'FULL_ATTENDANCE': {
        const eventId = (config as { eventId?: string }).eventId;
        if (!eventId) return false;
        const checkpoints = await checkpointsRepository.listByEvent(eventId);
        const requiredCheckpoints = checkpoints.filter((c) => c.is_required);
        if (requiredCheckpoints.length === 0) return false;
        const completions = await checkpointsRepository.getAttendeeCompletions(attendeeId, eventId);
        const completedIds = new Set(completions.map((c) => c.checkpoint_id));
        return requiredCheckpoints.every((c) => completedIds.has(c.id));
      }

      case 'MANUAL':
        // Manual achievements are never auto-evaluated — only granted by admin
        return false;

      case 'SESSION_COUNT':
        // Session-level tracking is not yet implemented — return false for now
        return false;

      default:
        return false;
    }
  },
};
