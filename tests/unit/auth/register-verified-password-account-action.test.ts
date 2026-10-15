import { beforeEach, describe, expect, it, vi } from 'vitest';

const { signUp, deleteUser, rpc, insert, headers, getSignupIntent, clearSignupIntent, createAdmin } = vi.hoisted(() => ({
  signUp: vi.fn(), deleteUser: vi.fn(), rpc: vi.fn(), insert: vi.fn(), headers: vi.fn(),
  getSignupIntent: vi.fn(), clearSignupIntent: vi.fn(), createAdmin: vi.fn(),
}));

vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock('next/headers', () => ({ headers }));
vi.mock('@/features/auth/server/signup-intent', () => ({ getSignupIntent, clearSignupIntent }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: async () => ({ auth: { signUp } }) }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: createAdmin,
}));

import { registerVerifiedPasswordAccountAction } from '@/features/auth/actions/register-verified-password-account';

function form(overrides: Record<string, string> = {}) {
  const values = {
    username: 'home_owner', password: 'password-2026', passwordConfirm: 'password-2026',
    email: 'owner@example.com', challengeId: '11111111-1111-4111-8111-111111111111',
    termsAccepted: 'on', privacyAccepted: 'on', ...overrides,
  };
  const data = new FormData(); Object.entries(values).forEach(([key, value]) => data.set(key, value)); return data;
}

describe('registerVerifiedPasswordAccountAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_RATE_LIMIT_HMAC_SECRET = 'test-rate-limit-secret-at-least-32';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://preview.example.com';
    getSignupIntent.mockResolvedValue({ raw: 'intent-token', digest: 'intent-digest' });
    headers.mockResolvedValue(new Headers({ 'x-vercel-forwarded-for': '203.0.113.8' }));
    rpc.mockImplementation((name: string) => Promise.resolve({ data: name === 'claim_anonymous_signup_phone_challenge' ? '+821012345678' : true, error: null }));
    signUp.mockResolvedValue({ data: { user: { id: 'user-1', identities: [{ id: 'identity-1' }] }, session: null }, error: null });
    deleteUser.mockResolvedValue({ error: null });
    insert.mockResolvedValue({ error: null });
    createAdmin.mockReturnValue({ rpc, from: () => ({ insert }), auth: { admin: { deleteUser } } });
  });

  it('rejects invalid form input before claiming a phone proof', async () => {
    await expect(registerVerifiedPasswordAccountAction({}, form({ username: 'bad id' }))).resolves.toMatchObject({ field: 'signup-username' });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('rejects a missing browser intent before creating an Auth user', async () => {
    getSignupIntent.mockResolvedValue(null);
    await expect(registerVerifiedPasswordAccountAction({}, form())).resolves.toMatchObject({ field: 'signup-phone' });
    expect(signUp).not.toHaveBeenCalled();
  });

  it('finalizes the verified account and shows the email confirmation state', async () => {
    await expect(registerVerifiedPasswordAccountAction({}, form())).rejects.toThrow('REDIRECT:/signup?notice=check_email');
    expect(signUp).toHaveBeenCalledWith(expect.objectContaining({ email: 'owner@example.com', password: 'password-2026' }));
    expect(rpc).toHaveBeenCalledWith('finalize_verified_password_signup', expect.objectContaining({ p_user_id: 'user-1', p_username: 'home_owner' }));
    expect(clearSignupIntent).toHaveBeenCalled();
  });

  it('returns a signed-in check user to the safe /ck path', async () => {
    signUp.mockResolvedValue({ data: { user: { id: 'user-1', identities: [{ id: 'identity-1' }] }, session: { access_token: 'masked' } }, error: null });
    await expect(registerVerifiedPasswordAccountAction({}, form({ next: '/ck' }))).rejects.toThrow('REDIRECT:/ck');
    expect(rpc).toHaveBeenCalledWith('finalize_verified_password_signup', expect.objectContaining({ p_source: 'zipsin_check' }));
  });

  it('returns an inline service error without clearing the form when configuration is missing', async () => {
    createAdmin.mockImplementationOnce(() => { throw new Error('missing env'); });
    await expect(registerVerifiedPasswordAccountAction({}, form())).resolves.toEqual({
      error: '가입 설정을 확인하고 있습니다. 잠시 후 다시 시도해 주세요.',
      field: 'signup-form-error',
    });
  });

  it('returns an inline retry state when the final signup limiter rejects', async () => {
    rpc.mockResolvedValueOnce({ data: false, error: null });
    await expect(registerVerifiedPasswordAccountAction({}, form())).resolves.toMatchObject({ field: 'signup-form-error' });
    expect(signUp).not.toHaveBeenCalled();
  });

  it('points an existing Auth email back to the email input', async () => {
    signUp.mockResolvedValueOnce({ data: { user: { id: 'user-1', identities: [] }, session: null }, error: null });
    await expect(registerVerifiedPasswordAccountAction({}, form())).resolves.toMatchObject({ field: 'signup-email' });
  });

  it('points username and phone finalization conflicts back to their inputs', async () => {
    rpc.mockImplementation((name: string) => Promise.resolve({
      data: name === 'claim_anonymous_signup_phone_challenge' ? '+821012345678' : true,
      error: name === 'finalize_verified_password_signup' ? { code: '23505', message: 'account_usernames conflict' } : null,
    }));
    await expect(registerVerifiedPasswordAccountAction({}, form())).resolves.toMatchObject({ field: 'signup-username' });

    vi.clearAllMocks();
    createAdmin.mockReturnValue({ rpc, from: () => ({ insert }), auth: { admin: { deleteUser } } });
    getSignupIntent.mockResolvedValue({ raw: 'intent-token', digest: 'intent-digest' });
    headers.mockResolvedValue(new Headers({ 'x-forwarded-for': '203.0.113.9, proxy' }));
    signUp.mockResolvedValue({ data: { user: { id: 'user-2', identities: [{ id: 'identity-2' }] }, session: null }, error: null });
    deleteUser.mockResolvedValue({ error: null });
    rpc.mockImplementation((name: string) => Promise.resolve({
      data: name === 'claim_anonymous_signup_phone_challenge' ? '+821012345678' : true,
      error: name === 'finalize_verified_password_signup' ? { message: 'phone_already_registered' } : null,
    }));
    await expect(registerVerifiedPasswordAccountAction({}, form())).resolves.toMatchObject({ field: 'signup-phone' });
  });
});
