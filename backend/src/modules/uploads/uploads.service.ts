import crypto from 'node:crypto';
import path from 'node:path';
import { getStorageProvider } from '../../integrations/storage/index.js';

/** Shared by the admin upload endpoint and any attendee-facing upload
 * (e.g. the social post generator's photo field) -- both just need "put
 * this image somewhere and get a URL back". */
export const uploadsService = {
  async storeImage(file: { originalname: string; mimetype: string; buffer: Buffer }): Promise<{ url: string }> {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const key = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}${ext}`;
    return getStorageProvider().upload({ key, contentType: file.mimetype, body: file.buffer });
  },
};
