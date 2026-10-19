import { render, screen } from '@testing-library/react';
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { updateSupabaseSession } = vi.hoisted(() => ({
  updateSupabaseSession: vi.fn(async () => new Response(null, { headers: { 'x-session-refreshed': '1' } })),
}));
vi.mock('@/lib/supabase/proxy', () => ({ updateSupabaseSession }));

import { proxy } from '@/proxy';
import { isCleanHost } from '@/lib/site/clean-host';
import { getSubSiteHref, subSiteForHost } from '@/lib/site/sub-sites';
import { PreparingSite } from '@/features/sub-sites/components/PreparingSite';

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe('TEST-CL-HOST-001 cl·rp 주소 구분 (집신청소·집신수리)', () => {
  it('cl은 집신청소, rp는 집신수리로 본다(포트·대소문자 무시)', () => {
    expect(isCleanHost('cl.zipsin.net')).toBe(true);
    expect(isCleanHost('CL.zipsin.net:443')).toBe(true);
    expect(subSiteForHost('cl.zipsin.net')).toBe('clean');
    expect(subSiteForHost('rp.zipsin.net')).toBe('repair');
    expect(subSiteForHost('zipsin.net')).toBeNull();
    expect(subSiteForHost('ck.zipsin.net')).toBeNull();
    expect(subSiteForHost('cl.zipsin.net.evil.example')).toBeNull();
    expect(subSiteForHost(undefined)).toBeNull();
  });

  it('환경값으로 검수용 주소를 지정할 수 있다', () => {
    vi.stubEnv('NEXT_PUBLIC_CLEAN_SITE_URL', 'http://cl.localhost:3102');
    expect(isCleanHost('cl.localhost:3102')).toBe(true);
    expect(isCleanHost('cl.zipsin.net')).toBe(false);
  });
});

describe('TEST-SUB-SITE-HREF 메뉴 링크 주소 (대표 결정: 청소 cl.zipsin.net · 수리 rp.zipsin.net)', () => {
  it('운영에서는 각 서비스 주소로 간다(환경값이 없어도)', () => {
    expect(getSubSiteHref('clean', 'production', undefined)).toBe('https://cl.zipsin.net/');
    expect(getSubSiteHref('repair', 'production', '')).toBe('https://rp.zipsin.net/');
  });
  it('환경값이 있으면 그 주소', () => {
    expect(getSubSiteHref('clean', 'production', 'https://cl.example.test')).toBe('https://cl.example.test/');
  });
  it('Preview·로컬은 실서비스로 새지 않게 같은 앱 경로', () => {
    expect(getSubSiteHref('clean', 'preview', 'https://cl.zipsin.net')).toBe('/cl');
    expect(getSubSiteHref('repair', undefined, undefined)).toBe('/rp');
  });
});

describe('TEST-CL-HOST-002 cl·rp 주소는 준비 중 화면만 연다', () => {
  it.each(['cl.zipsin.net', 'rp.zipsin.net'])('%s 첫 화면이 아닌 주소는 첫 화면으로 보내고 계정·DB를 부르지 않는다', async (host) => {
    const response = await proxy(new NextRequest(`https://${host}/home?x=1`, { headers: { host } }));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(`https://${host}/`);
    expect(updateSupabaseSession).not.toHaveBeenCalled();
  });

  it('첫 화면은 그대로 통과한다', async () => {
    const response = await proxy(new NextRequest('https://rp.zipsin.net/', { headers: { host: 'rp.zipsin.net' } }));
    expect(response.status).toBe(200);
    expect(updateSupabaseSession).not.toHaveBeenCalled();
  });

  it.each([
    ['clean', '집신청소', 'cl.zipsin.net'],
    ['repair', '집신수리', 'rp.zipsin.net'],
  ] as const)('%s 준비 중 화면: 이름·준비 중을 알리고, 신청을 받는 척하거나 정하지 않은 약속을 하지 않는다', (service, name, host) => {
    const { container } = render(<PreparingSite homeHref="https://zipsin.net/" service={service} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(`${name}에서`);
    expect(screen.getByRole('img', { name: '준비 중' })).toHaveTextContent(host);
    expect(screen.getByText(/아직은 이용할 수 없어요/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '그동안 집신 둘러보기' })).toHaveAttribute('href', 'https://zipsin.net/');
    expect(container.textContent).not.toMatch(/추가요금|가격 확정|흥정|바로 이용|카카오톡|집신클린/);
  });
});
