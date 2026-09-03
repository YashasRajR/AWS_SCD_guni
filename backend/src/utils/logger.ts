import pino from 'pino';

// Structured logging. Never log passwords, auth secrets, payment secrets,
// card data, or full personal data — the redact list below covers the
// fields most likely to leak accidentally through generic request/error
// logging (e.g. an unhandled error that dumps req.body, or a payment
// provider response object logged for debugging).
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      // Auth
      'password',
      'password_hash',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      '*.password',
      '*.password_hash',
      '*.passwordHash',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      'body.password',
      'body.token',
      // Payment provider credentials and raw card data — never legitimately
      // logged even for debugging; Razorpay's own dashboard is the place
      // to inspect a transaction.
      'paymentProviderSecret',
      'PAYMENT_PROVIDER_SECRET',
      'PAYMENT_WEBHOOK_SECRET',
      '*.cardNumber',
      '*.card_number',
      '*.cvv',
      '*.cvc',
      '*.expiryMonth',
      '*.expiryYear',
      // SMTP credentials for the email provider.
      'EMAIL_SMTP_PASSWORD',
      '*.smtpPassword',
    ],
    censor: '[REDACTED]',
  },
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined,
});
