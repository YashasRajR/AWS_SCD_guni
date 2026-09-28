import { dbStorageProvider } from './db-storage.js';

/**
 * File storage integration boundary (certificate PDFs, social share
 * images, profile photos, etc.). Backed by a Postgres-blob adapter (see
 * db-storage.ts) -- `STORAGE_BUCKET` is read from env but unused. Was
 * local-disk (local-storage.ts) until the backend's Render plan turned
 * out to have no persistent disk, silently wiping uploads on every
 * redeploy/restart. A real S3-compatible/Supabase Storage adapter
 * implements this same interface without any caller (uploads module,
 * etc.) needing to change.
 */
export interface StorageProvider {
  upload(input: { key: string; contentType: string; body: Buffer }): Promise<{ url: string }>;
  getSignedUrl(key: string): Promise<string>;
}

export function getStorageProvider(): StorageProvider {
  return dbStorageProvider;
}
