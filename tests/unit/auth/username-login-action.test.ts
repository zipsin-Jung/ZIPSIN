import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loginWithUsername, rpc } = vi.hoisted(() => ({ loginWithUsername: vi.fn(), rpc: vi.fn() }));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); },
}));
vi.mock('@/features/auth/services/login-with-username', () => ({ loginWithUsername }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: () => ({ rpc }) }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: async () => ({}) }));

import { loginWithUsernameAction } from '@/features/auth/actions/login-with-username';

function form(username = 'home_owner', password = 'password123') {
  const data = new FormData();
  data.set('username', username);
  data.set('password', password);
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

  it('uses one generic error for invalid credentials', async () => {
    loginWithUsername.mockResolvedValue({ ok: false, error: 'invalid_credentials' });
    await expect(loginWithUsernameAction(form())).rejects.toThrow('REDIRECT:/login?error=invalid_credentials');
  });

  it('rejects invalid input before the service', async () => {
    await expect(loginWithUsernameAction(form('bad id', 'short'))).rejects.toThrow('REDIRECT:/login?error=invalid_credentials');
    expect(loginWithUsername).not.toHaveBeenCalled();
  });
});
