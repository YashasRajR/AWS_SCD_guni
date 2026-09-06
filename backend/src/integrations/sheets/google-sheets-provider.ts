import { createSign } from 'node:crypto';
import { getEnv } from '../../config/env.js';
import type { SheetsProvider } from './index.js';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

/**
 * Signs a service-account JWT and exchanges it for an OAuth access token
 * (the standard Google "JWT bearer" flow — https://developers.google.com/identity/protocols/oauth2/service-account).
 * No googleapis/google-auth-library dependency: this needs exactly one
 * signed assertion and one token-exchange POST, both of which node:crypto
 * and fetch already cover — same reasoning as the Razorpay provider
 * talking to its REST API directly instead of pulling in an SDK.
 */
async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(
    JSON.stringify({
      iss: clientEmail,
      scope: SHEETS_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;
  // Service-account keys from the Google Cloud console JSON are PEM text
  // with literal "\n" sequences when passed through a single-line env var.
  const pem = privateKey.replace(/\\n/g, '\n');
  const signature = createSign('RSA-SHA256').update(unsigned).sign(pem).toString('base64url');
  const assertion = `${unsigned}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) {
    throw new Error(`Google OAuth token exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export class GoogleSheetsProvider implements SheetsProvider {
  readonly name = 'google-sheets';

  async appendRow(row: Record<string, string>): Promise<void> {
    const env = getEnv();
    const accessToken = await getAccessToken(
      env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL,
      env.GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY,
    );
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_SPREADSHEET_ID}/values/Sheet1!A:Z:append?valueInputOption=RAW`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [Object.values(row)] }),
    });
    if (!res.ok) {
      throw new Error(`Google Sheets append failed: ${res.status} ${await res.text()}`);
    }
  }
}
