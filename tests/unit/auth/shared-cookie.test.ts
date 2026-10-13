import { describe, expect, it } from 'vitest';
import { getAuthCookieOptions } from '@/lib/supabase/cookie-options';

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
});
