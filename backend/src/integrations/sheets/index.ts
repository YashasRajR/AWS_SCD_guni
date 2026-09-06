import { getEnv } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { GoogleSheetsProvider } from './google-sheets-provider.js';
import { UnconfiguredSheetsProvider } from './unconfigured-provider.js';

/**
 * Spreadsheet-sync integration boundary (spec #41) — mirrors the
 * payment/storage/email provider pattern: business logic (sheets-sync
 * module) never talks to the Google API directly, only this interface,
 * so a different destination (a real BI sheet, a different spreadsheet
 * service) can replace it later without touching call sites.
 */
export interface SheetsProvider {
  readonly name: string;
  /** Appends one row (in insertion order) to the configured spreadsheet's
   * first sheet. */
  appendRow(row: Record<string, string>): Promise<void>;
}

/** Thrown by UnconfiguredSheetsProvider — lets callers tell "not
 * configured" apart from a real API-side failure. */
export class SheetsProviderNotConfiguredError extends Error {}

let cachedProvider: SheetsProvider | undefined;

export function getSheetsProvider(): SheetsProvider {
  if (!cachedProvider) {
    const env = getEnv();
    if (
      env.GOOGLE_SHEETS_SPREADSHEET_ID &&
      env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL &&
      env.GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY
    ) {
      cachedProvider = new GoogleSheetsProvider();
    } else {
      logger.warn(
        'GOOGLE_SHEETS_* are not configured — registration sync rows will queue up but never send. Set them in .env to enable Sheets sync.',
      );
      cachedProvider = new UnconfiguredSheetsProvider();
    }
  }
  return cachedProvider;
}

/** Test-only: lets tests reset the cached singleton between provider configurations. */
export function resetSheetsProviderCache(): void {
  cachedProvider = undefined;
}
