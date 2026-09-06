export type DocumentType = 'TICKET' | 'INVOICE';

export interface DocumentVersionRow {
  id: string;
  document_type: DocumentType;
  document_id: string;
  version: number;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DocumentVersionSummary {
  id: string;
  version: number;
  reason: string | null;
  createdAt: string;
}

export function toDocumentVersionSummary(row: DocumentVersionRow): DocumentVersionSummary {
  return { id: row.id, version: row.version, reason: row.reason, createdAt: row.created_at };
}
