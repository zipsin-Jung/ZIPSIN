import { afterEach, describe, expect, it, vi } from 'vitest';
import { getServerEnv, parseServerEnv } from '@/lib/env/server';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('parseServerEnv', () => {
  it('Supabase 서버 환경값이 없으면 시작을 거부한다', () => {
    expect(() => parseServerEnv({})).toThrow('NEXT_PUBLIC_SUPABASE_URL');
  });

  it('공개 URL과 공개 키만 브라우저 공유 설정으로 읽는다', () => {
    expect(
      parseServerEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
      }),
    ).toEqual({
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'public-anon-key',
    });
  });

  it('서버 프로세스의 공개 Supabase 설정을 읽는다', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://server.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'server-public-key');

    expect(getServerEnv()).toEqual({
      supabaseUrl: 'https://server.supabase.co',
      supabaseAnonKey: 'server-public-key',
    });
  });
});
