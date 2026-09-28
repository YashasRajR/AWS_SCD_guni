import { getPool } from '../../config/database.js';
import { getEnv } from '../../config/env.js';
import type { StorageProvider } from './index.js';

/**
 * Stores uploaded files as bytes in Postgres instead of local disk. The
 * backend's Render plan has no persistent disk, so local-storage.ts's
 * files were silently wiped on every redeploy/restart while their URLs
 * stayed valid-looking in the DB (see speakers.profileImage). Postgres is
 * the one thing that's actually persistent on the free tier -- fine for
 * small admin-uploaded images; swap for a real S3/Supabase adapter behind
 * this same StorageProvider interface if uploads outgrow that.
 */
export const dbStorageProvider: StorageProvider = {
  async upload({ key, contentType, body }) {
    await getPool().query(
      `INSERT INTO uploaded_files (key, content_type, data) VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE SET content_type = EXCLUDED.content_type, data = EXCLUDED.data`,
      [key, contentType, body],
    );
    return { url: `${getEnv().PUBLIC_API_URL.replace(/\/$/, '')}/uploads/${key}` };
  },

  async getSignedUrl(key) {
    // Served publicly (see routes/uploads-serve.ts) -- no access control
    // to enforce, so the "signed" URL is just the plain public one.
    return `${getEnv().PUBLIC_API_URL.replace(/\/$/, '')}/uploads/${key}`;
  },
};
