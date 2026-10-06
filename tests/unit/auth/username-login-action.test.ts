import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loginWithUsername } = vi.hoisted(() => ({ loginWithUsername: vi.fn() }));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); },
}));
vi.mock('@/features/auth/services/login-with-username', () => ({ loginWithUsername }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: () => ({}) }));
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
  });

  it('moves to a sanitized internal next path after success', async () => {
    loginWithUsername.mockResolvedValue({ ok: true });
    await expect(loginWithUsernameAction(form(), '//evil.example')).rejects.toThrow('REDIRECT:/home');
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
