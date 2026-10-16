import { describe, expect, it, vi } from 'vitest';
import { startPhoneAccountRecovery, verifyPhoneAccountRecovery } from '@/features/auth/services/phone-account-recovery';

const challenge = { code: '123456', challengeId: 'challenge-1', digest: 'digest', expiresAt: '2026-10-14T01:05:00.000Z' };

function repository(account: { userId: string; name: string | null } | null) {
  return {
    findAccountByPhone: vi.fn().mockResolvedValue(account),
    saveChallenge: vi.fn().mockResolvedValue(undefined),
    sendOtp: vi.fn().mockResolvedValue({ providerMessageId: 'msg-1' }),
  };
}

describe('phone account recovery (이름 + 휴대폰 인증 → 새 비밀번호)', () => {
  it('TEST-PWRESET-001: 이름과 번호가 맞으면 문자를 보내고 계정을 묶어 둔다', async () => {
    const repo = repository({ userId: 'user-1', name: '정민선' });
    await expect(startPhoneAccountRecovery(repo, { name: ' 정 민선', phoneE164: '+821012345678' }, challenge))
      .resolves.toEqual({ ok: true, challengeId: 'challenge-1', maskedPhone: '010-****-5678' });
    expect(repo.sendOtp).toHaveBeenCalledWith({ to: '+821012345678', code: '123456', expiresInMinutes: 5 });
    expect(repo.saveChallenge).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', providerMessageId: 'msg-1' }));
  });

  it.each([
    ['가입되지 않은 번호', null, '정민선'],
    ['이름이 다름', { userId: 'user-1', name: '김집신' }, '정민선'],
    ['저장된 이름 없음', { userId: 'user-1', name: null }, '정민선'],
    ['빈 이름', { userId: 'user-1', name: '정민선' }, '   '],
  ])('TEST-PWRESET-002: %s이면 문자를 보내지 않는다', async (_label, account, name) => {
    const repo = repository(account);
    await expect(startPhoneAccountRecovery(repo, { name, phoneE164: '+821012345678' }, challenge))
      .resolves.toEqual({ ok: false, error: 'not_found' });
    expect(repo.sendOtp).not.toHaveBeenCalled();
    expect(repo.saveChallenge).not.toHaveBeenCalled();
  });

  it('TEST-PWRESET-003: OTP 성공 뒤에만 아이디를 반환한다', async () => {
    const repo = { verifyChallenge: vi.fn().mockResolvedValue({ status: 'verified' as const, username: 'home_user' }) };
    await expect(verifyPhoneAccountRecovery(repo, 'challenge-1', '123456')).resolves.toEqual({ ok: true, username: 'home_user' });
  });

  it.each(['expired', 'used', 'mismatch'] as const)('TEST-PWRESET-004: %s challenge에서 계정 정보를 반환하지 않는다', async (status) => {
    const repo = { verifyChallenge: vi.fn().mockResolvedValue({ status }) };
    await expect(verifyPhoneAccountRecovery(repo, 'challenge-1', '123456')).resolves.toEqual({ ok: false, error: status });
  });
});
