/**
 * File storage integration boundary (certificate PDFs, social share
 * images, profile photos, etc.). NOT implemented in this phase —
 * `STORAGE_BUCKET` is read from env but unused. A real adapter
 * (S3-compatible / Supabase Storage / etc.) implements this interface
 * when certificate/social-asset generation is built.
 */
export interface StorageProvider {
  upload(input: { key: string; contentType: string; body: Buffer }): Promise<{ url: string }>;
  getSignedUrl(key: string): Promise<string>;
}
