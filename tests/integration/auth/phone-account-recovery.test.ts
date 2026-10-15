import { describe, expect, it, vi } from 'vitest';
import { startPhoneAccountRecovery, verifyPhoneAccountRecovery } from '@/features/auth/services/phone-account-recovery';

describe('phone account recovery', () => {
  it.each([null, { userId: 'user-1' }])('가입 여부와 무관하게 같은 발송 결과를 반환한다', async (account) => {
    const repository = {
      findAccountByPhone: vi.fn().mockResolvedValue(account),
      saveChallenge: vi.fn().mockResolvedValue(undefined),
      sendOtp: vi.fn().mockResolvedValue({ providerMessageId: 'msg-1' }),
    };
    await expect(startPhoneAccountRecovery(repository, '+821012345678', { code: '123456', challengeId: 'challenge-1', digest: 'digest', expiresAt: '2026-10-14T01:05:00.000Z' }))
      .resolves.toEqual({ ok: true, challengeId: 'challenge-1', maskedPhone: '010-****-5678' });
  });

  it('OTP 성공 뒤에만 아이디를 반환한다', async () => {
    const repository = { verifyChallenge: vi.fn().mockResolvedValue({ status: 'verified' as const, username: 'home_user' }) };
    await expect(verifyPhoneAccountRecovery(repository, 'challenge-1', '123456')).resolves.toEqual({ ok: true, username: 'home_user' });
  });

  it.each(['expired', 'used', 'mismatch'] as const)('%s challenge에서 계정 정보를 반환하지 않는다', async (status) => {
    const repository = { verifyChallenge: vi.fn().mockResolvedValue({ status }) };
    await expect(verifyPhoneAccountRecovery(repository, 'challenge-1', '123456')).resolves.toEqual({ ok: false, error: status });
  });
});
