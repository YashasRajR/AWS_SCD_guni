import { localStorageProvider } from './local-storage.js';

/**
 * File storage integration boundary (certificate PDFs, social share
 * images, profile photos, etc.). Backed by a local-disk adapter for now
 * (see local-storage.ts) -- `STORAGE_BUCKET` is read from env but unused.
 * A real S3-compatible/Supabase Storage adapter implements this same
 * interface without any caller (uploads module, etc.) needing to change.
 */
export interface StorageProvider {
  upload(input: { key: string; contentType: string; body: Buffer }): Promise<{ url: string }>;
  getSignedUrl(key: string): Promise<string>;
}

export function getStorageProvider(): StorageProvider {
  return localStorageProvider;
}
