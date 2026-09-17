import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { AchievementRow } from '../../../backend/src/modules/achievements/achievements.types.js';

vi.mock('../../../backend/src/modules/achievements/achievements.repository.js', () => ({
  achievementsRepository: {
    listPublished: vi.fn(),
    hasUnlocked: vi.fn(),
    unlock: vi.fn(),
  },
}));

const { achievementsRepository } =
  await import('../../../backend/src/modules/achievements/achievements.repository.js');
const { achievementsService } =
  await import('../../../backend/src/modules/achievements/achievements.service.js');

describe('achievementsService.evaluateCondition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('MANUAL achievements never auto-unlock', async () => {
    const eligible = await achievementsService.evaluateCondition('attendee-1', {
      condition_type: 'MANUAL',
      condition_config: null,
    });
    expect(eligible).toBe(false);
  });

  it('SESSION_COUNT never auto-unlocks (session-level tracking not yet implemented)', async () => {
    const eligible = await achievementsService.evaluateCondition('attendee-1', {
      condition_type: 'SESSION_COUNT',
      condition_config: null,
    });
    expect(eligible).toBe(false);
  });

  it('unknown condition types never unlock', async () => {
    const eligible = await achievementsService.evaluateCondition('attendee-1', {
      condition_type: 'SOMETHING_UNRECOGNIZED',
      condition_config: null,
    });
    expect(eligible).toBe(false);
  });
});

describe('achievementsService.evaluateForAttendee', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips already-unlocked achievements without re-evaluating their condition', async () => {
    vi.mocked(achievementsRepository.listPublished).mockResolvedValue([
      { id: 'ach-1', name: 'First Steps', condition_type: 'MANUAL', condition_config: null },
    ] as AchievementRow[]);
    vi.mocked(achievementsRepository.hasUnlocked).mockResolvedValue(true);

    const results = await achievementsService.evaluateForAttendee('attendee-1');

    expect(results).toEqual([
      { achievementId: 'ach-1', name: 'First Steps', unlocked: true, alreadyUnlocked: true },
    ]);
    expect(achievementsRepository.unlock).not.toHaveBeenCalled();
  });

  it('treats a concurrent unlock race (unlock() throwing) as already unlocked, not an error', async () => {
    vi.mocked(achievementsRepository.listPublished).mockResolvedValue([
      { id: 'ach-2', name: 'First Steps', condition_type: 'MANUAL', condition_config: null },
    ] as unknown as AchievementRow[]);
    vi.mocked(achievementsRepository.hasUnlocked).mockResolvedValue(false);
    vi.mocked(achievementsRepository.unlock).mockRejectedValue({ code: '23505' });
    // No condition type currently auto-unlocks (MANUAL/SESSION_COUNT are
    // both always false) -- force eligibility to exercise the race branch.
    const spy = vi.spyOn(achievementsService, 'evaluateCondition').mockResolvedValue(true);

    const results = await achievementsService.evaluateForAttendee('attendee-1');

    expect(results).toEqual([
      { achievementId: 'ach-2', name: 'First Steps', unlocked: true, alreadyUnlocked: true },
    ]);
    spy.mockRestore();
  });
});
