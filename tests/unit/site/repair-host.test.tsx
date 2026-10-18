import { render, screen, within } from '@testing-library/react';
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { updateSupabaseSession } = vi.hoisted(() => ({
  updateSupabaseSession: vi.fn(async () => new Response(null, { headers: { 'x-session-refreshed': '1' } })),
}));
vi.mock('@/lib/supabase/proxy', () => ({ updateSupabaseSession }));

import { proxy } from '@/proxy';
import { getRepairServiceHref, isRepairHost } from '@/lib/site/repair-host';
import { RepairPreparing } from '@/features/zipsin-repair/components/RepairPreparing';

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe('TEST-RP-HOST-001 rp.zipsin.net 주소 구분', () => {
  it('집신수리 주소만 수리로 본다(포트·대소문자 무시)', () => {
    expect(isRepairHost('rp.zipsin.net')).toBe(true);
    expect(isRepairHost('RP.zipsin.net:443')).toBe(true);
    expect(isRepairHost('zipsin.net')).toBe(false);
    expect(isRepairHost('ck.zipsin.net')).toBe(false);
    expect(isRepairHost('cl.zipsin.net')).toBe(false);
    expect(isRepairHost('rp.zipsin.net.evil.example')).toBe(false);
    expect(isRepairHost(undefined)).toBe(false);
  });

  it('환경값으로 검수용 주소를 지정할 수 있다', () => {
    vi.stubEnv('NEXT_PUBLIC_REPAIR_SITE_URL', 'http://rp.localhost:3103');
    expect(isRepairHost('rp.localhost:3103')).toBe(true);
    expect(isRepairHost('rp.zipsin.net')).toBe(false);
  });
});

describe('TEST-RP-HOST-002 rp.zipsin.net은 준비 중 화면만 연다', () => {
  it('첫 화면이 아닌 주소는 첫 화면(준비 중)으로 보내고 계정·DB를 부르지 않는다', async () => {
    const response = await proxy(new NextRequest('https://rp.zipsin.net/home?x=1', { headers: { host: 'rp.zipsin.net' } }));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://rp.zipsin.net/');
    expect(updateSupabaseSession).not.toHaveBeenCalled();
  });

  it('첫 화면은 그대로 통과한다', async () => {
    const response = await proxy(new NextRequest('https://rp.zipsin.net/', { headers: { host: 'rp.zipsin.net' } }));
    expect(response.status).toBe(200);
    expect(updateSupabaseSession).not.toHaveBeenCalled();
  });

  it('집신클린 주소의 동작은 그대로다', async () => {
    const response = await proxy(new NextRequest('https://cl.zipsin.net/home', { headers: { host: 'cl.zipsin.net' } }));
    expect(response.headers.get('location')).toBe('https://cl.zipsin.net/');
  });
});

describe('TEST-RP-HREF-001 홈 상단 집신수리 링크 주소', () => {
  it('rp.zipsin.net 연결 전·Preview·로컬에서는 같은 앱의 /rp로 보낸다', () => {
    expect(getRepairServiceHref('production', undefined)).toBe('/rp');
    expect(getRepairServiceHref('preview', 'https://rp.zipsin.net')).toBe('/rp');
    expect(getRepairServiceHref(undefined, 'https://rp.zipsin.net')).toBe('/rp');
  });

  it('실서비스에 주소를 넣으면 rp.zipsin.net으로 보낸다', () => {
    expect(getRepairServiceHref('production', 'https://rp.zipsin.net')).toBe('https://rp.zipsin.net/');
  });
});

describe('TEST-RP-HOST-003 준비 중 화면 내용', () => {
  it('서비스 이름과 준비 중을 알리고, 신청·가입을 받는 척하지 않는다', () => {
    render(<RepairPreparing />);
    expect(screen.getByRole('heading', { level: 1, name: '집신수리 서비스 준비 중이에요' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '집신 둘러보기' })).toHaveAttribute('href', 'https://zipsin.net/');
  });

  it('기록 예시는 예시라고 밝히고 견적·추가·최종 금액을 보여 준다', () => {
    render(<RepairPreparing />);
    const example = screen.getByRole('region', { name: '수리 기록 예시' });
    expect(within(example).getByText('예시 · 이런 기록이 남아요')).toBeInTheDocument();
    expect(within(example).getByText('15만 원')).toBeInTheDocument();
    expect(within(example).getByText('3만 원')).toBeInTheDocument();
    expect(within(example).getByText('18만 원')).toBeInTheDocument();
    expect(within(example).getByText('부속 교체 · 손님 동의')).toBeInTheDocument();
  });
});
