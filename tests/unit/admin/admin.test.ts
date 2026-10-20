import { describe, expect, it } from 'vitest';
import { aggregateEvents, stepRate, type EventRow } from '@/features/admin/aggregate';
import { cleanPath, siteOf } from '@/lib/site/site-of';

const view = (site: EventRow['site'], path: string, visitor: string, session: string, minute: number): EventRow => ({ site, event: 'page_view', path, visitor_id: visitor, session_id: session, occurred_at: new Date(Date.UTC(2026, 9, 20, 3, minute)).toISOString() });

describe('총괄 관리자 통계', () => {
  it('TEST-ADMIN-001 서비스 가리기: 주소(ck·cl·rp)와 Preview 경로', () => {
    expect(siteOf('ck.zipsin.net', '/')).toBe('check');
    expect(siteOf('cl.zipsin.net', '/')).toBe('clean');
    expect(siteOf('rp.zipsin.net', '/')).toBe('repair');
    expect(siteOf('zipsin.net', '/home')).toBe('zipsin');
    expect(siteOf('preview.vercel.app', '/ck')).toBe('check');
    expect(siteOf('preview.vercel.app', '/rp')).toBe('repair');
  });

  it('TEST-ADMIN-002 경로에서 집·기록 번호와 질문 기호 뒤를 지운다(사람·집을 알아볼 수 없게)', () => {
    expect(cleanPath('/homes/3f2b1c9a-1234-4abc-8def-0123456789ab/repairs/3f2b1c9a-1234-4abc-8def-0123456789ac?x=1')).toBe('/homes/:id/repairs/:id');
    expect(cleanPath('/invitations/abcdefghijklmnopqrstuvwxyz123')).toBe('/invitations/:token');
  });

  it('TEST-ADMIN-003 방문자·이탈 화면·한 화면만 보고 나감', () => {
    const rows = [
      view('zipsin', '/', 'v1', 's1', 0), view('zipsin', '/signup', 'v1', 's1', 1),
      view('zipsin', '/', 'v2', 's2', 2),
      view('check', '/', 'v3', 's3', 3), view('check', '/', 'v3', 's3', 4),
      { ...view('zipsin', '/login', 'v1', 's1', 5), event: 'login' as const },
    ];
    const result = aggregateEvents(rows);
    expect(result.bySite.zipsin).toEqual({ visitors: 2, pageViews: 3, logins: 1 });
    expect(result.bySite.check.visitors).toBe(1);
    expect(result.signupVisitors).toBe(1);
    expect(result.exits.find((row) => row.path === '/signup')).toMatchObject({ exits: 1, bounces: 0 });
    expect(result.exits.find((row) => row.site === 'zipsin' && row.path === '/')).toMatchObject({ exits: 1, bounces: 1 });
    expect(result.daily).toEqual([{ date: '2026-10-20', visitors: 3 }]);
  });

  it('TEST-ADMIN-004 단계 비율', () => {
    expect(stepRate(200, 50)).toBe(25);
    expect(stepRate(0, 5)).toBeNull();
    expect(stepRate(null, 5)).toBeNull();
  });
});
