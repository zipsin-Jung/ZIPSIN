import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type CookieToSet = { name: string; value: string; options: Record<string, unknown> };
type CookieAdapter = { getAll: () => unknown; setAll: (cookies: CookieToSet[]) => void };

const { createServerClient, cookieStore, refreshed } = vi.hoisted(() => {
  const refreshed: { cookies: CookieToSet[] } = { cookies: [] };
  const createServerClient = vi.fn((_url: string, _key: string, config: { cookies: CookieAdapter }) => ({
    auth: {
      getClaims: async () => { config.cookies.setAll(refreshed.cookies); return { data: null, error: null }; },
    },
    adapter: config.cookies,
  }));
  const jar = new Map<string, { value: string; options?: Record<string, unknown> }>();
  const cookieStore = {
    jar,
    getAll: () => [...jar].map(([name, entry]) => ({ name, value: entry.value })),
    has: (name: string) => jar.has(name),
    set: vi.fn((name: string, value: string, options?: Record<string, unknown>) => { jar.set(name, { value, options }); }),
    delete: vi.fn((input: string | { name: string }) => { jar.delete(typeof input === 'string' ? input : input.name); }),
  };
  return { createServerClient, cookieStore, refreshed };
});

vi.mock('@supabase/ssr', () => ({ createServerClient }));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));
vi.mock('@/lib/env/server', () => ({
  getServerEnv: () => ({ supabaseUrl: 'https://example.supabase.co', supabaseAnonKey: 'anon' }),
}));

import { SESSION_ONLY_COOKIE, toPersistenceCookieOptions } from '@/lib/supabase/cookie-options';
import { updateSupabaseSession } from '@/lib/supabase/proxy';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const persistentAuthCookie: CookieToSet = {
  name: 'sb-example-auth-token',
  value: 'refreshed-token',
  options: { path: '/', sameSite: 'lax', maxAge: 34_560_000 },
};

function lastAdapter() {
  return (createServerClient.mock.results.at(-1)!.value as { adapter: CookieAdapter }).adapter;
}

beforeEach(() => {
  vi.clearAllMocks();
  cookieStore.jar.clear();
  refreshed.cookies = [persistentAuthCookie];
});

describe('TEST-AUTH-LOGIN-005 로그인 유지 해제 세션의 갱신', () => {
  it('세션 전용 표시가 있으면 갱신 쿠키에서 만료 시간을 제거한다', () => {
    expect(toPersistenceCookieOptions({ path: '/', maxAge: 100, expires: new Date() }, 'token', true))
      .toEqual({ path: '/' });
  });

  it('로그아웃 같은 삭제 쿠키는 세션 전용이어도 즉시 만료를 유지한다', () => {
    expect(toPersistenceCookieOptions({ path: '/', maxAge: 0 }, '', true)).toEqual({ path: '/', maxAge: 0 });
  });

  it('로그인 유지 사용자는 기존 만료 시간을 그대로 쓴다', () => {
    expect(toPersistenceCookieOptions({ path: '/', maxAge: 100 }, 'token', false)).toEqual({ path: '/', maxAge: 100 });
  });

  it('proxy 갱신은 로그인 유지 해제 사용자의 쿠키를 브라우저 세션 쿠키로 유지한다', async () => {
    const request = new NextRequest('https://zipsin.net/home', {
      headers: { cookie: `${SESSION_ONLY_COOKIE}=1; sb-example-auth-token=old` },
    });
    const response = await updateSupabaseSession(request);
    const cookie = response.cookies.get('sb-example-auth-token');
    expect(cookie?.value).toBe('refreshed-token');
    expect(cookie?.maxAge).toBeUndefined();
    expect(cookie?.expires).toBeUndefined();
  });

  it('proxy 갱신은 로그인 유지 사용자의 영속 쿠키를 바꾸지 않는다', async () => {
    const request = new NextRequest('https://zipsin.net/home', { headers: { cookie: 'sb-example-auth-token=old' } });
    const response = await updateSupabaseSession(request);
    expect(response.cookies.get('sb-example-auth-token')?.maxAge).toBe(34_560_000);
  });

  it('로그인 유지 해제 로그인은 세션 전용 표시를 브라우저 세션 쿠키로 남긴다', async () => {
    await createServerSupabaseClient({ sessionOnly: true });
    const marker = cookieStore.jar.get(SESSION_ONLY_COOKIE);
    expect(marker?.value).toBe('1');
    expect(marker?.options).toMatchObject({ path: '/', sameSite: 'lax' });
    expect(marker?.options).not.toHaveProperty('maxAge');
  });

  it('로그인 유지 로그인은 이전 세션 전용 표시를 지운다', async () => {
    cookieStore.jar.set(SESSION_ONLY_COOKIE, { value: '1' });
    await createServerSupabaseClient({ sessionOnly: false });
    expect(cookieStore.jar.has(SESSION_ONLY_COOKIE)).toBe(false);
  });

  it('다른 서버 작업의 토큰 갱신도 세션 전용 표시를 따른다', async () => {
    cookieStore.jar.set(SESSION_ONLY_COOKIE, { value: '1' });
    await createServerSupabaseClient();
    lastAdapter().setAll([persistentAuthCookie]);
    expect(cookieStore.jar.get('sb-example-auth-token')?.options).not.toHaveProperty('maxAge');
  });

  it('표시가 없으면 다른 서버 작업은 영속 쿠키를 유지한다', async () => {
    await createServerSupabaseClient();
    lastAdapter().setAll([persistentAuthCookie]);
    expect(cookieStore.jar.get('sb-example-auth-token')?.options).toMatchObject({ maxAge: 34_560_000 });
    expect(cookieStore.jar.has(SESSION_ONLY_COOKIE)).toBe(false);
  });
});
