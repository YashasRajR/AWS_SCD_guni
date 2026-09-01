#!/usr/bin/env node
// Minimal, dependency-light SQL migration runner.
//
// Usage:
//   node database/scripts/migrate.mjs up          # apply all pending migrations
//   node database/scripts/migrate.mjs down [n]     # roll back the last n migrations (default 1)
//   node database/scripts/migrate.mjs reset         # drop the public schema and re-apply everything
//   node database/scripts/migrate.mjs status         # list applied / pending migrations
//
// Migrations live in database/migrations as paired
// `NNN_name.up.sql` / `NNN_name.down.sql` files and are applied in
// filename order, each inside its own transaction, tracked in a
// `schema_migrations` table.
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPool } from './db.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function listMigrationNames() {
  const files = await readdir(MIGRATIONS_DIR);
  const names = new Set();
  for (const file of files) {
    if (file.endsWith('.up.sql')) names.add(file.replace(/\.up\.sql$/, ''));
  }
  return [...names].sort();
}

async function up(pool) {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const { rows } = await client.query('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.name));
    const all = await listMigrationNames();
    const pending = all.filter((name) => !applied.has(name));

    if (pending.length === 0) {
      console.log('No pending migrations. Database is up to date.');
      return;
    }

    for (const name of pending) {
      const sql = await readFile(join(MIGRATIONS_DIR, `${name}.up.sql`), 'utf8');
      console.log(`Applying ${name}...`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${name} failed: ${err.message}`);
      }
    }
    console.log(`Applied ${pending.length} migration(s).`);
  } finally {
    client.release();
  }
}

async function down(pool, count = 1) {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const { rows } = await client.query(
      'SELECT name FROM schema_migrations ORDER BY name DESC LIMIT $1',
      [count],
    );
    if (rows.length === 0) {
      console.log('No applied migrations to roll back.');
      return;
    }
    for (const { name } of rows) {
      const sql = await readFile(join(MIGRATIONS_DIR, `${name}.down.sql`), 'utf8');
      console.log(`Reverting ${name}...`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('DELETE FROM schema_migrations WHERE name = $1', [name]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Rollback of ${name} failed: ${err.message}`);
      }
    }
    console.log(`Reverted ${rows.length} migration(s).`);
  } finally {
    client.release();
  }
}

async function status(pool) {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const { rows } = await client.query('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.name));
    const all = await listMigrationNames();
    for (const name of all) {
      console.log(`[${applied.has(name) ? 'x' : ' '}] ${name}`);
    }
  } finally {
    client.release();
  }
}

async function reset(pool) {
  const client = await pool.connect();
  try {
    console.log('Dropping and recreating the public schema...');
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  } finally {
    client.release();
  }
  await up(pool);
}

async function main() {
  const [, , command, arg] = process.argv;
  const pool = createPool();
  try {
    switch (command) {
      case 'up':
        await up(pool);
        break;
      case 'down':
        await down(pool, arg ? Number(arg) : 1);
        break;
      case 'reset':
        await reset(pool);
        break;
      case 'status':
        await status(pool);
        break;
      default:
        console.error('Usage: migrate.mjs <up|down [n]|reset|status>');
        process.exitCode = 1;
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exitCode = 1;
});
