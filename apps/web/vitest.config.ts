import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Separate from vite.config.ts (dev/build) so the test runner doesn't need
// the dev server's `server` block, but shares the same package-source
// aliases so components import '@scd/types' etc. exactly as they do at
// runtime, not a built/dist copy.
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
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: false,
    css: false,
  },
});
