import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const set = vi.fn();
const del = vi.fn();
vi.mock('next/headers', () => ({ cookies: async () => ({ get, set, delete: del }) }));

import {
  clearSignupIntent,
  digestSignupIntent,
  getOrCreateSignupIntent,
  SIGNUP_INTENT_COOKIE,
} from '@/features/auth/server/signup-intent';

describe('signup intent cookie', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_RATE_LIMIT_HMAC_SECRET = 'a'.repeat(32);
  });

  it('creates a short-lived HttpOnly SameSite cookie when missing', async () => {
    get.mockReturnValue(undefined);
    const intent = await getOrCreateSignupIntent();
    expect(intent.raw.length).toBeGreaterThan(30);
    expect(intent.digest).toBe(digestSignupIntent(intent.raw));
    expect(set).toHaveBeenCalledWith(SIGNUP_INTENT_COOKIE, intent.raw, expect.objectContaining({
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
    }));
  });

  it('shares the intent with signup APIs and the final server action', async () => {
    get.mockReturnValue(undefined);
    await getOrCreateSignupIntent();
    expect(set).toHaveBeenCalledWith(
      SIGNUP_INTENT_COOKIE,
      expect.any(String),
      expect.objectContaining({ path: '/' }),
    );
  });

  it('reuses the server cookie without exposing a new token', async () => {
    get.mockReturnValue({ value: 'existing-intent-token' });
    await expect(getOrCreateSignupIntent()).resolves.toEqual({
      raw: 'existing-intent-token',
      digest: digestSignupIntent('existing-intent-token'),
    });
    expect(set).not.toHaveBeenCalled();
  });

  it('clears the intent after successful signup', async () => {
    await clearSignupIntent();
    expect(del).toHaveBeenCalledWith(SIGNUP_INTENT_COOKIE);
  });
});
