import { beforeEach, describe, expect, it, vi } from 'vitest';

const { signUp, insert, deleteUser } = vi.hoisted(() => ({
  signUp: vi.fn(), insert: vi.fn(), deleteUser: vi.fn(),
}));

vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: async () => ({ auth: { signUp } }) }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: () => ({ from: () => ({ insert }), auth: { admin: { deleteUser } } }),
}));

import { registerPasswordAccountAction } from '@/features/auth/actions/register-password-account';

function form(overrides: Record<string, string> = {}) {
  const values = { username: 'home_owner', password: 'password-2026', passwordConfirm: 'password-2026', email: 'owner@example.com', termsAccepted: 'on', privacyAccepted: 'on', ageOver14: 'on', ...overrides };
  const data = new FormData(); Object.entries(values).forEach(([key, value]) => data.set(key, value)); return data;
}

describe('registerPasswordAccountAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signUp.mockResolvedValue({ data: { user: { id: 'user-1' }, session: null }, error: null });
    insert.mockResolvedValue({ error: null });
    deleteUser.mockResolvedValue({});
  });

  it('rejects invalid signup input before creating an Auth user', async () => {
    await expect(registerPasswordAccountAction(form({ username: 'bad id' }))).rejects.toThrow('REDIRECT:/signup?error=invalid_input');
    expect(signUp).not.toHaveBeenCalled();
  });

  it('creates an account and asks the user to confirm email', async () => {
    await expect(registerPasswordAccountAction(form())).rejects.toThrow('REDIRECT:/signup?notice=check_email');
    expect(signUp).toHaveBeenCalledWith(expect.objectContaining({ email: 'owner@example.com', password: 'password-2026' }));
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ username_normalized: 'home_owner', status: 'pending' }));
  });

  it('moves directly to verification when Supabase returns a session', async () => {
    signUp.mockResolvedValue({ data: { user: { id: 'user-1' }, session: { access_token: 'masked' } }, error: null });
    await expect(registerPasswordAccountAction(form())).rejects.toThrow('REDIRECT:/signup/verify');
  });

  it('uses a generic unavailable error and compensates a failed reservation', async () => {
    insert.mockResolvedValue({ error: new Error('duplicate') });
    await expect(registerPasswordAccountAction(form())).rejects.toThrow('REDIRECT:/signup?error=account_unavailable');
    expect(deleteUser).toHaveBeenCalledWith('user-1');
  });
});
