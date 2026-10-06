import { describe, expect, it, vi } from 'vitest';
import { registerPasswordAccount } from '@/features/auth/services/register-password-account';

const input = {
  username: 'home_owner',
  password: 'safe-password-2026',
  passwordConfirm: 'safe-password-2026',
  email: 'owner@example.com',
  termsAccepted: true as const,
  privacyAccepted: true as const,
  ageOver14: true as const,
};

function repository() {
  return {
    createAuthUser: vi.fn().mockResolvedValue({ userId: 'user-1' }),
    reserveUsername: vi.fn().mockResolvedValue(true),
    deleteAuthUser: vi.fn().mockResolvedValue(undefined),
  };
}

describe('registerPasswordAccount', () => {
  it('creates the Auth user then reserves only the normalized username', async () => {
    const repo = repository();

    await expect(registerPasswordAccount(repo, input)).resolves.toEqual({ ok: true, userId: 'user-1' });
    expect(repo.createAuthUser).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: 'safe-password-2026',
      username: 'home_owner',
    });
    expect(repo.reserveUsername).toHaveBeenCalledWith('user-1', 'home_owner');
    expect(repo.reserveUsername).not.toHaveBeenCalledWith(expect.objectContaining({ password: expect.anything() }));
  });

  it('returns the same duplicate response for an existing username or email', async () => {
    const usernameRepo = repository();
    usernameRepo.reserveUsername.mockResolvedValue(false);
    const emailRepo = repository();
    emailRepo.createAuthUser.mockResolvedValue({ error: 'email_exists' });

    await expect(registerPasswordAccount(usernameRepo, input)).resolves.toEqual({ ok: false, error: 'account_unavailable' });
    await expect(registerPasswordAccount(emailRepo, input)).resolves.toEqual({ ok: false, error: 'account_unavailable' });
  });

  it('removes only the newly created Auth user when username reservation fails', async () => {
    const repo = repository();
    repo.reserveUsername.mockResolvedValue(false);

    await registerPasswordAccount(repo, input);

    expect(repo.deleteAuthUser).toHaveBeenCalledWith('user-1');
  });

  it('returns a retryable service error when Auth creation fails', async () => {
    const repo = repository();
    repo.createAuthUser.mockResolvedValue({ error: 'service_error' });

    await expect(registerPasswordAccount(repo, input)).resolves.toEqual({ ok: false, error: 'service_unavailable' });
    expect(repo.reserveUsername).not.toHaveBeenCalled();
  });
});
