import { createHmac, timingSafeEqual } from 'node:crypto';

export function createOtpDigest(code: string, challengeId: string, secret: string): string {
  return createHmac('sha256', secret).update(`${challengeId}:${code}`).digest('hex');
}

export function verifyOtpDigest(code: string, challengeId: string, digest: string, secret: string): boolean {
  const candidate = createOtpDigest(code, challengeId, secret);
  if (candidate.length !== digest.length) return false;
  return timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(digest, 'hex'));
}
