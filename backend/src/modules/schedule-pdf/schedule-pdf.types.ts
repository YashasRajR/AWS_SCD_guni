import type { SchedulePdfStatus } from '@scd/types';

export interface SchedulePdfRow {
  id: number;
  pdf_data: Buffer | null;
  is_manual: boolean;
  published: boolean;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export function toSchedulePdfStatus(row: SchedulePdfRow | null): SchedulePdfStatus {
  return {
    pdfAvailable: row?.pdf_data != null,
    isManual: row?.is_manual ?? false,
    published: row?.published ?? false,
    generatedAt: row?.generated_at ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}
