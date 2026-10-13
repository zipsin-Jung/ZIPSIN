import { afterEach, describe, expect, it } from 'vitest';
import { getAuthCookieOptions, getRuntimeAuthCookieOptions } from '@/lib/supabase/cookie-options';

afterEach(() => {
  delete process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN;
  delete process.env.VERCEL_ENV;
});

describe('shared ZIPSIN auth cookie', () => {
  it('운영 환경에서는 zipsin.net과 ck.zipsin.net이 같은 보안 쿠키를 사용한다', () => {
    expect(getAuthCookieOptions({ production: true })).toEqual({
      domain: '.zipsin.net',
      path: '/',
      secure: true,
      sameSite: 'lax',
    });
  });

  it('로컬과 Preview에는 운영 부모 도메인을 강제로 설정하지 않는다', () => {
    expect(getAuthCookieOptions({ production: false })).toEqual({
      path: '/',
      sameSite: 'lax',
    });
  });

  it('Vercel Preview에서 운영 쿠키 도메인 설정을 무시한다', () => {
    process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN = '.zipsin.net';
    process.env.VERCEL_ENV = 'preview';

    expect(getRuntimeAuthCookieOptions()).toEqual({ path: '/', sameSite: 'lax' });
  });

  it('Vercel Production에서만 운영 부모 도메인을 공유한다', () => {
    process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN = '.zipsin.net';
    process.env.VERCEL_ENV = 'production';

    expect(getRuntimeAuthCookieOptions()).toEqual({
      domain: '.zipsin.net',
      path: '/',
      secure: true,
      sameSite: 'lax',
    });
  });
});
