import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPublicEnv, parsePublicEnv } from '@/lib/env/public';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('public environment', () => {
  it('올바르지 않은 Supabase URL을 거부한다', () => {
    expect(() =>
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'not-a-url',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-key',
      }),
    ).toThrow();
  });

  it('브라우저 공개 설정을 읽는다', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://browser.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'browser-public-key');

    expect(getPublicEnv()).toEqual({
      supabaseUrl: 'https://browser.supabase.co',
      supabaseAnonKey: 'browser-public-key',
    });
  });
});
