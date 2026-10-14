import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getIntent: vi.fn(), getOrCreateIntent: vi.fn(), rpc: vi.fn(), eq: vi.fn(), update: vi.fn(),
  sendOtp: vi.fn(), reserve: vi.fn(),
}));

vi.mock('@/features/auth/server/signup-intent', () => ({
  getSignupIntent: mocks.getIntent,
  getOrCreateSignupIntent: mocks.getOrCreateIntent,
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: () => ({ rpc: mocks.rpc, from: () => ({ update: mocks.update }) }),
}));
vi.mock('@/features/auth/phone/otp-digest', () => ({ createOtpDigest: () => 'digest' }));
vi.mock('@/features/auth/phone/runtime-provider', () => ({
  getPhoneOtpSecret: () => 'secret',
  getSolapiSmsTransport: () => ({ sendOtp: mocks.sendOtp }),
}));
vi.mock('@/features/auth/server/sms-rate-limit', () => ({ reserveSmsSend: mocks.reserve }));

import { POST as sendPost } from '@/app/api/auth/signup/phone/send/route';
import { POST as verifyPost } from '@/app/api/auth/signup/phone/verify/route';

function request(path: string, body: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}

describe('anonymous signup phone route handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOrCreateIntent.mockResolvedValue({ digest: 'intent' });
    mocks.getIntent.mockResolvedValue({ digest: 'intent' });
    mocks.reserve.mockResolvedValue(true);
    mocks.sendOtp.mockResolvedValue({ providerMessageId: 'provider-1' });
    mocks.eq.mockResolvedValue({ error: null });
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.rpc.mockImplementation((name: string) => Promise.resolve({
      data: name === 'verify_anonymous_signup_phone_challenge' ? 'verified' : null,
      error: null,
    }));
  });

  it('returns a challenge on send success without caching', async () => {
    const response = await sendPost(request('/api/auth/signup/phone/send', { phone: '01012345678' }));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(mocks.rpc).toHaveBeenCalledWith('issue_anonymous_signup_phone_challenge', expect.any(Object));
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ delivery_status: 'sent' }));
  });

  it('maps rate limits and provider failures without exposing details', async () => {
    mocks.reserve.mockResolvedValueOnce(false);
    expect((await sendPost(request('/api/auth/signup/phone/send', { phone: '01012345678' }))).status).toBe(429);
    mocks.sendOtp.mockRejectedValueOnce(new Error('private provider failure'));
    expect((await sendPost(request('/api/auth/signup/phone/send', { phone: '01012345678' }))).status).toBe(503);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ delivery_status: 'failed' }));
  });

  it('returns a safe error for malformed send requests or repository failures', async () => {
    const malformed = await sendPost(new NextRequest('http://localhost/api/auth/signup/phone/send', { method: 'POST', body: '{' }));
    expect(malformed.status).toBe(400);
    mocks.rpc.mockRejectedValueOnce(new Error('private database failure'));
    const unavailable = await sendPost(request('/api/auth/signup/phone/send', { phone: '01012345678' }));
    expect(unavailable.status).toBe(503);
    await expect(unavailable.json()).resolves.toMatchObject({ error: 'temporarily_unavailable' });
  });

  it('rejects verify when the browser intent is missing', async () => {
    mocks.getIntent.mockResolvedValue(null);
    const response = await verifyPost(request('/api/auth/signup/phone/verify', { challengeId: 'id', code: '123456' }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: 'not_found' });
  });

  it('returns verified and rejected OTP results', async () => {
    expect((await verifyPost(request('/api/auth/signup/phone/verify', { challengeId: 'id', code: '123456' }))).status).toBe(200);
    mocks.rpc.mockResolvedValueOnce({ data: 'invalid_code', error: null });
    expect((await verifyPost(request('/api/auth/signup/phone/verify', { challengeId: 'id', code: '000000' }))).status).toBe(400);
  });

  it('returns a temporary error when verify infrastructure fails', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: new Error('private failure') });
    const response = await verifyPost(request('/api/auth/signup/phone/verify', { challengeId: 'id', code: '123456' }));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ error: 'temporarily_unavailable' });
  });
});
