import { describe, expect, it } from 'vitest';
import { validateAccountSyncEnv } from '@/scripts/check-account-sync-env-logic.mjs';

const base = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
};

describe('집신·집신체크 배포 환경 검사', () => {
  it('로컬 개발에서는 공유 도메인 쿠키 없이 통과한다', () => {
    expect(validateAccountSyncEnv({ ...base, NODE_ENV: 'development' })).toEqual([]);
  });

  it('운영에서 공용 세션 도메인과 HTTPS 기준 주소를 요구한다', () => {
    expect(validateAccountSyncEnv({ ...base, NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3000' }))
      .toEqual(expect.arrayContaining([
        'Production NEXT_PUBLIC_AUTH_COOKIE_DOMAIN은 .zipsin.net이어야 합니다.',
        'Production NEXT_PUBLIC_SITE_URL은 https://zipsin.net이어야 합니다.',
      ]));
  });

  it('운영 인증 기준 주소가 ck 서브도메인으로 분산되는 것을 막는다', () => {
    expect(validateAccountSyncEnv({
      ...base,
      NODE_ENV: 'production',
      NEXT_PUBLIC_SITE_URL: 'https://ck.zipsin.net',
      NEXT_PUBLIC_AUTH_COOKIE_DOMAIN: '.zipsin.net',
    })).toContain('Production NEXT_PUBLIC_SITE_URL은 https://zipsin.net이어야 합니다.');
  });

  it('운영용 집신 기준 주소와 공용 쿠키 도메인을 허용한다', () => {
    expect(validateAccountSyncEnv({
      ...base,
      NODE_ENV: 'production',
      NEXT_PUBLIC_SITE_URL: 'https://zipsin.net',
      NEXT_PUBLIC_AUTH_COOKIE_DOMAIN: '.zipsin.net',
    })).toEqual([]);
  });

  it('운영 mock을 거부하고 SOLAPI 선택 시 서버 비밀값을 모두 요구한다', () => {
    expect(validateAccountSyncEnv({ ...base, NODE_ENV: 'production', PHONE_VERIFICATION_PROVIDER: 'mock' }))
      .toContain('Production PHONE_VERIFICATION_PROVIDER=mock 금지');
    expect(validateAccountSyncEnv({ ...base, NODE_ENV: 'development', PHONE_VERIFICATION_PROVIDER: 'solapi' }))
      .toEqual(expect.arrayContaining([
        'SOLAPI 설정 누락: SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER_NUMBER, PHONE_OTP_HMAC_SECRET',
      ]));
  });
});
