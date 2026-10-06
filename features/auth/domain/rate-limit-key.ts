import { createHmac } from 'node:crypto';

export function createRateLimitKey(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('hex');
}

export function getRateLimitSecret(): string {
  const secret = process.env.AUTH_RATE_LIMIT_HMAC_SECRET;
  if (!secret || secret.length < 32) throw new Error('AUTH_RATE_LIMIT_HMAC_SECRET must be at least 32 characters');
  return secret;
}
