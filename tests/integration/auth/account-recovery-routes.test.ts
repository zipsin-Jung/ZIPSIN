import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(), from: vi.fn(), sendOtp: vi.fn(), reserve: vi.fn(),
  profilesRows: [] as Array<Record<string, unknown>>,
  usernameRows: [] as Array<Record<string, unknown>>,
  profilesError: null as unknown,
}));

function chain(result: () => { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'in', 'not']) builder[method] = () => builder;
  builder.limit = async () => result();
  builder.maybeSingle = async () => { const value = result(); return { data: Array.isArray(value.data) ? value.data[0] ?? null : value.data, error: value.error }; };
  builder.then = (resolve: (value: unknown) => unknown) => resolve(result());
  return builder;
}

vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-vercel-forwarded-for': '203.0.113.7' }) }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: () => ({
    rpc: mocks.rpc,
    from: (table: string) => table === 'profiles'
      ? chain(() => ({ data: mocks.profilesRows, error: mocks.profilesError }))
      : chain(() => ({ data: mocks.usernameRows, error: null })),
  }),
}));
vi.mock('@/features/auth/phone/otp-digest', () => ({ createOtpDigest: () => 'digest' }));
vi.mock('@/features/auth/phone/runtime-provider', () => ({
  getPhoneOtpSecret: () => 'secret',
  getSolapiSmsTransport: () => ({ sendOtp: mocks.sendOtp }),
}));
vi.mock('@/features/auth/server/sms-rate-limit', () => ({ reserveSmsSend: mocks.reserve }));

import { POST as findUsername } from '@/app/api/auth/recovery/username/route';
import { POST as sendRecoveryCode } from '@/app/api/auth/recovery/phone/send/route';

function request(path: string, body: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.AUTH_RATE_LIMIT_HMAC_SECRET = 'test-rate-limit-secret-at-least-32';
  mocks.rpc.mockResolvedValue({ data: true, error: null });
  mocks.reserve.mockResolvedValue(true);
  mocks.sendOtp.mockResolvedValue({ providerMessageId: 'msg-1' });
  mocks.profilesRows = [{ user_id: 'user-1', display_name: '정민선', email: 'na@example.com' }];
  mocks.usernameRows = [{ username_normalized: 'zipsin_agent', created_at: '2026-10-16T01:00:00Z' }];
  mocks.profilesError = null;
});

describe('POST /api/auth/recovery/username', () => {
  it('TEST-FIND-API-001: 가린 아이디만 돌려주고 캐시하지 않는다', async () => {
    const response = await findUsername(request('/api/auth/recovery/username', { email: 'na@example.com' }));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = await response.json();
    expect(body).toEqual({ status: 'found', accounts: [{ maskedUsername: 'zip***nt', createdAt: '2026-10-16T01:00:00Z' }] });
    expect(JSON.stringify(body)).not.toContain('zipsin_agent');
    expect(mocks.rpc).toHaveBeenCalledWith('consume_auth_rate_limit', expect.objectContaining({ p_scope: 'username_lookup_origin', p_limit: 20 }));
    expect(mocks.rpc).toHaveBeenCalledWith('consume_auth_rate_limit', expect.objectContaining({ p_scope: 'username_lookup_email', p_limit: 5 }));
  });

  it('TEST-FIND-API-002: 없는 이메일·잘못된 형식·제한을 구분한다', async () => {
    mocks.profilesRows = [];
    await expect((await findUsername(request('/x', { email: 'none@example.com' }))).json()).resolves.toEqual({ status: 'not_found' });
    expect((await findUsername(request('/x', { email: 'bad' }))).status).toBe(400);
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    expect((await findUsername(request('/x', { email: 'na@example.com' }))).status).toBe(429);
  });

  it('TEST-FIND-API-003: 저장소 오류는 503으로 닫는다', async () => {
    mocks.profilesError = new Error('db down');
    expect((await findUsername(request('/x', { email: 'na@example.com' }))).status).toBe(503);
  });
});

describe('POST /api/auth/recovery/phone/send (이메일 + 이름 + 휴대폰)', () => {
  it('TEST-PWRESET-API-001: 이메일·이름·번호가 맞으면 문자를 보낸다', async () => {
    const response = await sendRecoveryCode(request('/x', { email: 'na@example.com', name: '정민선', phone: '010-1234-5678' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, maskedPhone: '010-****-5678' });
    expect(mocks.sendOtp).toHaveBeenCalledWith(expect.objectContaining({ to: '+821012345678' }));
    expect(mocks.rpc).toHaveBeenCalledWith('issue_account_recovery_challenge', expect.objectContaining({ p_user_id: 'user-1' }));
  });

  it('TEST-PWRESET-API-002: 이름이 다르면 문자를 보내지 않고 404', async () => {
    const response = await sendRecoveryCode(request('/x', { email: 'na@example.com', name: '김다름', phone: '010-1234-5678' }));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false, error: 'not_found' });
    expect(mocks.sendOtp).not.toHaveBeenCalled();
    const wrongId = await sendRecoveryCode(request('/x', { email: 'other@example.com', name: '정민선', phone: '010-1234-5678' }));
    expect(wrongId.status).toBe(404);
    expect(mocks.sendOtp).not.toHaveBeenCalled();
  });

  it('TEST-PWRESET-API-003: 발송 제한에 걸리면 429', async () => {
    mocks.reserve.mockResolvedValue(false);
    expect((await sendRecoveryCode(request('/x', { name: '정민선', phone: '010-1234-5678' }))).status).toBe(429);
  });

  it('TEST-PWRESET-API-004: 잘못된 번호는 503으로 닫는다', async () => {
    expect((await sendRecoveryCode(request('/x', { name: '정민선', phone: '12' }))).status).toBe(503);
  });
});
