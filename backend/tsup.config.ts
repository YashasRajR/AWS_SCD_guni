import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  sourcemap: true,
  clean: true,
  // The @scd/* workspace packages ship their "main" pointing straight at
  // TypeScript source (so Vite/tsx/vitest can consume them without a
  // separate build step in dev). A plain `node dist/index.js` can't
  // execute raw .ts though, so the production build must inline them
  // rather than leave a bare `@scd/...` import for Node to resolve.
  noExternal: [/^@scd\//],
});
