import pkg from 'pg';
const { Pool } = pkg;
import { env } from './env.js';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});
