import { getStoredToken } from './auth-storage.js';
import { resolveApiBaseUrl } from './api.js';

/** Multipart upload needs its own fetch — apiClient (@scd/api-client) only
 * sends/parses JSON — same reasoning as the PDF-download helpers using
 * fetch directly for the one non-JSON case. */
export async function uploadImage(file: File): Promise<string> {
  const baseUrl = resolveApiBaseUrl();
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/admin/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getStoredToken() ?? ''}` },
    body: formData,
  });
  const body = (await res.json().catch(() => null)) as
    | { success: true; data: { url: string } }
    | { success: false; error: { message: string } }
    | null;
  if (!res.ok || !body?.success) {
    throw new Error(body && !body.success ? body.error.message : 'Failed to upload image.');
  }
  return body.data.url;
}
