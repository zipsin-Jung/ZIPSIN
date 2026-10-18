import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { updateSupabaseSession } = vi.hoisted(() => ({
  updateSupabaseSession: vi.fn(async () => new Response(null, { headers: { 'x-session-refreshed': '1' } })),
}));
vi.mock('@/lib/supabase/proxy', () => ({ updateSupabaseSession }));

import { proxy } from '@/proxy';
import { isCheckHost, resolveAuthSiteOrigin } from '@/lib/site/check-host';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('TEST-CK-HOST-001 ck.zipsin.net 주소 구분', () => {
  it('기본 집신체크 주소와 포트·대소문자 차이를 같은 주소로 본다', () => {
    expect(isCheckHost('ck.zipsin.net')).toBe(true);
    expect(isCheckHost('CK.zipsin.net:443')).toBe(true);
  });

  it('집신 본체와 다른 하위 주소는 집신체크로 보지 않는다', () => {
    expect(isCheckHost('zipsin.net')).toBe(false);
    expect(isCheckHost('ck.zipsin.net.evil.example')).toBe(false);
    expect(isCheckHost(null)).toBe(false);
  });

  it('환경값으로 검수용 집신체크 주소를 지정할 수 있다', () => {
    vi.stubEnv('NEXT_PUBLIC_CHECK_SITE_URL', 'http://ck.localhost:3101');
    expect(isCheckHost('ck.localhost:3101')).toBe(true);
    expect(isCheckHost('ck.zipsin.net')).toBe(false);
  });
});

describe('TEST-CK-HOST-002 집신체크 첫 화면 연결', () => {
  it('ck.zipsin.net 첫 화면은 주소를 바꾸지 않고 그대로 연다(2026-10-18)', async () => {
    const response = await proxy(new NextRequest('https://ck.zipsin.net/?ref=qr', { headers: { host: 'ck.zipsin.net' } }));
    expect(response.headers.get('location')).toBeNull();
  });

  it('TEST-CK-HOST-ROOT-001 예전 주소 ck.zipsin.net/ck 는 ck.zipsin.net 으로 옮긴다', async () => {
    const response = await proxy(new NextRequest('https://ck.zipsin.net/ck?install=1', { headers: { host: 'ck.zipsin.net' } }));
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('https://ck.zipsin.net/?install=1');
  });

  it('TEST-CK-HOST-ROOT-002 zipsin.net/ck 는 그대로 둔다', async () => {
    const response = await proxy(new NextRequest('https://zipsin.net/ck', { headers: { host: 'zipsin.net' } }));
    expect(response.headers.get('location')).toBeNull();
  });

  it('zipsin.net 첫 화면은 기존 집신 첫 화면을 그대로 둔다', async () => {
    const response = await proxy(new NextRequest('https://zipsin.net/', { headers: { host: 'zipsin.net' } }));
    expect(response.headers.get('location')).toBeNull();
    expect(updateSupabaseSession).not.toHaveBeenCalled();
  });

  it('로그인 세션이 필요한 경로는 두 주소 모두 기존처럼 세션을 갱신한다', async () => {
    const response = await proxy(new NextRequest('https://ck.zipsin.net/signup', { headers: { host: 'ck.zipsin.net' } }));
    expect(updateSupabaseSession).toHaveBeenCalledTimes(1);
    expect(response.headers.get('x-session-refreshed')).toBe('1');
  });
});

describe('TEST-CK-HOST-003 간편 로그인 복귀 주소', () => {
  it('집신체크에서 시작하면 집신체크 주소로 돌아온다', () => {
    expect(resolveAuthSiteOrigin('https://zipsin.net', 'ck.zipsin.net')).toBe('https://ck.zipsin.net');
  });

  it('그 밖의 주소는 항상 집신 기준 주소를 쓴다', () => {
    expect(resolveAuthSiteOrigin('https://zipsin.net', 'zipsin.net')).toBe('https://zipsin.net');
    expect(resolveAuthSiteOrigin('https://zipsin.net', 'evil.example')).toBe('https://zipsin.net');
    expect(resolveAuthSiteOrigin('https://zipsin.net', null)).toBe('https://zipsin.net');
  });
});
