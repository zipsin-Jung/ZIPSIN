import { beforeEach, describe, expect, it, vi } from 'vitest';

const { signUp, insert, cleanupInsert, deleteUser, rpc, headers } = vi.hoisted(() => ({
  signUp: vi.fn(), insert: vi.fn(), cleanupInsert: vi.fn(), deleteUser: vi.fn(), rpc: vi.fn(), headers: vi.fn(),
}));

vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock('next/headers', () => ({ headers }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: async () => ({ auth: { signUp } }) }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: () => ({
    from: (table: string) => ({ insert: table === 'auth_cleanup_queue' ? cleanupInsert : insert }),
    auth: { admin: { deleteUser } },
    rpc,
  }),
}));

import { registerPasswordAccountAction } from '@/features/auth/actions/register-password-account';

function form(overrides: Record<string, string> = {}) {
  const values = { username: 'home_owner', password: 'password-2026', passwordConfirm: 'password-2026', email: 'owner@example.com', termsAccepted: 'on', privacyAccepted: 'on', ageOver14: 'on', ...overrides };
  const data = new FormData(); Object.entries(values).forEach(([key, value]) => data.set(key, value)); return data;
}

describe('registerPasswordAccountAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signUp.mockResolvedValue({ data: { user: { id: 'user-1', identities: [{ id: 'identity-1' }] }, session: null }, error: null });
    insert.mockResolvedValue({ error: null });
    deleteUser.mockResolvedValue({});
    cleanupInsert.mockResolvedValue({ error: null });
    rpc.mockResolvedValue({ data: true, error: null });
    headers.mockResolvedValue(new Headers({ 'x-vercel-forwarded-for': '203.0.113.8' }));
    process.env.AUTH_RATE_LIMIT_HMAC_SECRET = 'test-rate-limit-secret-at-least-32';
  });

  it('rejects invalid signup input before creating an Auth user', async () => {
    await expect(registerPasswordAccountAction(form({ username: 'bad id' }))).rejects.toThrow('REDIRECT:/signup?error=invalid_input');
    expect(signUp).not.toHaveBeenCalled();
  });

  it('creates an account and asks the user to confirm email', async () => {
    await expect(registerPasswordAccountAction(form())).rejects.toThrow('REDIRECT:/signup?notice=check_email');
    expect(signUp).toHaveBeenCalledWith(expect.objectContaining({ email: 'owner@example.com', password: 'password-2026' }));
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ username_normalized: 'home_owner', status: 'pending' }));
    expect(rpc).toHaveBeenCalledTimes(3);
    expect(rpc).toHaveBeenCalledWith('consume_auth_rate_limit', expect.objectContaining({ p_scope: 'password_signup_origin' }));
    expect(JSON.stringify(rpc.mock.calls)).not.toContain('owner@example.com');
    expect(JSON.stringify(rpc.mock.calls)).not.toContain('203.0.113.8');
  });

  it('moves directly to verification when Supabase returns a session', async () => {
    signUp.mockResolvedValue({ data: { user: { id: 'user-1', identities: [{ id: 'identity-1' }] }, session: { access_token: 'masked' } }, error: null });
    await expect(registerPasswordAccountAction(form())).rejects.toThrow('REDIRECT:/signup/verify');
  });

  it('uses a generic unavailable error and compensates a failed reservation', async () => {
    insert.mockResolvedValue({ error: new Error('duplicate') });
    await expect(registerPasswordAccountAction(form())).rejects.toThrow('REDIRECT:/signup?error=account_unavailable');
    expect(deleteUser).toHaveBeenCalledWith('user-1');
  });

  it('does not reserve or delete an obfuscated existing Supabase user', async () => {
    signUp.mockResolvedValue({ data: { user: { id: 'obfuscated-id', identities: [] }, session: null }, error: null });

    await expect(registerPasswordAccountAction(form())).rejects.toThrow('REDIRECT:/signup?error=account_unavailable');
    expect(insert).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('blocks signup before creating an Auth user when any durable limit is exceeded', async () => {
    rpc.mockResolvedValueOnce({ data: false, error: null });
    await expect(registerPasswordAccountAction(form())).rejects.toThrow('REDIRECT:/signup?error=service_unavailable');
    expect(signUp).not.toHaveBeenCalled();
  });

  it('emits a structured server alert when compensation and durable queueing both fail', async () => {
    const alert = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    insert.mockResolvedValue({ error: new Error('duplicate') });
    deleteUser.mockResolvedValue({ error: new Error('delete failed') });
    cleanupInsert.mockResolvedValue({ error: new Error('queue failed') });

    await expect(registerPasswordAccountAction(form())).rejects.toThrow('REDIRECT:/signup?error=service_unavailable');
    expect(alert).toHaveBeenCalledWith('auth_cleanup_queue_insert_failed', { userId: 'user-1' });
    expect(alert.mock.calls.flat().join(' ')).not.toContain('queue failed');
    alert.mockRestore();
  });
});
