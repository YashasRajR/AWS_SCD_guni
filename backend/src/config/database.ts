import pg from 'pg';
import { getEnv } from './env.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

let pool: pg.Pool | undefined;

export function getPool(): pg.Pool {
  if (!pool) {
    const env = getEnv();
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30_000,
    });
    pool.on('error', (err: Error) => {
      // Fired for idle clients that error out in the background — log and
      // keep serving; individual query failures are handled at call sites.
      logger.error({ err }, 'Unexpected database pool error');
    });
  }
  return pool;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await getPool().query('SELECT 1');
    return true;
  } catch (err) {
    logger.error({ err }, 'Database health check failed');
    return false;
  }
}

/**
 * Runs `fn` inside a single BEGIN/COMMIT, rolling back on any error. Use
 * this whenever a write touches more than one table and needs to succeed
 * or fail as a unit (e.g. creating a session and linking its speakers).
 */
export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
