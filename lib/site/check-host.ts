// ck.zipsin.net is the public address for 집신체크. It is served by the same
// Next.js app and Supabase project as zipsin.net, so accounts and sessions are
// shared. Check users stay on this host for login too, because 집신체크 keeps
// unsaved records in browser storage that belongs to one address only.
const DEFAULT_CHECK_SITE_URL = 'https://ck.zipsin.net';

function checkSiteUrl(): URL {
  return new URL(process.env.NEXT_PUBLIC_CHECK_SITE_URL || DEFAULT_CHECK_SITE_URL);
}

function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/:(443|80)$/, '');
}

export function isCheckHost(host: string | null | undefined): boolean {
  if (!host) return false;
  return normalizeHost(host) === normalizeHost(checkSiteUrl().host);
}

/** Origin used for OAuth and email return links: ck host when the request came from it, otherwise the main site. */
export function resolveAuthSiteOrigin(mainSiteOrigin: string, requestHost: string | null | undefined): string {
  return isCheckHost(requestHost) ? checkSiteUrl().origin : mainSiteOrigin;
}

/**
 * 홈 상단 "집신체크" 링크 주소(2026-10-16 사용자 요청).
 * 실서비스에서는 ck.zipsin.net으로 보내고, Preview·로컬에서는 같은 앱의 /ck로 보낸다
 * (ck.zipsin.net은 아직 배포 전이라 Preview에서 누르면 실서비스로 새지 않게 한다).
 */
export function getCheckServiceHref(
  vercelEnv: string | undefined = process.env.VERCEL_ENV,
  configuredCheckUrl: string | undefined = process.env.NEXT_PUBLIC_CHECK_SITE_URL,
): string {
  // 2026-10-17: ck.zipsin.net 도메인을 연결하고 NEXT_PUBLIC_CHECK_SITE_URL을 넣기 전까지는
  // 실서비스에서도 같은 앱의 /ck로 보낸다(연결 안 된 주소로 보내는 깨진 링크 방지).
  if (vercelEnv !== 'production' || !configuredCheckUrl) return '/ck';
  return `${new URL(configuredCheckUrl).origin}/`;
}
