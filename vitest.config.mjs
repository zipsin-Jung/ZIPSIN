import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  resolve: {alias: {'@': fileURLToPath(new URL('.',import.meta.url))}},
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      include: [
        'lib/demo-state.ts',
        'components/SalesDemo.tsx',
        'lib/zipsin-check/{catalog,state,storage,photo-store,contact,format}.ts',
        'components/zipsin-check/{ZipsinCheckApp,CheckStart,CheckFlow,CheckSummary,CheckCompare,PhotoField,CandidateForm,MemoPhotoSheet,ComparePicker}.tsx',
      ],
      thresholds: {lines: 80, functions: 80, branches: 80, statements: 80},
      reporter: ['text', 'json-summary'],
    },
  },
});
