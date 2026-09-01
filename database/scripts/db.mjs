// Shared Postgres connection helper for the migration runner and seed
// script. Deliberately dependency-light: just `pg`, no ORM/query builder.
import pg from 'pg';
import { config as loadDotenv } from 'dotenv';

loadDotenv();

const { Pool } = pg;

export function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env and configure it before running database scripts.',
    );
  }
  return new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
}
