// Minimal env for the DB-free unit config (vitest.unit.config.ts). These
// tests mock every repository they touch, so DATABASE_URL is never actually
// connected to — it only needs to satisfy env.ts's schema in case a module
// under test calls getEnv() at import time.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://unit-tests-do-not-connect/placeholder';
process.env.AUTH_SECRET = 'test-only-secret-not-for-production-use-1234567890';
process.env.LOG_LEVEL = 'silent';
