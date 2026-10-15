import 'server-only';
import { getPhoneOtpSecret as getDerivedPhoneOtpSecret } from '@/features/auth/domain/rate-limit-key';
import { MockPhoneVerificationProvider } from './mock-provider';
import { createPhoneVerificationProvider } from './provider';
import { SolapiSmsTransport } from './solapi-provider';

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

export function getSolapiSmsTransport() {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const senderNumber = process.env.SOLAPI_SENDER_NUMBER;
  if (process.env.PHONE_VERIFICATION_PROVIDER !== 'solapi' || !apiKey || !apiSecret || !senderNumber) {
    throw new Error('전화 인증 공급자가 설정되지 않았습니다.');
  }
  return new SolapiSmsTransport({ apiKey, apiSecret, senderNumber });
}

export function getPhoneOtpSecret() {
  try {
    return getDerivedPhoneOtpSecret();
  } catch {
    throw new Error('전화 인증 공급자가 설정되지 않았습니다.');
  }
}
