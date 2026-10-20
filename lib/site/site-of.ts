import { isCheckHost } from '@/lib/site/check-host';
import { subSiteForHost } from '@/lib/site/sub-sites';

export type SiteId = 'zipsin' | 'check' | 'clean' | 'repair';
export const SITE_LABEL: Record<SiteId, string> = { zipsin: '집신', check: '집신체크', clean: '집신청소', repair: '집신수리' };

/** 어느 서비스 화면인지: 주소(ck·cl·rp)로, Preview·예전 주소에서는 경로(/ck·/check·/cl·/rp)로 가린다. */
export function siteOf(host: string | null | undefined, path: string): SiteId {
  const sub = subSiteForHost(host);
  if (sub) return sub;
  if (isCheckHost(host)) return 'check';
  if (/^\/(ck|check)(\/|$)/.test(path)) return 'check';
  if (/^\/cl(\/|$)/.test(path)) return 'clean';
  if (/^\/rp(\/|$)/.test(path)) return 'repair';
  return 'zipsin';
}

/** 통계에 남기는 경로: 질문 기호 뒤를 지우고, 집·기록 번호 같은 긴 아이디는 ':id'로 바꿔 사람·집을 알아볼 수 없게 한다. */
export function cleanPath(path: string): string {
  const base = path.split(/[?#]/)[0] || '/';
  return base
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/[A-Za-z0-9_-]{20,}/g, '/:token')
    .slice(0, 200);
}
