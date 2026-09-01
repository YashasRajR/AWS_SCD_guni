import { pool } from '../../config/database.js';

export interface CreatePaymentOrderInput {
  registrationId: string;
  amount: number;
  currency?: string;
  provider?: string;
}

export class PaymentIntegrationService {
  static async createOrder(input: CreatePaymentOrderInput) {
    const { registrationId, amount, currency = 'INR', provider = 'RAZORPAY_MOCK' } = input;
    const providerPaymentId = `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const query = `
      INSERT INTO payments (registration_id, provider, provider_payment_id, amount, currency, status)
      VALUES ($1, $2, $3, $4, $5, 'PENDING')
      RETURNING *;
    `;

    const res = await pool.query(query, [registrationId, provider, providerPaymentId, amount, currency]);
    const payment = res.rows[0];

    return {
      paymentId: payment.id,
      providerPaymentId: payment.provider_payment_id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      checkoutUrl: `/payment?paymentId=${payment.id}&amount=${amount}`
    };
  }

  static async verifyAndConfirm(paymentId: string, providerPaymentId: string) {
    const updatePaymentQuery = `
      UPDATE payments
      SET status = 'PAID', paid_at = now(), provider_payment_id = $2, updated_at = now()
      WHERE id = $1
      RETURNING *;
    `;
    const paymentRes = await pool.query(updatePaymentQuery, [paymentId, providerPaymentId]);
    if (paymentRes.rowCount === 0) {
      throw new Error('Payment record not found');
    }

    const payment = paymentRes.rows[0];

    const updateRegQuery = `
      UPDATE registrations
      SET status = 'CONFIRMED', confirmed_at = now(), updated_at = now()
      WHERE id = $1
      RETURNING *;
    `;
    const regRes = await pool.query(updateRegQuery, [payment.registration_id]);
    const registration = regRes.rows[0];

    return { payment, registration };
  }
}
