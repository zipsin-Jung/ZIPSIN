import { render, screen } from '@testing-library/react';
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { updateSupabaseSession } = vi.hoisted(() => ({
  updateSupabaseSession: vi.fn(async () => new Response(null, { headers: { 'x-session-refreshed': '1' } })),
}));
vi.mock('@/lib/supabase/proxy', () => ({ updateSupabaseSession }));

import { proxy } from '@/proxy';
import { isCleanHost } from '@/lib/site/clean-host';
import { CleanPreparing } from '@/features/zipsin-clean/components/CleanPreparing';

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe('TEST-CL-HOST-001 cl.zipsin.net 주소 구분', () => {
  it('집신클린 주소만 클린으로 본다(포트·대소문자 무시)', () => {
    expect(isCleanHost('cl.zipsin.net')).toBe(true);
    expect(isCleanHost('CL.zipsin.net:443')).toBe(true);
    expect(isCleanHost('zipsin.net')).toBe(false);
    expect(isCleanHost('ck.zipsin.net')).toBe(false);
    expect(isCleanHost('cl.zipsin.net.evil.example')).toBe(false);
    expect(isCleanHost(undefined)).toBe(false);
  });

  it('환경값으로 검수용 주소를 지정할 수 있다', () => {
    vi.stubEnv('NEXT_PUBLIC_CLEAN_SITE_URL', 'http://cl.localhost:3102');
    expect(isCleanHost('cl.localhost:3102')).toBe(true);
    expect(isCleanHost('cl.zipsin.net')).toBe(false);
  });
});

describe('TEST-CL-HOST-002 cl.zipsin.net은 준비 중 화면만 연다', () => {
  it('첫 화면이 아닌 주소는 첫 화면(준비 중)으로 보내고 계정·DB를 부르지 않는다', async () => {
    const response = await proxy(new NextRequest('https://cl.zipsin.net/home?x=1', { headers: { host: 'cl.zipsin.net' } }));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://cl.zipsin.net/');
    expect(updateSupabaseSession).not.toHaveBeenCalled();
  });

  it('첫 화면은 그대로 통과한다', async () => {
    const response = await proxy(new NextRequest('https://cl.zipsin.net/', { headers: { host: 'cl.zipsin.net' } }));
    expect(response.status).toBe(200);
    expect(updateSupabaseSession).not.toHaveBeenCalled();
  });

  it('준비 중 화면은 서비스 이름과 준비 중을 알리고, 신청을 받는 척하지 않는다', () => {
    render(<CleanPreparing />);
    expect(screen.getByRole('heading', { name: '집신클린 서비스 준비 중이에요' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '집신 둘러보기' })).toHaveAttribute('href', 'https://zipsin.net/');
  });
});
