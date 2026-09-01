import pino from 'pino';

// Structured logging. Never log passwords, auth secrets, payment secrets,
// tokens, or full personal data — the redact list below covers the fields
// most likely to leak accidentally through generic request/error logging.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'password_hash',
      'passwordHash',
      'token',
      '*.password',
      '*.password_hash',
      '*.passwordHash',
      '*.token',
      'body.password',
      'body.token',
    ],
    censor: '[REDACTED]',
  },
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined,
});
