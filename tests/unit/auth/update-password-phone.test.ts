import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), updateUserById: vi.fn(), deleteCookie: vi.fn(), getUser: vi.fn() }));

vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => ({ value: 'recovery-token' }), delete: mocks.deleteCookie }) }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: async () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: () => ({ rpc: mocks.rpc, auth: { admin: { updateUserById: mocks.updateUserById } } }) }));

import { updatePasswordAction } from '@/features/auth/actions/update-password';
import { digestRecoveryToken } from '@/features/auth/server/recovery-session';

function passwordForm(password = 'new-pass-2026!', confirmation = password) {
  const form = new FormData(); form.set('password', password); form.set('passwordConfirm', confirmation); return form;
}

describe('updatePasswordAction — 휴대폰 인증 뒤 새 비밀번호 (시안 ⑨-B·C)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    mocks.rpc.mockResolvedValue({ data: 'user-1', error: null });
    mocks.updateUserById.mockResolvedValue({ error: null });
  });

  it('TEST-NEWPW-ACT-001: 인증 세션을 한 번만 쓰고 비밀번호를 바꾼 뒤 완료 화면으로 간다', async () => {
    await expect(updatePasswordAction(passwordForm())).rejects.toThrow('REDIRECT:/reset-password/done');
    expect(mocks.rpc).toHaveBeenCalledWith('consume_account_recovery_session', { p_token_digest: digestRecoveryToken('recovery-token') });
    expect(mocks.updateUserById).toHaveBeenCalledWith('user-1', { password: 'new-pass-2026!' });
    expect(mocks.deleteCookie).toHaveBeenCalled();
  });

  it('TEST-NEWPW-ACT-002: 만료·이미 쓴 인증이면 비밀번호를 바꾸지 않는다', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    await expect(updatePasswordAction(passwordForm())).rejects.toThrow('REDIRECT:/login?error=recovery_expired');
    expect(mocks.updateUserById).not.toHaveBeenCalled();
  });

  it('TEST-NEWPW-ACT-003: 변경 실패를 알린다', async () => {
    mocks.updateUserById.mockResolvedValue({ error: new Error('x') });
    await expect(updatePasswordAction(passwordForm())).rejects.toThrow('REDIRECT:/reset-password?error=update_failed');
  });
});
