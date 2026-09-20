import type { SocialPostSettings } from '@scd/types';
import type { UpdateSocialPostSettingsInput } from '@scd/validation';
import { socialPostSettingsRepository } from './social-post-settings.repository.js';
import { toSocialPostSettings } from './social-post-settings.types.js';

export const socialPostSettingsService = {
  async get(): Promise<SocialPostSettings> {
    return toSocialPostSettings(await socialPostSettingsRepository.get());
  },

  async update(patch: UpdateSocialPostSettingsInput): Promise<SocialPostSettings> {
    return toSocialPostSettings(await socialPostSettingsRepository.update(patch));
  },
};
