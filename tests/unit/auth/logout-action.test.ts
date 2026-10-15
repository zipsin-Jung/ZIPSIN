import { beforeEach, describe, expect, it, vi } from 'vitest';

const { signOut, redirect, deleteCookie } = vi.hoisted(() => ({ signOut: vi.fn(), redirect: vi.fn(), deleteCookie: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => ({ delete: deleteCookie }) }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: async () => ({ auth: { signOut } }) }));
import { logoutAction } from '@/features/auth/actions/logout';

describe('logoutAction', () => {
  beforeEach(() => vi.clearAllMocks());
  it('TEST-ZSD-SESSION-001 ends the session and returns to the public home', async () => {
    signOut.mockResolvedValue({ error: null });
    await logoutAction();
    expect(signOut).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('/');
  });
  it('TEST-ZSD-SESSION-002 keeps the user in account settings when session termination fails', async () => {
    signOut.mockResolvedValue({ error: new Error('failed') });
    await logoutAction();
    expect(redirect).toHaveBeenCalledWith('/my?error=logout_failed');
    expect(redirect).not.toHaveBeenCalledWith('/');
  });
  it('TEST-AUTH-LOGIN-005 clears the browser-session login marker on logout', async () => {
    signOut.mockResolvedValue({ error: null });
    await logoutAction();
    expect(deleteCookie).toHaveBeenCalledWith(expect.objectContaining({ name: 'zipsin-session-only', path: '/' }));
  });
});
