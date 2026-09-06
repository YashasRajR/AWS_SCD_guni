import type { Invoice } from '@scd/types';

export interface InvoiceRow {
  id: string;
  payment_id: string;
  registration_id: string;
  invoice_number: string;
  amount: string;
  discount_amount: string;
  tax_amount: string;
  currency: string;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
  pdf_data: Buffer | null;
  version: number;
}

export function toInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    paymentId: row.payment_id,
    registrationId: row.registration_id,
    invoiceNumber: row.invoice_number,
    amount: row.amount,
    discountAmount: row.discount_amount,
    taxAmount: row.tax_amount,
    currency: row.currency,
    generatedAt: row.generated_at,
    pdfAvailable: row.pdf_data !== null,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
