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
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}', 'tests/stress/**/*.test.{ts,tsx}'],
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
        'features/auth/actions/login-with-username.ts',
        'features/auth/actions/register-password-account.ts',
        'features/auth/actions/request-account-recovery.ts',
        'features/auth/actions/update-password.ts',
        'features/auth/components/SocialLoginButtons.tsx',
        'features/auth/components/UsernameLoginForm.tsx',
        'features/auth/components/PasswordSignupForm.tsx',
        'features/auth/components/AccountRecoveryForm.tsx',
        'features/auth/components/VerificationForm.tsx',
        'features/auth/guards/**/*.{ts,tsx}',
        'features/chat/domain/**/*.{ts,tsx}',
        'features/chat/schemas/**/*.{ts,tsx}',
        'features/chat/services/**/*.{ts,tsx}',
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
