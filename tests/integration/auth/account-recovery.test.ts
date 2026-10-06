import { describe, expect, it, vi } from 'vitest';
import { requestAccountRecovery } from '@/features/auth/services/account-recovery';

describe('requestAccountRecovery', () => {
  it.each([
    ['existing password account', null],
    ['missing account', new Error('user not found')],
    ['social-only account', new Error('password identity unavailable')],
  ])('returns the same response for %s', async (_case, error) => {
    const repository = {
      allowAttempt: vi.fn().mockResolvedValue(true),
      sendRecoveryEmail: error
        ? vi.fn().mockRejectedValue(error)
        : vi.fn().mockResolvedValue(undefined),
    };

    await expect(requestAccountRecovery(repository, 'USER@example.com'))
      .resolves.toEqual({ ok: true });
    expect(repository.sendRecoveryEmail).toHaveBeenCalledWith('user@example.com');
  });

  it('keeps the same public response when rate limited', async () => {
    const repository = {
      allowAttempt: vi.fn().mockResolvedValue(false),
      sendRecoveryEmail: vi.fn(),
    };

    await expect(requestAccountRecovery(repository, 'user@example.com'))
      .resolves.toEqual({ ok: true });
    expect(repository.sendRecoveryEmail).not.toHaveBeenCalled();
  });
});
