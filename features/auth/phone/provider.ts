import type { MockPhoneVerificationProvider } from './mock-provider';

export type PhoneChallenge = {
  id: string;
  expiresAt: string;
  developmentCode?: string;
};

export type PhoneVerificationResult =
  | { ok: true; phoneE164: string; verifiedAt: string }
  | { ok: false; reason: 'not_found' | 'mismatch' | 'expired' | 'attempts_exceeded' | 'used' };

export interface PhoneVerificationProvider {
  sendCode(phoneE164: string, userId: string): Promise<PhoneChallenge>;
  verifyCode(
    challengeId: string,
    code: string,
    userId: string,
  ): Promise<PhoneVerificationResult>;
}

type ProviderConfig = {
  nodeEnv: string;
  provider: string | undefined;
};

export function createPhoneVerificationProvider(
  config: ProviderConfig,
  mockProvider?: MockPhoneVerificationProvider,
): PhoneVerificationProvider {
  if (config.provider === 'mock' && config.nodeEnv !== 'production' && mockProvider) {
    return mockProvider;
  }
  if (config.provider === 'mock' && config.nodeEnv === 'production') {
    throw new Error('Production에서는 모의 전화 인증을 사용할 수 없습니다.');
  }
  throw new Error('전화 인증 공급자가 설정되지 않았습니다.');
}
