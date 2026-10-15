import { describe, expect, it } from 'vitest';
import {
  isOnboardingComplete,
  type OnboardingProfile,
} from '@/features/auth/domain/profile';

const completeProfile: OnboardingProfile = {
  phoneVerifiedAt: '2026-10-02T09:00:00.000Z',
  acceptedTermsVersion: '2026-10-02',
  acceptedPrivacyVersion: '2026-10-02',
  usagePurpose: 'landlord',
  primaryRole: 'landlord',
};

describe('isOnboardingComplete', () => {
  it.each([
    ['전화 인증', { phoneVerifiedAt: null }],
    ['이용약관', { acceptedTermsVersion: null }],
    ['개인정보 동의', { acceptedPrivacyVersion: null }],
    ['사용 목적', { usagePurpose: null }],
  ] as const)('%s가 없으면 완료가 아니다', (_label, missing) => {
    expect(isOnboardingComplete({ ...completeProfile, ...missing })).toBe(false);
  });

  it('전화 인증·필수 동의·사용 목적이 모두 있으면 완료다', () => {
    expect(isOnboardingComplete(completeProfile)).toBe(true);
  });

  it('TEST-ZH-LIFE-001-E 관리기타는 권한 역할 없이 완료하고 중개사는 세부 역할이 필요하다', () => {
    expect(isOnboardingComplete({ ...completeProfile, usagePurpose: 'management_other', primaryRole: null })).toBe(true);
    expect(isOnboardingComplete({ ...completeProfile, usagePurpose: 'broker', primaryRole: null })).toBe(false);
    expect(isOnboardingComplete({ ...completeProfile, usagePurpose: 'broker', primaryRole: 'assistant' })).toBe(true);
  });
});
