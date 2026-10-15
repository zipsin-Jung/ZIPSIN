import { describe, expect, it, vi } from 'vitest';
import { registerVerifiedPasswordAccount } from '@/features/auth/services/register-verified-password-account';

const input = {
  username: 'home_owner', password: 'password-2026', passwordConfirm: 'password-2026', email: 'owner@example.com',
  challengeId: '11111111-1111-4111-8111-111111111111', intentDigest: 'intent', claimDigest: 'claim',
  displayName: '', termsAccepted: true as const, privacyAccepted: true as const,
  next: '/ck',
};

function repository() {
  return {
    claimPhoneProof: vi.fn().mockResolvedValue(true),
    createAuthUser: vi.fn().mockResolvedValue({ userId: 'user-1', sessionCreated: true }),
    finalizeSignup: vi.fn().mockResolvedValue('ok'),
    releaseClaim: vi.fn().mockResolvedValue(true),
    deleteAuthUser: vi.fn().mockResolvedValue(true),
    isolatePhoneProof: vi.fn().mockResolvedValue(true),
    queueCleanup: vi.fn().mockResolvedValue(true),
  };
}

describe('registerVerifiedPasswordAccount', () => {
  it('does not create an account without an unconsumed verified phone proof', async () => {
    const repo = repository();
    repo.claimPhoneProof.mockResolvedValue(false);
    await expect(registerVerifiedPasswordAccount(repo, input)).resolves.toEqual({ ok: false, error: 'phone_not_verified' });
    expect(repo.createAuthUser).not.toHaveBeenCalled();
  });

  it('claims the proof, creates one user, and finalizes all product data', async () => {
    const repo = repository();
    await expect(registerVerifiedPasswordAccount(repo, input)).resolves.toEqual({ ok: true, userId: 'user-1', sessionCreated: true });
    expect(repo.claimPhoneProof).toHaveBeenCalledWith(expect.objectContaining({ challengeId: input.challengeId, intentDigest: 'intent', claimDigest: 'claim' }));
    expect(repo.finalizeSignup).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', username: 'home_owner', source: 'zipsin_check' }));
  });

  it('releases the proof when Auth creation fails', async () => {
    const repo = repository();
    repo.createAuthUser.mockResolvedValue({ error: 'account_unavailable' });
    await expect(registerVerifiedPasswordAccount(repo, input)).resolves.toEqual({ ok: false, error: 'email_unavailable' });
    expect(repo.releaseClaim).toHaveBeenCalled();
    expect(repo.finalizeSignup).not.toHaveBeenCalled();
  });

  it('deletes only the new Auth user when finalization loses a username or phone race', async () => {
    const repo = repository();
    repo.finalizeSignup.mockResolvedValue('username_unavailable');
    await expect(registerVerifiedPasswordAccount(repo, input)).resolves.toEqual({ ok: false, error: 'username_unavailable' });
    expect(repo.deleteAuthUser).toHaveBeenCalledWith('user-1');
    expect(repo.releaseClaim).toHaveBeenCalled();
  });

  it('queues cleanup and isolates the proof if compensating deletion fails', async () => {
    const repo = repository();
    repo.finalizeSignup.mockResolvedValue('service_unavailable');
    repo.deleteAuthUser.mockResolvedValue(false);
    await expect(registerVerifiedPasswordAccount(repo, input)).resolves.toEqual({ ok: false, error: 'service_unavailable' });
    expect(repo.queueCleanup).toHaveBeenCalledWith('user-1');
    expect(repo.isolatePhoneProof).toHaveBeenCalledWith(expect.objectContaining({ challengeId: input.challengeId }));
    expect(repo.releaseClaim).not.toHaveBeenCalled();
  });

  it('remains failed closed when both isolation and cleanup reporting fail', async () => {
    const repo = repository();
    repo.finalizeSignup.mockResolvedValue('service_unavailable');
    repo.deleteAuthUser.mockResolvedValue(false);
    repo.isolatePhoneProof.mockResolvedValue(false);
    repo.queueCleanup.mockResolvedValue(false);
    await expect(registerVerifiedPasswordAccount(repo, input)).resolves.toEqual({ ok: false, error: 'service_unavailable' });
    expect(repo.releaseClaim).not.toHaveBeenCalled();
  });
});
