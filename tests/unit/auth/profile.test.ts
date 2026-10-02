import { describe, expect, it } from 'vitest';
import {
  isOnboardingComplete,
  type OnboardingProfile,
} from '@/features/auth/domain/profile';

const completeProfile: OnboardingProfile = {
  phoneVerifiedAt: '2026-10-02T09:00:00.000Z',
  acceptedTermsVersion: '2026-10-02',
  acceptedPrivacyVersion: '2026-10-02',
  confirmedAgeOver14: true,
  primaryRole: 'landlord',
};

describe('isOnboardingComplete', () => {
  it.each([
    ['전화 인증', { phoneVerifiedAt: null }],
    ['이용약관', { acceptedTermsVersion: null }],
    ['개인정보 동의', { acceptedPrivacyVersion: null }],
    ['만 14세 확인', { confirmedAgeOver14: false }],
    ['역할', { primaryRole: null }],
  ] as const)('%s가 없으면 완료가 아니다', (_label, missing) => {
    expect(isOnboardingComplete({ ...completeProfile, ...missing })).toBe(false);
  });

  it('전화 인증·필수 동의·역할이 모두 있으면 완료다', () => {
    expect(isOnboardingComplete(completeProfile)).toBe(true);
  });
});
