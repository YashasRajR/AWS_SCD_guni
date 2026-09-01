// Loads the repo-root `.env` before anything else in the backend runs.
//
// This MUST be the very first import in `server/index.ts`. ES modules
// evaluate every imported module's top-level code before the importing
// module's own top-level code runs — so if this logic lived inline in
// `index.ts` *after* `import { createApp } from './app.js'` (as it
// previously did, rewritten from a plain `import 'dotenv/config'`), the
// app/env/database/logger modules would already have been evaluated
// (and could already have read `process.env`) before this file's code
// ever executed. Keeping the env-loading side effect in its own module,
// imported first, guarantees it runs before any sibling import.
//
// Path resolution has to work from two different physical locations:
//   - dev (tsx, unbundled): backend/src/bootstrap-env.ts
//   - prod (tsup bundle):   backend/dist/index.js (this file's code is
//     inlined into that single flattened output)
// Both `src/` and `dist/` sit one level under `backend/`, which itself
// sits one level under the repo root — so `../../.env` reaches the root
// `.env` in both cases. The extra candidates below are cheap fallbacks;
// dotenv silently skips any path that doesn't exist and never overrides
// a variable already present in `process.env`.
import { config as loadDotenv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

loadDotenv({
  path: [
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(process.cwd(), '.env'),
  ],
});
