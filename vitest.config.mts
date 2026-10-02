import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname),
      'server-only': path.resolve(
        import.meta.dirname,
        'tests/stubs/server-only.ts',
      ),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'features/auth/domain/**/*.{ts,tsx}',
        'features/auth/schemas/**/*.{ts,tsx}',
        'features/auth/services/**/*.{ts,tsx}',
        'features/auth/phone/provider.ts',
        'features/auth/phone/mock-provider.ts',
        'features/auth/actions/start-oauth.ts',
        'features/auth/components/SocialLoginButtons.tsx',
        'lib/env/**/*.{ts,tsx}',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 80,
      },
    },
  },
});
