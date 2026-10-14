import { describe, expect, it } from 'vitest';
import { evaluateOnboarding } from '@/features/auth/guards/require-onboarding';

const complete = {
  hasSession: true,
  phoneVerifiedAt: '2026-10-02T09:00:00.000Z',
  acceptedTermsVersion: '2026-10-02',
  acceptedPrivacyVersion: '2026-10-02',
  primaryRole: 'landlord' as const,
};

describe('evaluateOnboarding', () => {
  it('세션이 없으면 로그인으로 보낸다', () => {
    expect(evaluateOnboarding({ ...complete, hasSession: false })).toBe('/login');
  });

  it('전화나 필수 동의가 없으면 인증으로 보낸다', () => {
    expect(evaluateOnboarding({ ...complete, phoneVerifiedAt: null })).toBe('/signup/verify');
    expect(evaluateOnboarding({ ...complete, acceptedTermsVersion: null })).toBe('/signup/verify');
  });

  it('역할만 없으면 역할 선택으로 보낸다', () => {
    expect(evaluateOnboarding({ ...complete, primaryRole: null })).toBe('/onboarding/role');
  });

  it('온보딩이 완료되면 이동시키지 않는다', () => {
    expect(evaluateOnboarding(complete)).toBeNull();
  });

  it('별도 연령 동의 없이 전화·약관·개인정보·역할만으로 완료한다', () => {
    expect(evaluateOnboarding(complete)).toBeNull();
    expect('confirmedAgeOver14' in complete).toBe(false);
  });
});
