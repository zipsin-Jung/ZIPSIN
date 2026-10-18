import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextRequest } from 'next/server';

vi.mock('@/features/install/components/InstallAppButton', () => ({ InstallAppButton: () => null }));
vi.mock('@/features/public-home/components/HomeStoryCarousel', () => ({ HomeStoryCarousel: () => null }));

describe('로그인·회원가입 준비 중 (2026-10-17)', () => {
  beforeEach(() => { process.env.NEXT_PUBLIC_ACCOUNT_OPEN = ''; });
  afterEach(() => { process.env.NEXT_PUBLIC_ACCOUNT_OPEN = 'true'; });

  it('TEST-PREP-001 공개 홈 머리말에 로그인·회원가입 링크 대신 준비 중 표시를 보여준다', async () => {
    const { default: PublicHome } = await import('@/components/PublicHome');
    render(<PublicHome />);
    expect(screen.queryByRole('link', { name: '로그인' })).toBeNull();
    expect(screen.queryByRole('link', { name: '회원가입' })).toBeNull();
    const chip = screen.getByText('로그인 · 회원가입').closest('[aria-disabled]');
    expect(chip).toHaveAttribute('aria-disabled', 'true');
    // 휴대폰용 짧은 문구도 함께 있다(2026-10-18, CSS로 화면 폭에 따라 하나만 보임)
    expect(chip).toHaveTextContent('로그인');
    expect(chip?.textContent).toContain('준비 중');
  });

  it('TEST-PREP-002 열려 있으면 로그인·회원가입 링크를 보여준다', async () => {
    process.env.NEXT_PUBLIC_ACCOUNT_OPEN = 'true';
    const { default: PublicHome } = await import('@/components/PublicHome');
    render(<PublicHome />);
    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: '회원가입' })).toHaveAttribute('href', '/signup');
  });

  it('TEST-PREP-003 API 요청은 DB에 닿기 전에 503으로 막는다', async () => {
    const { closedAccountResponse } = await import('@/proxy');
    const res = closedAccountResponse(new NextRequest('https://zipsin.net/api/phone/send', { method: 'POST' }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'account_preparing' });
  });

  it('TEST-PREP-004 로그인 뒤 화면과 인증 콜백은 처음 화면으로 보낸다', async () => {
    const { closedAccountResponse } = await import('@/proxy');
    for (const path of ['/home', '/home/x', '/homes', '/homes/1', '/my', '/chats/2', '/office/members', '/tasks', '/support', '/invitations/t', '/onboarding/role', '/auth/callback?code=1']) {
      const res = closedAccountResponse(new NextRequest(`https://zipsin.net${path}`));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('https://zipsin.net/');
    }
  });

  it('TEST-PREP-005 회원가입 안내 화면 등은 그대로 통과시킨다', async () => {
    const { closedAccountResponse } = await import('@/proxy');
    const res = closedAccountResponse(new NextRequest('https://zipsin.net/signup'));
    expect(res.headers.get('location')).toBeNull();
    expect(res.status).toBe(200);
  });

  it('TEST-PREP-006 proxy는 닫힌 상태에서 Supabase 세션 갱신을 부르지 않는다', async () => {
    vi.resetModules();
    const update = vi.fn();
    vi.doMock('@/lib/supabase/proxy', () => ({ updateSupabaseSession: update }));
    const { proxy } = await import('@/proxy');
    const res = await proxy(new NextRequest('https://zipsin.net/api/auth/recovery/username', { method: 'POST' }));
    expect(update).not.toHaveBeenCalled();
    expect(res.status).toBe(503);
    vi.doUnmock('@/lib/supabase/proxy');
  });
});

describe('첫 화면 이야기 버튼 (준비 중)', () => {
  afterEach(() => { process.env.NEXT_PUBLIC_ACCOUNT_OPEN = 'true'; });
  it('TEST-PREP-009 닫혀 있으면 회원가입 대신 집신체크로 보내고 로그인은 준비 중으로 보여준다', async () => {
    process.env.NEXT_PUBLIC_ACCOUNT_OPEN = '';
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) });
    vi.resetModules();
    vi.doUnmock('@/features/public-home/components/HomeStoryCarousel');
    const { HomeStoryCarousel } = await import('@/features/public-home/components/HomeStoryCarousel');
    render(<HomeStoryCarousel />);
    expect(screen.queryAllByRole('link', { name: /로그인|내 집 기록 시작하기/ })).toHaveLength(0);
    expect(screen.getAllByRole('link', { name: /집신체크 바로 쓰기/ })[0]).toHaveAttribute('href', '/ck');
  });
});
