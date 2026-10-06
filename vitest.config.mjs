import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  resolve: {alias: {'@': fileURLToPath(new URL('.',import.meta.url))}},
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      include: ['lib/demo-state.ts', 'components/SalesDemo.tsx'],
      thresholds: {lines: 80, functions: 80, branches: 80, statements: 80},
      reporter: ['text', 'json-summary'],
    },
  },
});
