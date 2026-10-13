import 'server-only';
import {readPublicEnv, type EnvSource} from './public';
import type {ProviderConfiguration} from '@/features/auth/domain/providers';

export type ServerEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey?: string;
  authTestMode: boolean;
  oauthProviders: ProviderConfiguration;
};

export function readServerEnv(source: EnvSource = process.env): ServerEnv {
  const publicEnv = readPublicEnv(source);
  const authTestMode = source.AUTH_TEST_MODE === 'true';
  if (source.NODE_ENV === 'production' && authTestMode) {
    throw new Error('Production에서는 테스트 인증을 사용할 수 없습니다.');
  }
  return {
    ...publicEnv,
    ...(source.SUPABASE_SERVICE_ROLE_KEY ? {supabaseServiceRoleKey: source.SUPABASE_SERVICE_ROLE_KEY} : {}),
    authTestMode,
    oauthProviders: {
      google: source.AUTH_GOOGLE_ENABLED === 'true',
      kakao: source.AUTH_KAKAO_ENABLED === 'true',
      naver: source.AUTH_NAVER_ENABLED === 'true',
    },
  };
}
