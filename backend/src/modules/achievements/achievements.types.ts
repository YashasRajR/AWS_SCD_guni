import type { Achievement, AchievementConditionType, AttendeeAchievement, ContentStatus } from '@scd/types';

export interface AchievementRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  condition_type: AchievementConditionType;
  condition_config: Record<string, unknown> | null;
  display_order: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface AttendeeAchievementRow {
  id: string;
  attendee_id: string;
  achievement_id: string;
  unlocked_at: string;
  created_at: string;
}

export function toAchievement(row: AchievementRow): Achievement {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    iconUrl: row.icon_url,
    conditionType: row.condition_type,
    conditionConfig: row.condition_config,
    displayOrder: row.display_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toAttendeeAchievement(row: AttendeeAchievementRow): AttendeeAchievement {
  return {
    id: row.id,
    attendeeId: row.attendee_id,
    achievementId: row.achievement_id,
    unlockedAt: row.unlocked_at,
    createdAt: row.created_at,
  };
}
