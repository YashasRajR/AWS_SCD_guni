import { describe, expect, it, vi, beforeEach } from 'vitest';

const CHECKPOINTS_REPO_PATH = '../../../backend/src/modules/checkpoints/checkpoints.repository.js';
const ACHIEVEMENTS_REPO_PATH = '../../../backend/src/modules/achievements/achievements.repository.js';

vi.mock(CHECKPOINTS_REPO_PATH, () => ({
  checkpointsRepository: {
    getAttendeeCompletions: vi.fn(),
    listByEvent: vi.fn(),
  },
}));
vi.mock(ACHIEVEMENTS_REPO_PATH, () => ({
  achievementsRepository: {
    listPublished: vi.fn(),
    hasUnlocked: vi.fn(),
    unlock: vi.fn(),
  },
}));

const { checkpointsRepository } = await import(CHECKPOINTS_REPO_PATH);
const { achievementsRepository } = await import(ACHIEVEMENTS_REPO_PATH);
const { achievementsService } = await import(
  '../../../backend/src/modules/achievements/achievements.service.js'
);

describe('achievementsService.evaluateCondition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('CHECKPOINT_COUNT: unlocks once completions reach the configured minimum', async () => {
    vi.mocked(checkpointsRepository.getAttendeeCompletions).mockResolvedValue([
      { checkpoint_id: 'a' },
      { checkpoint_id: 'b' },
    ]);
    const eligible = await achievementsService.evaluateCondition('attendee-1', {
      condition_type: 'CHECKPOINT_COUNT',
      condition_config: { minCount: 2 },
    });
    expect(eligible).toBe(true);
  });

  it('CHECKPOINT_COUNT: stays locked below the configured minimum', async () => {
    vi.mocked(checkpointsRepository.getAttendeeCompletions).mockResolvedValue([{ checkpoint_id: 'a' }]);
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
    ]);
    vi.mocked(checkpointsRepository.getAttendeeCompletions).mockResolvedValue([
      { checkpoint_id: 'cp-1' },
      { checkpoint_id: 'cp-2' },
    ]);
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
    ]);
    vi.mocked(checkpointsRepository.getAttendeeCompletions).mockResolvedValue([{ checkpoint_id: 'cp-1' }]);
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
    ]);
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
    ]);
    vi.mocked(achievementsRepository.hasUnlocked).mockResolvedValue(false);
    vi.mocked(checkpointsRepository.getAttendeeCompletions).mockResolvedValue([{ checkpoint_id: 'a' }]);
    vi.mocked(achievementsRepository.unlock).mockRejectedValue({ code: '23505' });

    const results = await achievementsService.evaluateForAttendee('attendee-1');

    expect(results).toEqual([
      { achievementId: 'ach-2', name: 'Checked In', unlocked: true, alreadyUnlocked: true },
    ]);
  });
});
