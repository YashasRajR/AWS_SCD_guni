import { TEST_DATABASE_URL } from './test-env.js';

// Runs inside each test worker before any test file's imports resolve
// getEnv() — must happen before backend code calls getEnv()/getPool()
// for the first time.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.AUTH_SECRET = 'test-only-secret-not-for-production-use-1234567890';
process.env.AUTH_TOKEN_TTL = '15m';
process.env.PASSWORD_RESET_TOKEN_TTL = '1h';
process.env.EMAIL_VERIFICATION_TOKEN_TTL = '24h';
process.env.PORT = '4001';
process.env.LOG_LEVEL = 'silent';
