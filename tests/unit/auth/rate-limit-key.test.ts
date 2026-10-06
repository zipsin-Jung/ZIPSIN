import { describe, expect, it } from 'vitest';
import { createRateLimitKey } from '@/features/auth/domain/rate-limit-key';

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
