import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
vi.mock('@/features/auth/server/session', () => ({ requireUser: vi.fn(async () => ({ id: 'user-1' })) }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: vi.fn(async () => ({ rpc })) }));

import { saveOnboarding } from '@/features/account/server/save-onboarding';

describe('집신체크 온보딩 저장', () => {
  beforeEach(() => rpc.mockReset());

  it('직접 profiles 쓰기 대신 인증 전용 원자 RPC를 사용한다', async () => {
    rpc.mockResolvedValue({ error: null });
    await expect(saveOnboarding({ userType: 'tenant', transferConsent: true, marketingConsent: false })).resolves.toEqual({ ok: true, marketingConsent: false });
    expect(rpc).toHaveBeenCalledWith('complete_check_onboarding', { p_user_type: 'tenant' });
  });

  it('RPC가 거부되면 저장 성공으로 표시하지 않는다', async () => {
    rpc.mockResolvedValue({ error: new Error('denied') });
    await expect(saveOnboarding({ userType: 'house_hunter', transferConsent: true, marketingConsent: true })).rejects.toThrow('PROFILE_SAVE_FAILED');
  });
});
