import 'server-only';
import { createRateLimitKey, getRateLimitSecret } from '@/features/auth/domain/rate-limit-key';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { MockPhoneVerificationProvider } from './mock-provider';
import { createPhoneVerificationProvider } from './provider';
import { SolapiPhoneVerificationProvider } from './solapi-provider';

const mockProvider = new MockPhoneVerificationProvider();

function createSolapiFromEnv() {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const senderNumber = process.env.SOLAPI_SENDER_NUMBER;
  const codeSecret = process.env.PHONE_OTP_HMAC_SECRET;
  if (!apiKey || !apiSecret || !senderNumber || !codeSecret) return null;

  return new SolapiPhoneVerificationProvider(
    { apiKey, apiSecret, senderNumber: senderNumber.replace(/\D/g, ''), codeSecret },
    {
      async allowAttempt(userId) {
        const { data, error } = await createAdminSupabaseClient().rpc('consume_auth_rate_limit', {
          p_scope: 'phone_verify',
          p_key: createRateLimitKey(userId, getRateLimitSecret()),
          p_limit: 5,
          p_window_seconds: 300,
        });
        return !error && data === true;
      },
    },
  );
}

export function getPhoneVerificationProvider() {
  return createPhoneVerificationProvider(
    {
      nodeEnv: process.env.NODE_ENV ?? 'development',
      provider: process.env.PHONE_VERIFICATION_PROVIDER,
    },
    mockProvider,
    createSolapiFromEnv,
  );
}
