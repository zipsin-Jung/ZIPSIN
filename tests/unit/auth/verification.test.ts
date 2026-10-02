import { describe, expect, it } from 'vitest';
import {
  maskPhone,
  normalizeKoreanMobile,
  signupSchema,
} from '@/features/auth/schemas/verification';
import { MockPhoneVerificationProvider } from '@/features/auth/phone/mock-provider';
import { createPhoneVerificationProvider } from '@/features/auth/phone/provider';

describe('phone verification', () => {
  it('한국 휴대전화번호를 국제 형식으로 바꾼다', () => {
    expect(normalizeKoreanMobile('010-1234-5678')).toBe('+821012345678');
    expect(() => normalizeKoreanMobile('02-123-4567')).toThrow('휴대전화');
  });

  it('전화번호를 화면용으로 마스킹한다', () => {
    expect(maskPhone('+821012345678')).toBe('010-****-5678');
  });

  it('인증번호 만료·불일치·횟수 제한을 구분한다', async () => {
    let now = new Date('2026-10-02T09:00:00.000Z');
    const provider = new MockPhoneVerificationProvider({
      now: () => now,
      code: '123456',
      maxAttempts: 2,
    });
    const challenge = await provider.sendCode('+821012345678', 'user-1');

    await expect(provider.verifyCode(challenge.id, '000000', 'user-1')).resolves.toEqual({
      ok: false,
      reason: 'mismatch',
    });
    await expect(provider.verifyCode(challenge.id, '000000', 'user-1')).resolves.toEqual({
      ok: false,
      reason: 'attempts_exceeded',
    });

    const expired = await provider.sendCode('+821012345678', 'user-1');
    now = new Date('2026-10-02T09:06:00.000Z');
    await expect(provider.verifyCode(expired.id, '123456', 'user-1')).resolves.toEqual({
      ok: false,
      reason: 'expired',
    });
  });

  it('같은 인증 성공을 다시 사용할 수 없다', async () => {
    const provider = new MockPhoneVerificationProvider({ code: '123456' });
    const challenge = await provider.sendCode('+821012345678', 'user-1');
    await expect(provider.verifyCode(challenge.id, '123456', 'user-1')).resolves.toMatchObject({ ok: true });
    await expect(provider.verifyCode(challenge.id, '123456', 'user-1')).resolves.toEqual({
      ok: false,
      reason: 'used',
    });
  });

  it('Production에서는 모의 공급자를 만들지 않는다', () => {
    expect(() =>
      createPhoneVerificationProvider({ nodeEnv: 'production', provider: 'mock' }),
    ).toThrow('Production');
  });
});

describe('signupSchema', () => {
  it('필수 동의가 빠진 가입을 거부한다', () => {
    const result = signupSchema.safeParse({
      displayName: '홍길동',
      email: 'test@example.com',
      challengeId: 'challenge-1',
      termsAccepted: false,
      privacyAccepted: true,
      ageOver14: true,
    });
    expect(result.success).toBe(false);
  });
});
