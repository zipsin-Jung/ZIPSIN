import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  resolve: {alias: {
    '@': fileURLToPath(new URL('.',import.meta.url)),
    'server-only': fileURLToPath(new URL('./lib/test/server-only.ts',import.meta.url)),
  }},
  test: {
    environment: 'jsdom',
    exclude: ['tests/e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      include: [
        'lib/demo-state.ts',
        'components/SalesDemo.tsx',
        'lib/zipsin-check/{catalog,state,storage,photo-store,contact,format}.ts',
        'components/zipsin-check/{ZipsinCheckApp,CheckStart,CheckFlow,CheckSummary,CheckCompare,PhotoField,CandidateForm,MemoPhotoSheet,ComparePicker}.tsx',
        'lib/env/{public,server}.ts',
        'features/auth/domain/{providers,return-path}.ts',
        'features/account/domain/profile.ts',
        'features/check-transfer/domain/{build-local-manifest,schema,selection}.ts',
        'features/check-transfer/client/{uploader,run-transfer}.ts',
        'features/check-transfer/server/{service,photo-service}.ts',
        'features/candidates/server/service.ts',
        'components/auth/LoginPanel.tsx',
        'components/account/TenantOnboardingForm.tsx',
        'components/check-transfer/{TransferPreview,PhotoSelection,PrivacyNotice,TransferConsent}.tsx',
      ],
      thresholds: {lines: 80, functions: 80, branches: 80, statements: 80},
      reporter: ['text', 'json-summary'],
    },
  },
});
