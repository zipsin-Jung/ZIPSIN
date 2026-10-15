import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createRateLimitKey,
  getPhoneOtpSecret,
  getRateLimitSecret,
  getServerSecret,
} from '@/features/auth/domain/rate-limit-key';

afterEach(() => vi.unstubAllEnvs());

describe('createRateLimitKey', () => {
  it('creates a stable keyed digest without retaining the source value', () => {
    const source = 'owner@example.com';
    const secret = 'test-rate-limit-secret-at-least-32';
    const first = createRateLimitKey(source, secret);

    expect(first).toBe(createRateLimitKey(source, secret));
    expect(first).not.toContain(source);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toBe(createRateLimitKey(source, `${secret}-different`));
  });
});

describe('SECRET-001 서버 비밀값', () => {
  const serviceKey = 'service-role-key-for-tests-only-0123456789';

  it('TEST-SECRET-001 전용 환경변수가 있으면 그대로 쓴다', () => {
    vi.stubEnv('AUTH_RATE_LIMIT_HMAC_SECRET', 'explicit-rate-limit-secret-0123456789');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', serviceKey);
    expect(getRateLimitSecret()).toBe('explicit-rate-limit-secret-0123456789');
  });

  it('TEST-SECRET-002 전용 값이 없으면 서버 키에서 용도별로 다른 값을 파생한다', () => {
    vi.stubEnv('AUTH_RATE_LIMIT_HMAC_SECRET', '');
    vi.stubEnv('PHONE_OTP_HMAC_SECRET', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', serviceKey);

    const rate = getRateLimitSecret();
    const otp = getPhoneOtpSecret();
    expect(rate).toMatch(/^[a-f0-9]{64}$/);
    expect(otp).toMatch(/^[a-f0-9]{64}$/);
    expect(rate).not.toBe(otp);
    expect(rate).not.toContain(serviceKey);
    expect(getRateLimitSecret()).toBe(rate);
  });

  it('TEST-SECRET-003 너무 짧은 값과 서버 키 부재는 오류로 막는다', () => {
    vi.stubEnv('AUTH_RATE_LIMIT_HMAC_SECRET', 'short');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    expect(() => getServerSecret('auth-rate-limit', 'AUTH_RATE_LIMIT_HMAC_SECRET')).toThrow('at least 32');
  });
});
