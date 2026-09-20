import type { SocialPostSettings } from '@scd/types';

export interface SocialPostSettingsRow {
  id: number;
  linkedin_enabled: boolean;
  instagram_enabled: boolean;
  base_hashtags: string[];
  intro_lines: string[];
  updated_at: string;
}

export function toSocialPostSettings(row: SocialPostSettingsRow): SocialPostSettings {
  return {
    linkedinEnabled: row.linkedin_enabled,
    instagramEnabled: row.instagram_enabled,
    baseHashtags: row.base_hashtags,
    introLines: row.intro_lines,
    updatedAt: row.updated_at,
  };
}
