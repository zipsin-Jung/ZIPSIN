import { headers } from 'next/headers';
import { createRateLimitKey, getRateLimitSecret } from '@/features/auth/domain/rate-limit-key';

export type SmsRateLimitAdmin = { rpc: (...args: never[]) => PromiseLike<{ data: unknown; error: unknown }> };

export async function reserveSmsSend(admin: SmsRateLimitAdmin, phoneE164: string, userId?: string) {
  const requestHeaders = await headers();
  const origin = requestHeaders.get('x-vercel-forwarded-for')
    ?? requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown-origin';
  const secret = getRateLimitSecret();
  const limits = [
    { scope: 'sms_phone', key: phoneE164, interval: 60, hour: 5, day: 10 },
    { scope: 'sms_origin', key: origin, interval: 10, hour: 20, day: 50 },
    ...(userId ? [{ scope: 'sms_user', key: userId, interval: 60, hour: 5, day: 10 }] : []),
  ];
  for (const limit of limits) {
    const { data, error } = await admin.rpc('reserve_auth_sms_send' as never, {
      p_scope: limit.scope,
      p_key_digest: createRateLimitKey(limit.key, secret),
      p_min_interval_seconds: limit.interval,
      p_hour_limit: limit.hour,
      p_day_limit: limit.day,
    } as never);
    if (error) throw new Error('rate_limit_unavailable');
    if (data !== true) return false;
  }
  return true;
}
