import { getPool } from '../../config/database.js';
import type { InvoiceRow } from './invoices.types.js';

// Excludes pdf_data on list/lookup — same rationale as tickets.repository.ts.
const INVOICE_COLUMNS = `
  id, payment_id, registration_id, invoice_number, amount, discount_amount,
  tax_amount, currency, generated_at, created_at, updated_at,
  NULL::bytea AS pdf_data
`;

export const invoicesRepository = {
  async findByRegistrationId(registrationId: string): Promise<InvoiceRow | null> {
    const { rows } = await getPool().query<InvoiceRow>(
      `SELECT ${INVOICE_COLUMNS} FROM invoices WHERE registration_id = $1`,
      [registrationId],
    );
    return rows[0] ?? null;
  },

  async findByPaymentId(paymentId: string): Promise<InvoiceRow | null> {
    const { rows } = await getPool().query<InvoiceRow>(
      `SELECT ${INVOICE_COLUMNS} FROM invoices WHERE payment_id = $1`,
      [paymentId],
    );
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<InvoiceRow | null> {
    const { rows } = await getPool().query<InvoiceRow>(`SELECT ${INVOICE_COLUMNS} FROM invoices WHERE id = $1`, [
      id,
    ]);
    return rows[0] ?? null;
  },

  async findPdfData(id: string): Promise<Buffer | null> {
    const { rows } = await getPool().query<{ pdf_data: Buffer | null }>(
      'SELECT pdf_data FROM invoices WHERE id = $1',
      [id],
    );
    return rows[0]?.pdf_data ?? null;
  },

  async list(page: number, pageSize: number): Promise<{ rows: InvoiceRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [{ rows }, countResult] = await Promise.all([
      getPool().query<InvoiceRow>(
        `SELECT ${INVOICE_COLUMNS} FROM invoices ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [pageSize, offset],
      ),
      getPool().query<{ count: string }>('SELECT count(*) FROM invoices'),
    ]);
    return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
  },

  /**
   * One invoice per payment (invoices_payment_id_unique). Everything an
   * invoice needs (including its own invoice_number and rendered PDF) is
   * computed by the caller up front, so this is a single INSERT.
   *
   * Race-safe the same way tickets.repository.issue() is: ON CONFLICT DO
   * NOTHING makes a concurrent retry a silent no-op, then re-select
   * returns the one row that actually won.
   */
  async create(input: {
    paymentId: string;
    registrationId: string;
    invoiceNumber: string;
    amount: string;
    discountAmount: string;
    currency: string;
    pdf: Buffer;
  }): Promise<InvoiceRow> {
    const { rows } = await getPool().query<{ id: string }>(
      `INSERT INTO invoices (payment_id, registration_id, invoice_number, amount, discount_amount, currency, pdf_data, generated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())
       ON CONFLICT (payment_id) DO NOTHING
       RETURNING id`,
      [
        input.paymentId,
        input.registrationId,
        input.invoiceNumber,
        input.amount,
        input.discountAmount,
        input.currency,
        input.pdf,
      ],
    );
    if (rows[0]) return (await this.findById(rows[0].id))!;
    const existing = await this.findByPaymentId(input.paymentId);
    if (!existing) throw new Error(`Invoice insert conflicted for payment ${input.paymentId} but no row found`);
    return existing;
  },
};
