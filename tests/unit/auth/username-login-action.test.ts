import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createServerSupabaseClient, loginWithUsername, rpc } = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(async () => ({})),
  loginWithUsername: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); },
}));
vi.mock('@/features/auth/services/login-with-username', () => ({ loginWithUsername }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: () => ({ rpc }) }));
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
});
