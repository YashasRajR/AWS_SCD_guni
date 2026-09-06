import { describe, expect, it } from 'vitest';
import { buildCopy } from '../../../backend/src/modules/social-posts/social-posts.service.js';
import type { EventConfig } from '@scd/types';

const event: Partial<EventConfig> = {
  name: 'AWS Student Community Day 2026',
  eventDate: '2026-11-14T00:00:00.000Z',
  venue: 'GUNI Campus',
};

describe('buildCopy (social post generator)', () => {
  it('includes only the bio the caller supplied — never adds claims', () => {
    const { linkedinText, instagramText } = buildCopy({
      bio: 'Final-year CS student building on AWS.',
      interests: [],
      fullName: 'Asha Rao',
      event: event as EventConfig,
      eventUrl: 'https://scd.example.com',
    });
    expect(linkedinText).toContain('Final-year CS student building on AWS.');
    expect(instagramText).toContain('Final-year CS student building on AWS.');
    // No fabricated achievements/titles get appended to the caller's bio.
    expect(linkedinText).not.toMatch(/award|certified|expert/i);
  });

  it('turns selected interests into hashtags, capped, deduplicated with the base set', () => {
    const { hashtags } = buildCopy({
      bio: 'Excited to learn.',
      interests: ['Machine Learning', 'Cloud Computing', 'DevOps'],
      fullName: 'Rin',
      event: event as EventConfig,
      eventUrl: 'https://scd.example.com',
    });
    expect(hashtags).toContain('#AWSStudentCommunityDay');
    expect(hashtags).toContain('#MachineLearning');
    expect(hashtags.length).toBeLessThanOrEqual(8);
    expect(new Set(hashtags).size).toBe(hashtags.length);
  });

  it('always includes the event URL so the post links back officially', () => {
    const { linkedinText, instagramText } = buildCopy({
      bio: 'Hello world.',
      interests: [],
      fullName: 'Sam',
      event: event as EventConfig,
      eventUrl: 'https://scd.example.com',
    });
    expect(linkedinText).toContain('https://scd.example.com');
    expect(instagramText).toContain('https://scd.example.com');
  });
});
