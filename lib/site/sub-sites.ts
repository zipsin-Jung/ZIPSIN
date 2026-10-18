// 집신 아래 서비스 주소 (DEC-030·DEC-036, 2026-10-18 대표 확정)
//   집신체크 ck.zipsin.net · 집신청소 cl.zipsin.net · 집신수리 rp.zipsin.net
// 집신청소·집신수리는 같은 앱이 '준비 중' 화면만 보여 준다.
// 주소(도메인)가 연결되기 전에는 zipsin.net/cl, zipsin.net/rp 로 보낸다(깨진 링크 방지).
// 도메인을 연결한 뒤 Vercel 운영 환경값 NEXT_PUBLIC_CLEAN_SITE_URL / NEXT_PUBLIC_REPAIR_SITE_URL 을 넣으면 메뉴가 그 주소로 바뀐다.

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

/** 집신 위쪽 메뉴의 링크 주소. 운영에서 주소 환경값이 있을 때만 그 도메인, 아니면 같은 앱 경로. */
export function getSubSiteHref(
  id: SubSiteId,
  vercelEnv: string | undefined = process.env.VERCEL_ENV,
  configured: string | undefined = configuredUrl(id),
): string {
  if (vercelEnv !== 'production' || !configured) return SUB_SITES[id].path;
  return `${new URL(configured).origin}/`;
}
