import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Aliases resolve straight to shared package *source* (no pre-build step
// needed in dev) — esbuild/Vite compile the TS on the fly.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@scd/types': path.resolve(dirname, '../../packages/types/src/index.ts'),
      '@scd/validation': path.resolve(dirname, '../../packages/validation/src/index.ts'),
      '@scd/api-client': path.resolve(dirname, '../../packages/api-client/src/index.ts'),
      '@scd/auth': path.resolve(dirname, '../../packages/auth/src/index.ts'),
      '@scd/ui': path.resolve(dirname, '../../packages/ui/src/index.ts'),
    },
  },
  // strictPort: fail loudly if 5173 is taken instead of silently binding
  // to the next free port — a silent fallback previously sent a user to
  // an unrelated local site running on 5173 and looked like a bug here.
  server: { host: true, strictPort: true },
});
