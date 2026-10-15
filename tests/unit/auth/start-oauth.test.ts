import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { signInWithOAuth, createServerSupabaseClient, requestHeaders } = vi.hoisted(() => {
  const signInWithOAuth = vi.fn();
  return {
    signInWithOAuth,
    createServerSupabaseClient: vi.fn(async () => ({ auth: { signInWithOAuth } })),
    requestHeaders: { host: 'zipsin.net' as string | null },
  };
});

vi.mock('next/headers', () => ({
  headers: async () => new Headers(requestHeaders.host ? { host: requestHeaders.host } : {}),
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient,
}));

import { startOAuth } from '@/features/auth/actions/start-oauth';

describe('startOAuth', () => {
  beforeEach(() => {
    signInWithOAuth.mockReset();
    requestHeaders.host = 'zipsin.net';
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://zipsin.net');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('지원하지 않는 제공자를 거부한다', async () => {
    await expect(startOAuth('github')).rejects.toThrow(
      'REDIRECT:/login?error=oauth_provider_unavailable',
    );
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });

  it('비활성 제공자를 거부한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_AUTH_GOOGLE_ENABLED', 'false');
    await expect(startOAuth('google')).rejects.toThrow(
      'REDIRECT:/login?error=oauth_provider_unavailable',
    );
  });

  it('안전한 callback과 Naver custom provider로 시작한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_AUTH_NAVER_ENABLED', 'true');
    signInWithOAuth.mockResolvedValue({
      data: { url: 'https://nid.naver.com/oauth2/authorize' },
      error: null,
    });

    await expect(startOAuth('naver', 'https://evil.example')).rejects.toThrow(
      'REDIRECT:https://nid.naver.com/oauth2/authorize',
    );
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'custom:naver',
      options: {
        redirectTo: 'https://zipsin.net/auth/callback?next=%2Fhome',
      },
    });
  });

  it('제공자 시작 실패를 로그인 오류로 돌린다', async () => {
    vi.stubEnv('NEXT_PUBLIC_AUTH_KAKAO_ENABLED', 'true');
    signInWithOAuth.mockResolvedValue({ data: { url: null }, error: new Error('bad') });

    await expect(startOAuth('kakao', '/onboarding/role')).rejects.toThrow(
      'REDIRECT:/login?error=oauth_start_failed',
    );
  });

  it('운영 환경에서 localhost callback으로 OAuth를 시작하지 않는다', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://127.0.0.1:3000');
    vi.stubEnv('NEXT_PUBLIC_AUTH_GOOGLE_ENABLED', 'true');

    await expect(startOAuth('google', '/ck')).rejects.toThrow(
      'AUTH_SITE_URL_INVALID',
    );
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });

  it('TEST-AUTH-LOGIN-005 간편 로그인은 이전 로그인 유지 해제 표시를 남기지 않는다', async () => {
    vi.stubEnv('NEXT_PUBLIC_AUTH_GOOGLE_ENABLED', 'true');
    signInWithOAuth.mockResolvedValue({ data: { url: 'https://accounts.example/auth' }, error: null });
    await expect(startOAuth('google')).rejects.toThrow('REDIRECT:https://accounts.example/auth');
    expect(createServerSupabaseClient).toHaveBeenCalledWith({ sessionOnly: false });
  });

  it('TEST-CK-HOST-003 ck.zipsin.net에서 시작한 간편 로그인은 ck.zipsin.net으로 돌아온다', async () => {
    vi.stubEnv('NEXT_PUBLIC_AUTH_GOOGLE_ENABLED', 'true');
    requestHeaders.host = 'ck.zipsin.net';
    signInWithOAuth.mockResolvedValue({ data: { url: 'https://accounts.example/auth' }, error: null });
    await expect(startOAuth('google', '/ck')).rejects.toThrow('REDIRECT:https://accounts.example/auth');
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://ck.zipsin.net/auth/callback?next=%2Fck' },
    });
  });
});
