import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const exchangeCodeForSession = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: async () => ({
    auth: { exchangeCodeForSession },
  }),
}));

import { GET } from '@/app/(auth)/auth/callback/route';

describe('OAuth callback', () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
  });

  it('code가 없으면 로그인 오류로 돌아간다', async () => {
    const response = await GET(
      new NextRequest('https://zipsin.net/auth/callback?next=/home'),
    );

    expect(response.headers.get('location')).toBe(
      'https://zipsin.net/login?error=oauth_missing_code',
    );
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('OAuth 교환 실패를 가입 완료로 처리하지 않는다', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: new Error('denied') });
    const response = await GET(
      new NextRequest('https://zipsin.net/auth/callback?code=bad&next=/home'),
    );

    expect(response.headers.get('location')).toBe(
      'https://zipsin.net/login?error=oauth_exchange_failed',
    );
  });

  it('성공하면 안전한 내부 경로로만 이동한다', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const response = await GET(
      new NextRequest(
        'https://zipsin.net/auth/callback?code=ok&next=https://evil.example',
      ),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith('ok');
    expect(response.headers.get('location')).toBe('https://zipsin.net/home');
  });
});
