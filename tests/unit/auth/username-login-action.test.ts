import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createServerSupabaseClient, loginWithUsername, rpc, updateUserById, signInWithPassword } = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(async () => ({ auth: { signInWithPassword } })),
  loginWithUsername: vi.fn(),
  rpc: vi.fn(),
  updateUserById: vi.fn(),
  signInWithPassword: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); },
}));
vi.mock('@/features/auth/services/login-with-username', () => ({ loginWithUsername }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: () => ({ rpc, auth: { admin: { updateUserById } } }) }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient }));

import { loginWithUsernameAction } from '@/features/auth/actions/login-with-username';

function form(username = 'home_owner', password = 'password123', remember = true) {
  const data = new FormData();
  data.set('username', username);
  data.set('password', password);
  if (remember) data.set('remember', 'on');
  return data;
}

describe('loginWithUsernameAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PASSWORD_LOGIN_ENABLED = 'true';
    process.env.AUTH_RATE_LIMIT_HMAC_SECRET = 'test-rate-limit-secret-at-least-32';
    rpc.mockResolvedValue({ data: true, error: null });
  });

  it('moves to a sanitized internal next path after success', async () => {
    loginWithUsername.mockImplementation(async (repository) => {
      expect(await repository.allowAttempt('home_owner')).toBe(true);
      return { ok: true };
    });
    await expect(loginWithUsernameAction(form(), '//evil.example')).rejects.toThrow('REDIRECT:/home');
    expect(rpc).toHaveBeenCalledWith('consume_auth_rate_limit', expect.objectContaining({ p_scope: 'username_login', p_limit: 8 }));
  });

  it('accepts email and phone shaped identifiers before the service', async () => {
    loginWithUsername.mockResolvedValue({ ok: false, error: 'invalid_credentials' });
    await expect(loginWithUsernameAction(form('owner@example.com'))).rejects.toThrow('REDIRECT:/login?error=invalid_credentials');
    await expect(loginWithUsernameAction(form('010-1234-5678'))).rejects.toThrow('REDIRECT:/login?error=invalid_credentials');
    expect(loginWithUsername).toHaveBeenCalledTimes(2);
  });

  it('keeps the previous persistent session when no remember option is sent', async () => {
    loginWithUsername.mockResolvedValue({ ok: false, error: 'invalid_credentials' });
    await expect(loginWithUsernameAction(form('home_owner', 'password123', false))).rejects.toThrow('REDIRECT:/login?error=invalid_credentials');
    expect(createServerSupabaseClient).toHaveBeenCalledWith({ sessionOnly: false });
  });

  it('uses a session cookie only when remember is explicitly off', async () => {
    loginWithUsername.mockResolvedValue({ ok: false, error: 'invalid_credentials' });
    const data = form('home_owner', 'password123', false);
    data.set('remember', 'off');
    await expect(loginWithUsernameAction(data)).rejects.toThrow('REDIRECT:/login?error=invalid_credentials');
    expect(createServerSupabaseClient).toHaveBeenCalledWith({ sessionOnly: true });
  });

  it('uses one generic error for invalid credentials', async () => {
    loginWithUsername.mockResolvedValue({ ok: false, error: 'invalid_credentials' });
    await expect(loginWithUsernameAction(form())).rejects.toThrow('REDIRECT:/login?error=invalid_credentials');
  });

  it('rejects invalid input before the service', async () => {
    await expect(loginWithUsernameAction(form('bad id', 'short'))).rejects.toThrow('REDIRECT:/login?error=invalid_credentials');
    expect(loginWithUsername).not.toHaveBeenCalled();
  });

  // TEST-LOGIN-EMAIL-005: Auth가 이메일 미확인을 알리면 그 이유를 서비스에 넘기고, 확인 처리는 관리자 API로 한다.
  it('maps Auth email_not_confirmed and confirms through the admin API', async () => {
    signInWithPassword
      .mockResolvedValueOnce({ data: { user: null }, error: { code: 'email_not_confirmed' } })
      .mockResolvedValueOnce({ data: { user: null }, error: { code: 'invalid_credentials' } })
      .mockResolvedValueOnce({ data: { user: { id: 'user-1' } }, error: null });
    updateUserById.mockResolvedValue({ error: null });
    loginWithUsername.mockImplementation(async (repository) => {
      expect(await repository.signInWithPassword('a@example.com', 'password123')).toEqual({ accepted: false, userId: null, reason: 'email_not_confirmed' });
      expect(await repository.signInWithPassword('a@example.com', 'password123')).toEqual({ accepted: false, userId: null, reason: 'invalid_credentials' });
      expect(await repository.signInWithPassword('a@example.com', 'password123')).toEqual({ accepted: true, userId: 'user-1' });
      expect(await repository.confirmEmail('user-1')).toBe(true);
      return { ok: true };
    });
    await expect(loginWithUsernameAction(form())).rejects.toThrow('REDIRECT:/home');
    expect(updateUserById).toHaveBeenCalledWith('user-1', { email_confirm: true });
  });
});
