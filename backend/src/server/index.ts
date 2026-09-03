// Must stay the very first import in this file. ES modules evaluate every
// imported module's top-level code before this file's own top-level code
// runs, in the order the imports are listed — so this has to be the first
// import statement, not inline code positioned before the others textually.
// See bootstrap-env.ts for the full explanation and why plain
// `import 'dotenv/config'` broke under `npm run dev:backend` (cwd is
// backend/, not the repo root, when npm launches a workspace script).
import '../bootstrap-env.js';
import { createApp } from './app.js';
import { getEnv } from '../config/env.js';
import { checkDatabaseConnection, closeDatabasePool } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { startEmailWorker, stopEmailWorker } from '../jobs/email-worker.js';

async function main(): Promise<void> {
  const env = getEnv();

  const connected = await checkDatabaseConnection();
  if (!connected) {
    logger.error('Could not connect to the database on startup. Check DATABASE_URL in .env.');
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`Backend listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const emailWorkerTimer = startEmailWorker();

  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    stopEmailWorker(emailWorkerTimer);
    server.close(async (err) => {
      if (err) {
        logger.error({ err }, 'Error while closing HTTP server');
      }
      await closeDatabasePool();
      process.exit(err ? 1 : 0);
    });
    // Force-exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
