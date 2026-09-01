import type { AttendeeAchievement } from '@scd/types';
import { achievementsRepository } from './achievements.repository.js';
import { toAttendeeAchievement } from './achievements.types.js';

/**
 * Model + service boundary only in this phase — no condition-evaluation
 * engine yet. Reads whatever has been unlocked (nothing, until a later
 * phase implements the unlock engine).
 */
export const achievementsService = {
  async listForAttendee(attendeeId: string): Promise<AttendeeAchievement[]> {
    return (await achievementsRepository.listUnlockedForAttendee(attendeeId)).map(
      toAttendeeAchievement,
    );
  },
};
