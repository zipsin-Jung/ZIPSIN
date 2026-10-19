// 집신 아래 서비스 주소 (DEC-030·DEC-036, 2026-10-18 대표 확정)
//   집신체크 ck.zipsin.net · 집신청소 cl.zipsin.net · 집신수리 rp.zipsin.net
// 집신청소·집신수리는 같은 앱이 '준비 중' 화면만 보여 준다.
// zipsin.net/cl, zipsin.net/rp 도 같은 준비 중 화면을 보여 준다(Preview·예전 링크용).
// 주소를 바꿔야 하면 Vercel 환경값 NEXT_PUBLIC_CLEAN_SITE_URL / NEXT_PUBLIC_REPAIR_SITE_URL 로 덮어쓴다.

export type SubSiteId = 'clean' | 'repair';

const SUB_SITES: Record<SubSiteId, { envKey: string; defaultUrl: string; path: string }> = {
  clean: { envKey: 'NEXT_PUBLIC_CLEAN_SITE_URL', defaultUrl: 'https://cl.zipsin.net', path: '/cl' },
  repair: { envKey: 'NEXT_PUBLIC_REPAIR_SITE_URL', defaultUrl: 'https://rp.zipsin.net', path: '/rp' },
};

function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/:(443|80)$/, '');
}

function configuredUrl(id: SubSiteId): string | undefined {
  // NEXT_PUBLIC_* 는 빌드 때 글자 그대로 바뀌므로 키를 직접 적는다.
  return id === 'clean' ? process.env.NEXT_PUBLIC_CLEAN_SITE_URL : process.env.NEXT_PUBLIC_REPAIR_SITE_URL;
}

export function isSubSiteHost(id: SubSiteId, host: string | null | undefined): boolean {
  if (!host) return false;
  const url = new URL(configuredUrl(id) || SUB_SITES[id].defaultUrl);
  return normalizeHost(host) === normalizeHost(url.host);
}

export function subSiteForHost(host: string | null | undefined): SubSiteId | null {
  if (isSubSiteHost('clean', host)) return 'clean';
  if (isSubSiteHost('repair', host)) return 'repair';
  return null;
}

/**
 * 집신 위쪽 메뉴의 링크 주소.
 * 운영(zipsin.net)에서는 각 서비스 주소(cl.zipsin.net·rp.zipsin.net, 2026-10-18 도메인 연결)로,
 * Preview·로컬에서는 실서비스로 새지 않게 같은 앱 경로(/cl·/rp)로 보낸다.
 */
export function getSubSiteHref(
  id: SubSiteId,
  vercelEnv: string | undefined = process.env.VERCEL_ENV,
  configured: string | undefined = configuredUrl(id),
): string {
  if (vercelEnv !== 'production') return SUB_SITES[id].path;
  return `${new URL(configured || SUB_SITES[id].defaultUrl).origin}/`;
}
