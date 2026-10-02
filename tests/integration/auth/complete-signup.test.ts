import { describe, expect, it, vi } from 'vitest';
import { completeSignupWithRepository } from '@/features/auth/services/complete-signup';

describe('completeSignupWithRepository', () => {
  it('전화 인증이 없으면 프로필과 동의를 저장하지 않는다', async () => {
    const repository = {
      getVerifiedPhone: vi.fn().mockResolvedValue(null),
      saveSignup: vi.fn(),
    };

    await expect(
      completeSignupWithRepository(repository, 'user-1', {
        displayName: '홍길동',
        email: 'test@example.com',
        challengeId: 'challenge-1',
        termsAccepted: true,
        privacyAccepted: true,
        ageOver14: true,
        marketingSmsAccepted: false,
        marketingEmailAccepted: false,
      }),
    ).resolves.toEqual({ ok: false, error: 'phone_not_verified' });
    expect(repository.saveSignup).not.toHaveBeenCalled();
  });

  it('검증된 전화번호와 동의 버전을 원자 저장소에 전달한다', async () => {
    const repository = {
      getVerifiedPhone: vi.fn().mockResolvedValue({
        phoneE164: '+821012345678',
        verifiedAt: '2026-10-02T09:00:00.000Z',
      }),
      saveSignup: vi.fn().mockResolvedValue(undefined),
    };

    await expect(
      completeSignupWithRepository(repository, 'user-1', {
        displayName: '홍길동',
        email: 'test@example.com',
        challengeId: 'challenge-1',
        termsAccepted: true,
        privacyAccepted: true,
        ageOver14: true,
        marketingSmsAccepted: false,
        marketingEmailAccepted: true,
      }),
    ).resolves.toEqual({ ok: true });
    expect(repository.saveSignup).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        phoneE164: '+821012345678',
        termsVersion: '2026-10-02',
        privacyVersion: '2026-10-02',
        marketingEmailAccepted: true,
      }),
    );
  });
});
