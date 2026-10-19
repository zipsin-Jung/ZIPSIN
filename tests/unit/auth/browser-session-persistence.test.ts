import { beforeEach, describe, expect, it, vi } from 'vitest';

type CookieAdapter = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options: Record<string, unknown> }[]) => void;
};

const { createBrowserClient } = vi.hoisted(() => ({
  createBrowserClient: vi.fn((_url: string, _key: string, config: { cookies: CookieAdapter }) => ({ adapter: config.cookies })),
}));

vi.mock('@supabase/ssr', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@supabase/ssr')>()),
  createBrowserClient,
}));
vi.mock('@/lib/env/public', () => ({
  getPublicEnv: () => ({ supabaseUrl: 'https://example.supabase.co', supabaseAnonKey: 'anon' }),
}));

import { createBrowserSupabaseClient } from '@/lib/supabase/client';

let jar = '';
const writes: string[] = [];

beforeEach(() => {
  jar = '';
  writes.length = 0;
  Object.defineProperty(document, 'cookie', {
    configurable: true,
    get: () => jar,
    set: (value: string) => { writes.push(value); },
  });
});

function refresh() {
  const { adapter } = createBrowserSupabaseClient() as unknown as { adapter: CookieAdapter };
  adapter.setAll([{ name: 'sb-example-auth-token', value: 'refreshed', options: { path: '/', sameSite: 'lax', maxAge: 34_560_000 } }]);
  return writes.at(-1) ?? '';
}

describe('TEST-AUTH-LOGIN-005 브라우저 자동 토큰 갱신', () => {
  it('로그인 유지 해제 표시가 있으면 400일 만료 없이 브라우저 세션 쿠키로 쓴다', () => {
    jar = 'zipsin-session-only=1';
    const written = refresh();
    expect(written).toContain('sb-example-auth-token=refreshed');
    expect(written).not.toMatch(/Max-Age|Expires/i);
  });

  it('로그인 유지 사용자는 30일 만료 시간을 쓴다(DEC-037)', () => {
    expect(refresh()).toMatch(/Max-Age=2592000/i);
  });

  it('기존 쿠키를 그대로 읽어 세션을 복원한다', () => {
    jar = 'sb-example-auth-token=abc; zipsin-session-only=1';
    const { adapter } = createBrowserSupabaseClient() as unknown as { adapter: CookieAdapter };
    expect(adapter.getAll()).toEqual(expect.arrayContaining([{ name: 'sb-example-auth-token', value: 'abc' }]));
  });
});
