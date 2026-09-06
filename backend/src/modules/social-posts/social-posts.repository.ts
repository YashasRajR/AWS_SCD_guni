import { getPool } from '../../config/database.js';
import type { SocialPostRow } from './social-posts.types.js';

export const socialPostsRepository = {
  async findByAttendeeId(attendeeId: string): Promise<SocialPostRow | null> {
    const { rows } = await getPool().query<SocialPostRow>(
      'SELECT * FROM attendee_social_posts WHERE attendee_id = $1',
      [attendeeId],
    );
    return rows[0] ?? null;
  },

  /**
   * One row per attendee -- saving (including "Regenerate") always
   * overwrites the draft in place and clears any prior approval, since the
   * text just changed.
   */
  async upsert(input: {
    attendeeId: string;
    bio: string;
    interests: string[];
    photoUrl: string | null;
    linkedinText: string;
    instagramText: string;
    hashtags: string[];
  }): Promise<SocialPostRow> {
    const { rows } = await getPool().query<SocialPostRow>(
      `INSERT INTO attendee_social_posts
         (attendee_id, bio, interests, photo_url, linkedin_text, instagram_text, hashtags, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)
       ON CONFLICT (attendee_id) DO UPDATE SET
         bio = EXCLUDED.bio,
         interests = EXCLUDED.interests,
         photo_url = EXCLUDED.photo_url,
         linkedin_text = EXCLUDED.linkedin_text,
         instagram_text = EXCLUDED.instagram_text,
         hashtags = EXCLUDED.hashtags,
         approved_at = NULL
       RETURNING *`,
      [
        input.attendeeId,
        input.bio,
        input.interests,
        input.photoUrl,
        input.linkedinText,
        input.instagramText,
        input.hashtags,
      ],
    );
    return rows[0]!;
  },

  async approve(attendeeId: string): Promise<SocialPostRow | null> {
    const { rows } = await getPool().query<SocialPostRow>(
      'UPDATE attendee_social_posts SET approved_at = now() WHERE attendee_id = $1 RETURNING *',
      [attendeeId],
    );
    return rows[0] ?? null;
  },
};
