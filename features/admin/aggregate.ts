import type { SiteId } from '@/lib/site/site-of';

export type EventRow = { site: SiteId; event: 'page_view' | 'login' | 'signup_complete'; path: string; visitor_id: string | null; session_id: string | null; occurred_at: string };

const SITES: SiteId[] = ['zipsin', 'check', 'clean', 'repair'];
const day = (iso: string) => new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });

/**
 * 이용 통계 묶기 (관리자 대시보드).
 * - 방문자 = 서로 다른 브라우저 번호 수(사람 수와 같지 않음: 같은 사람이 휴대폰·PC로 오면 2)
 * - 이탈 화면 = 한 번 방문(세션)에서 마지막으로 본 화면. 한 화면만 보고 나간 방문은 '바로 나감'으로 따로 센다.
 */
export function aggregateEvents(rows: EventRow[]) {
  const views = rows.filter((row) => row.event === 'page_view');
  const bySite = Object.fromEntries(SITES.map((site) => {
    const siteViews = views.filter((row) => row.site === site);
    return [site, {
      visitors: new Set(siteViews.map((row) => row.visitor_id).filter(Boolean)).size,
      pageViews: siteViews.length,
      logins: rows.filter((row) => row.site === site && row.event === 'login').length,
    }];
  })) as Record<SiteId, { visitors: number; pageViews: number; logins: number }>;

  const landingVisitors = Object.fromEntries(SITES.map((site) => [site, new Set(views.filter((row) => row.site === site && (row.path === '/' || row.path === '/ck' || row.path === '/cl' || row.path === '/rp')).map((row) => row.visitor_id).filter(Boolean)).size])) as Record<SiteId, number>;
  const signupVisitors = new Set(views.filter((row) => row.path.startsWith('/signup')).map((row) => row.visitor_id).filter(Boolean)).size;

  // 세션별 마지막 화면
  const sessions = new Map<string, EventRow[]>();
  for (const row of views) {
    if (!row.session_id) continue;
    const list = sessions.get(row.session_id) ?? [];
    list.push(row);
    sessions.set(row.session_id, list);
  }
  const exitCounts = new Map<string, { site: SiteId; path: string; exits: number; bounces: number }>();
  for (const list of sessions.values()) {
    const sorted = [...list].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
    const last = sorted[sorted.length - 1];
    const key = `${last.site}::${last.path}`;
    const entry = exitCounts.get(key) ?? { site: last.site, path: last.path, exits: 0, bounces: 0 };
    entry.exits += 1;
    if (sorted.length === 1) entry.bounces += 1;
    exitCounts.set(key, entry);
  }
  const exits = [...exitCounts.values()].sort((a, b) => b.exits - a.exits).slice(0, 12);

  const pageCounts = new Map<string, { site: SiteId; path: string; views: number }>();
  for (const row of views) {
    const key = `${row.site}::${row.path}`;
    const entry = pageCounts.get(key) ?? { site: row.site, path: row.path, views: 0 };
    entry.views += 1;
    pageCounts.set(key, entry);
  }
  const topPages = [...pageCounts.values()].sort((a, b) => b.views - a.views).slice(0, 12);

  const dailyMap = new Map<string, Set<string>>();
  for (const row of views) {
    if (!row.visitor_id) continue;
    const key = day(row.occurred_at);
    const set = dailyMap.get(key) ?? new Set<string>();
    set.add(row.visitor_id);
    dailyMap.set(key, set);
  }
  const daily = [...dailyMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, set]) => ({ date, visitors: set.size }));

  return { bySite, landingVisitors, signupVisitors, exits, topPages, daily, sessions: sessions.size };
}

/** 앞 단계 대비 몇 %가 남았는지. 앞 단계가 0이거나 값이 없으면 null. */
export function stepRate(previous: number | null, current: number | null): number | null {
  if (previous === null || current === null || previous === 0) return null;
  return Math.round((current / previous) * 100);
}
