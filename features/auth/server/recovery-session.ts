import { createHash } from 'node:crypto';
export const RECOVERY_COOKIE = 'zipsin_phone_recovery';
export function digestRecoveryToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
