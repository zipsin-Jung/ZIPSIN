import 'server-only';
import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { createRateLimitKey, getRateLimitSecret } from '@/features/auth/domain/rate-limit-key';

export const SIGNUP_INTENT_COOKIE = 'zipsin_signup_intent';
const SIGNUP_INTENT_MAX_AGE = 10 * 60;

export function digestSignupIntent(token: string) {
  return createRateLimitKey(`signup-intent:${token}`, getRateLimitSecret());
}

export async function getSignupIntent(): Promise<{ raw: string; digest: string } | null> {
  const value = (await cookies()).get(SIGNUP_INTENT_COOKIE)?.value;
  return value ? { raw: value, digest: digestSignupIntent(value) } : null;
}

export async function getOrCreateSignupIntent(): Promise<{ raw: string; digest: string }> {
  const current = await getSignupIntent();
  if (current) return current;
  const raw = randomBytes(32).toString('base64url');
  (await cookies()).set(SIGNUP_INTENT_COOKIE, raw, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SIGNUP_INTENT_MAX_AGE,
  });
  return { raw, digest: digestSignupIntent(raw) };
}

export async function clearSignupIntent() {
  (await cookies()).delete(SIGNUP_INTENT_COOKIE);
}
