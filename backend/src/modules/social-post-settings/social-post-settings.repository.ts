import { getPool } from '../../config/database.js';
import { buildUpdateSet } from '../../utils/sql.js';
import type { UpdateSocialPostSettingsInput } from '@scd/validation';
import type { SocialPostSettingsRow } from './social-post-settings.types.js';

export const socialPostSettingsRepository = {
  /** Single row (id = 1), seeded by migration 063 -- always exists. */
  async get(): Promise<SocialPostSettingsRow> {
    const { rows } = await getPool().query<SocialPostSettingsRow>(
      'SELECT * FROM social_post_settings WHERE id = 1',
    );
    return rows[0]!;
  },

  async update(patch: UpdateSocialPostSettingsInput): Promise<SocialPostSettingsRow> {
    const { setClause, values } = buildUpdateSet({
      linkedin_enabled: patch.linkedinEnabled,
      instagram_enabled: patch.instagramEnabled,
      base_hashtags: patch.baseHashtags,
      intro_lines: patch.introLines,
    });
    if (values.length === 0) return this.get();
    const { rows } = await getPool().query<SocialPostSettingsRow>(
      `UPDATE social_post_settings SET ${setClause}, updated_at = now() WHERE id = 1 RETURNING *`,
      values,
    );
    return rows[0]!;
  },
};
