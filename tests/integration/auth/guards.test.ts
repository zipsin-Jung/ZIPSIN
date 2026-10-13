import { describe, expect, it } from 'vitest';
import { evaluateOnboarding } from '@/features/auth/guards/require-onboarding';

const complete = {
  hasSession: true,
  phoneVerifiedAt: '2026-10-02T09:00:00.000Z',
  acceptedTermsVersion: '2026-10-02',
  acceptedPrivacyVersion: '2026-10-02',
  confirmedAgeOver14: true,
  usagePurpose: 'landlord' as const,
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

  it('사용 목적이 없으면 목적 선택으로 보낸다', () => {
    expect(evaluateOnboarding({ ...complete, usagePurpose: null })).toBe('/onboarding/role');
  });

  it('관리기타는 접근 역할 없이 완료하지만 중개사는 세부 역할을 요구한다', () => {
    expect(evaluateOnboarding({ ...complete, usagePurpose: 'management_other', primaryRole: null })).toBeNull();
    expect(evaluateOnboarding({ ...complete, usagePurpose: 'broker', primaryRole: null })).toBe('/onboarding/role');
  });

  it('온보딩이 완료되면 이동시키지 않는다', () => {
    expect(evaluateOnboarding(complete)).toBeNull();
  });
});
