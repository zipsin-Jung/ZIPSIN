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
