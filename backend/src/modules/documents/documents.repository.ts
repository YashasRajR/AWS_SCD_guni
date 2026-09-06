import { getPool } from '../../config/database.js';
import type { DocumentType, DocumentVersionRow } from './documents.types.js';

/**
 * Shared version-history store for regenerated tickets/invoices (spec
 * #62). One table, two document types — same shape as the outbox pattern
 * elsewhere in this codebase (one table serving multiple entity_types via
 * a CHECK column) rather than a ticket_versions/invoice_versions pair.
 */
export const documentsRepository = {
  async archiveVersion(
    documentType: DocumentType,
    documentId: string,
    version: number,
    pdf: Buffer,
    reason: string | null,
    createdBy: string | null,
  ): Promise<void> {
    await getPool().query(
      `INSERT INTO document_versions (document_type, document_id, version, pdf_data, reason, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (document_type, document_id, version) DO NOTHING`,
      [documentType, documentId, version, pdf, reason, createdBy],
    );
  },

  async listVersions(documentType: DocumentType, documentId: string): Promise<DocumentVersionRow[]> {
    const { rows } = await getPool().query<DocumentVersionRow>(
      `SELECT id, document_type, document_id, version, reason, created_by, created_at
       FROM document_versions WHERE document_type = $1 AND document_id = $2
       ORDER BY version DESC`,
      [documentType, documentId],
    );
    return rows;
  },

  async getVersionPdf(documentType: DocumentType, documentId: string, version: number): Promise<Buffer | null> {
    const { rows } = await getPool().query<{ pdf_data: Buffer }>(
      `SELECT pdf_data FROM document_versions WHERE document_type = $1 AND document_id = $2 AND version = $3`,
      [documentType, documentId, version],
    );
    return rows[0]?.pdf_data ?? null;
  },
};
