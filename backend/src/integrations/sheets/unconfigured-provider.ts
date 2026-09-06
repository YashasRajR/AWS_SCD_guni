import { SheetsProviderNotConfiguredError, type SheetsProvider } from './index.js';

export class UnconfiguredSheetsProvider implements SheetsProvider {
  readonly name = 'unconfigured';

  async appendRow(): Promise<void> {
    throw new SheetsProviderNotConfiguredError(
      'GOOGLE_SHEETS_SPREADSHEET_ID/SERVICE_ACCOUNT_EMAIL/SERVICE_ACCOUNT_KEY are not configured.',
    );
  }
}
