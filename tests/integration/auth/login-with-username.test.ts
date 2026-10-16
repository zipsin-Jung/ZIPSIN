import { describe, expect, it, vi } from 'vitest';
import { loginWithUsername } from '@/features/auth/services/login-with-username';

function repository() {
  return {
    allowAttempt: vi.fn().mockResolvedValue(true),
    resolveIdentifier: vi.fn().mockResolvedValue({ userId: 'user-1', status: 'active' as const }),
    getAuthIdentity: vi.fn().mockResolvedValue({ email: 'private@example.com', emailConfirmed: true }),
    signInWithPassword: vi.fn().mockResolvedValue({ accepted: true, userId: 'user-1' }),
    confirmEmail: vi.fn().mockResolvedValue(true),
    activateUsername: vi.fn().mockResolvedValue(undefined),
  };
}

describe('loginWithUsername', () => {
  it('normalizes username and authenticates without returning the private email', async () => {
    const repo = repository();
    const result = await loginWithUsername(repo, { username: ' HOME_OWNER ', password: 'password123' }, true);

    expect(result).toEqual({ ok: true });
    expect(repo.resolveIdentifier).toHaveBeenCalledWith('home_owner');
    expect(repo.signInWithPassword).toHaveBeenCalledWith('private@example.com', 'password123');
    expect(JSON.stringify(result)).not.toContain('private@example.com');
  });

  it.each([
    ['missing username', null, { email: 'private@example.com', emailConfirmed: true }, true],
    ['wrong password', { userId: 'user-1', status: 'active' }, { email: 'private@example.com', emailConfirmed: true }, false],
  ])('uses the same public error for %s', async (_name, identity, authIdentity, passwordAccepted) => {
    const repo = repository();
    repo.resolveIdentifier.mockResolvedValue(identity as never);
    repo.getAuthIdentity.mockResolvedValue(authIdentity as never);
    repo.signInWithPassword.mockResolvedValue({ accepted: passwordAccepted, userId: passwordAccepted ? 'user-1' : null });

    await expect(loginWithUsername(repo, { username: 'home_owner', password: 'password123' }, true))
      .resolves.toEqual({ ok: false, error: 'invalid_credentials' });
  });

  it('activates a pending username only after confirmed successful login', async () => {
    const repo = repository();
    repo.resolveIdentifier.mockResolvedValue({ userId: 'user-1', status: 'pending' });

    await loginWithUsername(repo, { username: 'home_owner', password: 'password123' }, true);

    expect(repo.activateUsername).toHaveBeenCalledWith('user-1');
  });

  it.each([
    ['owner@example.com', 'owner@example.com'],
    ['010-1234-5678', '+821012345678'],
  ])('accepts %s as a unified identifier', async (identifier, normalized) => {
    const repo = repository();
    await expect(loginWithUsername(repo, { username: identifier, password: 'password123' }, true)).resolves.toEqual({ ok: true });
    expect(repo.resolveIdentifier).toHaveBeenCalledWith(normalized);
  });

  it('fails closed when disabled and limits repeated attempts', async () => {
    const disabled = repository();
    const limited = repository();
    limited.allowAttempt.mockResolvedValue(false);

    await expect(loginWithUsername(disabled, { username: 'home_owner', password: 'password123' }, false))
      .resolves.toEqual({ ok: false, error: 'service_unavailable' });
    await expect(loginWithUsername(limited, { username: 'home_owner', password: 'password123' }, true))
      .resolves.toEqual({ ok: false, error: 'rate_limited' });
  });

  // TEST-LOGIN-EMAIL-001 (2026-10-16 사용자 지시): 이메일 확인은 로그인 조건이 아니다.
  it('logs in a username whose email is not confirmed without asking for email confirmation', async () => {
    const repo = repository();
    repo.getAuthIdentity.mockResolvedValue({ email: 'private@example.com', emailConfirmed: false });
    await expect(loginWithUsername(repo, { username: 'home_owner', password: 'password123' }, true)).resolves.toEqual({ ok: true });
    expect(repo.signInWithPassword).toHaveBeenCalledWith('private@example.com', 'password123');
  });

  // TEST-LOGIN-EMAIL-002: Auth가 "이메일 미확인"으로 막으면 비밀번호가 맞은 뒤에만 확인 처리하고 한 번 다시 시도한다.
  it('marks the email confirmed only after Auth reports a correct password with an unconfirmed email', async () => {
    const repo = repository();
    repo.signInWithPassword
      .mockResolvedValueOnce({ accepted: false, userId: null, reason: 'email_not_confirmed' })
      .mockResolvedValueOnce({ accepted: true, userId: 'user-1' });
    await expect(loginWithUsername(repo, { username: 'home_owner', password: 'password123' }, true)).resolves.toEqual({ ok: true });
    expect(repo.confirmEmail).toHaveBeenCalledWith('user-1');
    expect(repo.signInWithPassword).toHaveBeenCalledTimes(2);
  });

  // TEST-LOGIN-EMAIL-003: 비밀번호가 틀리면 이메일을 확인 처리하지 않는다.
  it('never confirms the email when the password is wrong', async () => {
    const repo = repository();
    repo.signInWithPassword.mockResolvedValue({ accepted: false, userId: null, reason: 'invalid_credentials' });
    await expect(loginWithUsername(repo, { username: 'home_owner', password: 'password123' }, true)).resolves.toEqual({ ok: false, error: 'invalid_credentials' });
    expect(repo.confirmEmail).not.toHaveBeenCalled();
  });

  // TEST-LOGIN-EMAIL-004: 확인 처리에 실패하면 같은 공개 오류로 닫는다.
  it('fails closed when the email cannot be confirmed', async () => {
    const repo = repository();
    repo.signInWithPassword.mockResolvedValue({ accepted: false, userId: null, reason: 'email_not_confirmed' });
    repo.confirmEmail.mockResolvedValue(false);
    await expect(loginWithUsername(repo, { username: 'home_owner', password: 'password123' }, true)).resolves.toEqual({ ok: false, error: 'invalid_credentials' });
    expect(repo.signInWithPassword).toHaveBeenCalledTimes(1);
  });
});
