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

  it('enables the ready Google and Kakao signup paths by default', () => {
    expect(readServerEnv(valid)).toEqual({
      supabaseUrl: valid.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: valid.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      authTestMode: false,
      oauthProviders: {google: true, kakao: true, naver: false},
    });
  });

  it('allows an operator to explicitly disable a provider', () => {
    expect(readServerEnv({...valid, AUTH_GOOGLE_ENABLED: 'false'}).oauthProviders).toEqual({google:false,kakao:true,naver:false});
  });

  it('rejects test authentication in production', () => {
    expect(() => readServerEnv({...valid, NODE_ENV: 'production', AUTH_TEST_MODE: 'true'})).toThrow(
      'Production에서는 테스트 인증을 사용할 수 없습니다.',
    );
  });
});
