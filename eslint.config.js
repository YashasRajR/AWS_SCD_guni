// Root flat ESLint config for the whole monorepo. Delegates the actual
// rule set to @scd/eslint-config so apps/packages can reuse it too.
import { baseConfig } from './packages/eslint-config/index.js';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.turbo/**',
    ],
  },
  ...baseConfig,
  {
    // Plain Node scripts (migration runner, seed script) — not bundled,
    // run directly with `node`, so they need Node globals rather than
    // browser ones.
    files: ['**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },
  {
    // CLI scripts — console output IS the product (progress/status for
    // whoever is running `npm run db:migrate` / `db:seed`).
    files: ['database/scripts/**/*.mjs'],
    rules: { 'no-console': 'off' },
  },
];
