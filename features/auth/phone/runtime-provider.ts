import 'server-only';
import { MockPhoneVerificationProvider } from './mock-provider';
import { createPhoneVerificationProvider } from './provider';

const mockProvider = new MockPhoneVerificationProvider();

export function getPhoneVerificationProvider() {
  return createPhoneVerificationProvider(
    {
      nodeEnv: process.env.NODE_ENV ?? 'development',
      provider: process.env.PHONE_VERIFICATION_PROVIDER,
    },
    mockProvider,
  );
}
