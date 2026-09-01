import type { Certificate, CertificateStatus, CertificateType } from '@scd/types';

export interface CertificateRow {
  id: string;
  attendee_id: string;
  certificate_number: string;
  certificate_type: CertificateType;
  title: string;
  issued_at: string;
  file_url: string | null;
  status: CertificateStatus;
  created_at: string;
  updated_at: string;
}

export function toCertificate(row: CertificateRow): Certificate {
  return {
    id: row.id,
    attendeeId: row.attendee_id,
    certificateNumber: row.certificate_number,
    certificateType: row.certificate_type,
    title: row.title,
    issuedAt: row.issued_at,
    fileUrl: row.file_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
