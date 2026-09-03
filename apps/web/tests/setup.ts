import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// `globals: false` in vitest.config.ts means @testing-library/react's
// automatic afterEach(cleanup) (which detects a global `afterEach`) never
// registers — do it explicitly so each test starts from an empty DOM.
afterEach(cleanup);
