import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getEnv } from '../../config/env.js';
import type { StorageProvider } from './index.js';

/**
 * ponytail: local disk, not S3 — no object-storage credentials exist in
 * this deployment yet, and StorageProvider is the seam an S3-compatible
 * adapter drops into later without touching any caller. Single-instance
 * only (files live on this process's disk); add an S3/Supabase adapter
 * behind this same interface before scaling to multiple backend instances.
 */
function resolveUploadDir(): string {
  return path.resolve(process.cwd(), getEnv().UPLOAD_DIR);
}

export const localStorageProvider: StorageProvider = {
  async upload({ key, body }) {
    const dir = resolveUploadDir();
    const filePath = path.join(dir, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, body);
    return { url: `${getEnv().PUBLIC_API_URL.replace(/\/$/, '')}/uploads/${key}` };
  },

  async getSignedUrl(key) {
    // Local files are served directly and publicly by express.static —
    // there's no access control to enforce, so the "signed" URL is just
    // the plain public one.
    return `${getEnv().PUBLIC_API_URL.replace(/\/$/, '')}/uploads/${key}`;
  },
};

export { resolveUploadDir };
