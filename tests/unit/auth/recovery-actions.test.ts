import { beforeEach, describe, expect, it, vi } from 'vitest';

const { resetPasswordForEmail, getUser, updateUser, signOut, rpc } = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: async () => ({ auth: { resetPasswordForEmail, getUser, updateUser, signOut } }),
}));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: () => ({ rpc }) }));

import { requestAccountRecoveryAction } from '@/features/auth/actions/request-account-recovery';
import { updatePasswordAction } from '@/features/auth/actions/update-password';

function emailForm(value: string) { const form = new FormData(); form.set('email', value); return form; }
function passwordForm(password = 'new-password-2026', confirmation = password) {
  const form = new FormData(); form.set('password', password); form.set('passwordConfirm', confirmation); return form;
}

describe('account recovery actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPasswordForEmail.mockResolvedValue({ error: null });
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    updateUser.mockResolvedValue({ error: null });
    signOut.mockResolvedValue({});
    rpc.mockResolvedValue({ data: true, error: null });
    process.env.AUTH_RATE_LIMIT_HMAC_SECRET = 'test-rate-limit-secret-at-least-32';
  });

  it('rejects an invalid recovery email', async () => {
    await expect(requestAccountRecoveryAction(emailForm('bad'))).rejects.toThrow('REDIRECT:/account-recovery?error=invalid_email');
  });

  it('always returns the generic sent page after a recovery request', async () => {
    await expect(requestAccountRecoveryAction(emailForm('USER@example.com'))).rejects.toThrow('REDIRECT:/account-recovery?notice=sent');
    expect(resetPasswordForEmail).toHaveBeenCalledWith('user@example.com', expect.objectContaining({ redirectTo: expect.stringContaining('/auth/callback') }));
    expect(rpc).toHaveBeenCalledWith('consume_auth_rate_limit', expect.objectContaining({ p_scope: 'account_recovery', p_limit: 3 }));
  });

  it('updates a valid recovery session then signs it out', async () => {
    await expect(updatePasswordAction(passwordForm())).rejects.toThrow('REDIRECT:/login?notice=password_updated');
    expect(updateUser).toHaveBeenCalledWith({ password: 'new-password-2026' });
    expect(signOut).toHaveBeenCalled();
  });

  it('회원가입과 같은 소문자·숫자·특수문자 규칙을 적용한다', async () => {
    await expect(updatePasswordAction(passwordForm('onlyletters', 'onlyletters'))).rejects.toThrow('REDIRECT:/reset-password?error=invalid_password');
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('rejects mismatch and expired sessions', async () => {
    await expect(updatePasswordAction(passwordForm('new-password-2026', 'different-password'))).rejects.toThrow('REDIRECT:/reset-password?error=invalid_password');
    getUser.mockResolvedValue({ data: { user: null } });
    await expect(updatePasswordAction(passwordForm())).rejects.toThrow('REDIRECT:/login?error=recovery_expired');
  });

  it('reports an update failure without signing out', async () => {
    updateUser.mockResolvedValue({ error: new Error('failed') });
    await expect(updatePasswordAction(passwordForm())).rejects.toThrow('REDIRECT:/reset-password?error=update_failed');
  });
});
