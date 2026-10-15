import { createHmac } from 'node:crypto';

export function createRateLimitKey(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('hex');
}

/**
 * 서버 전용 비밀값을 돌려준다.
 * 전용 환경변수가 있으면 그것을 쓰고, 없으면 이미 설정된 서버 전용 Supabase 키에서
 * 용도별로 분리된 값을 파생한다. 파생값은 원래 키를 되돌려 알아낼 수 없다.
 */
export function getServerSecret(purpose: string, explicitName: string): string {
  const explicit = process.env[explicitName];
  if (explicit && explicit.length >= 32) return explicit;

  const base = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (base && base.length >= 32) {
    return createHmac('sha256', base).update(`zipsin:${purpose}:v1`).digest('hex');
  }
  throw new Error(`${explicitName} must be at least 32 characters`);
}

export function getRateLimitSecret(): string {
  return getServerSecret('auth-rate-limit', 'AUTH_RATE_LIMIT_HMAC_SECRET');
}

export function getPhoneOtpSecret(): string {
  return getServerSecret('phone-otp', 'PHONE_OTP_HMAC_SECRET');
}
