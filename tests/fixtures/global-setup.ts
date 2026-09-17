import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { TEST_DATABASE_URL } from './test-env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptsDir = join(__dirname, '..', '..', 'database', 'scripts');

/**
 * Runs once before the whole test run: resets the test database to a
 * clean, fully-migrated, seeded state so every test file starts from the
 * same known baseline (including the dev accounts the auth tests rely on).
 */
export async function setup(): Promise<void> {
  const env = { ...process.env, DATABASE_URL: TEST_DATABASE_URL };
  execFileSync('node', [join(scriptsDir, 'migrate.mjs'), 'reset'], { env, stdio: 'inherit' });
  execFileSync('node', [join(scriptsDir, 'seed.mjs')], { env, stdio: 'inherit' });
}
