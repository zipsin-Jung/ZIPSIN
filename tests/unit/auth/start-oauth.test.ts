import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { signInWithOAuth } = vi.hoisted(() => ({
  signInWithOAuth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: async () => ({ auth: { signInWithOAuth } }),
}));

import { startOAuth } from '@/features/auth/actions/start-oauth';

describe('startOAuth', () => {
  beforeEach(() => {
    signInWithOAuth.mockReset();
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
});
