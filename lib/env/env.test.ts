import {describe, expect, it} from 'vitest';
import {readPublicEnv} from './public';
import {readServerEnv} from './server';

const valid = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-for-tests',
};

describe('environment configuration', () => {
  it('names every missing public variable', () => {
    expect(() => readPublicEnv({})).toThrow(/NEXT_PUBLIC_SUPABASE_URL[\s\S]*NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it('does not expose the service-role key through the public parser', () => {
    expect(readPublicEnv({...valid, SUPABASE_SERVICE_ROLE_KEY: 'secret'})).toEqual({
      supabaseUrl: valid.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: valid.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
  });

  it('allows server paths that do not need a service-role key', () => {
    expect(readServerEnv(valid)).toEqual({
      supabaseUrl: valid.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: valid.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      authTestMode: false,
      oauthProviders: {google: false, kakao: false, naver: false},
    });
  });

  it('enables only explicitly configured OAuth providers', () => {
    expect(readServerEnv({...valid, AUTH_GOOGLE_ENABLED: 'true', AUTH_KAKAO_ENABLED: 'true'}).oauthProviders).toEqual({
      google: true,
      kakao: true,
      naver: false,
    });
  });

  it('rejects test authentication in production', () => {
    expect(() => readServerEnv({...valid, NODE_ENV: 'production', AUTH_TEST_MODE: 'true'})).toThrow(
      'Production에서는 테스트 인증을 사용할 수 없습니다.',
    );
  });
});
