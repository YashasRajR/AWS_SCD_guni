import { describe, expect, it, vi, beforeEach } from 'vitest';
import type {
  CheckpointRow,
  CheckpointAttendanceRow,
} from '../../../backend/src/modules/checkpoints/checkpoints.types.js';
import type { AchievementRow } from '../../../backend/src/modules/achievements/achievements.types.js';

vi.mock('../../../backend/src/modules/checkpoints/checkpoints.repository.js', () => ({
  checkpointsRepository: {
    getAttendeeCompletions: vi.fn(),
    listByEvent: vi.fn(),
  },
}));
vi.mock('../../../backend/src/modules/achievements/achievements.repository.js', () => ({
  achievementsRepository: {
    listPublished: vi.fn(),
    hasUnlocked: vi.fn(),
    unlock: vi.fn(),
  },
}));

const { checkpointsRepository } =
  await import('../../../backend/src/modules/checkpoints/checkpoints.repository.js');
const { achievementsRepository } =
  await import('../../../backend/src/modules/achievements/achievements.repository.js');
const { achievementsService } =
  await import('../../../backend/src/modules/achievements/achievements.service.js');

describe('achievementsService.evaluateCondition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('CHECKPOINT_COUNT: unlocks once completions reach the configured minimum', async () => {
    vi.mocked(checkpointsRepository.getAttendeeCompletions).mockResolvedValue([
      { checkpoint_id: 'a' },
      { checkpoint_id: 'b' },
    ] as CheckpointAttendanceRow[]);
    const eligible = await achievementsService.evaluateCondition('attendee-1', {
      condition_type: 'CHECKPOINT_COUNT',
      condition_config: { minCount: 2 },
    });
    expect(eligible).toBe(true);
  });

  it('CHECKPOINT_COUNT: stays locked below the configured minimum', async () => {
    vi.mocked(checkpointsRepository.getAttendeeCompletions).mockResolvedValue([
      { checkpoint_id: 'a' },
    ] as CheckpointAttendanceRow[]);
    const eligible = await achievementsService.evaluateCondition('attendee-1', {
      condition_type: 'CHECKPOINT_COUNT',
      condition_config: { minCount: 2 },
    });
    expect(eligible).toBe(false);
  });

  it('FULL_ATTENDANCE: unlocks only when every required checkpoint is completed', async () => {
    vi.mocked(checkpointsRepository.listByEvent).mockResolvedValue([
      { id: 'cp-1', is_required: true },
      { id: 'cp-2', is_required: true },
      { id: 'cp-3', is_required: false },
    ] as CheckpointRow[]);
    vi.mocked(checkpointsRepository.getAttendeeCompletions).mockResolvedValue([
      { checkpoint_id: 'cp-1' },
      { checkpoint_id: 'cp-2' },
    ] as CheckpointAttendanceRow[]);
    const eligible = await achievementsService.evaluateCondition('attendee-1', {
      condition_type: 'FULL_ATTENDANCE',
      condition_config: { eventId: 'event-1' },
    });
    expect(eligible).toBe(true);
  });

  it('FULL_ATTENDANCE: stays locked when a required checkpoint is missing', async () => {
    vi.mocked(checkpointsRepository.listByEvent).mockResolvedValue([
      { id: 'cp-1', is_required: true },
      { id: 'cp-2', is_required: true },
    ] as CheckpointRow[]);
    vi.mocked(checkpointsRepository.getAttendeeCompletions).mockResolvedValue([
      { checkpoint_id: 'cp-1' },
    ] as CheckpointAttendanceRow[]);
    const eligible = await achievementsService.evaluateCondition('attendee-1', {
      condition_type: 'FULL_ATTENDANCE',
      condition_config: { eventId: 'event-1' },
    });
    expect(eligible).toBe(false);
  });

  it('FULL_ATTENDANCE: never unlocks without an eventId in config', async () => {
    const eligible = await achievementsService.evaluateCondition('attendee-1', {
      condition_type: 'FULL_ATTENDANCE',
      condition_config: {},
    });
    expect(eligible).toBe(false);
    expect(checkpointsRepository.listByEvent).not.toHaveBeenCalled();
  });

  it('MANUAL achievements never auto-unlock', async () => {
    const eligible = await achievementsService.evaluateCondition('attendee-1', {
      condition_type: 'MANUAL',
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
      {
        id: 'ach-2',
        name: 'Checked In',
        condition_type: 'CHECKPOINT_COUNT',
        condition_config: { minCount: 1 },
      },
    ] as unknown as AchievementRow[]);
    vi.mocked(achievementsRepository.hasUnlocked).mockResolvedValue(false);
    vi.mocked(checkpointsRepository.getAttendeeCompletions).mockResolvedValue([
      { checkpoint_id: 'a' },
    ] as CheckpointAttendanceRow[]);
    vi.mocked(achievementsRepository.unlock).mockRejectedValue({ code: '23505' });

    const results = await achievementsService.evaluateForAttendee('attendee-1');

    expect(results).toEqual([
      { achievementId: 'ach-2', name: 'Checked In', unlocked: true, alreadyUnlocked: true },
    ]);
  });
});
