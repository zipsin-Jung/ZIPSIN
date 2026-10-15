const ALLOWED_PATHS = ['/ck', '/my/candidates', '/onboarding/tenant'] as const;

function allowed(pathname: string): boolean {
  return ALLOWED_PATHS.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

export function getSafeReturnPath(value: string | null, fallback = '/ck'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  try {
    const url = new URL(value, 'https://zipsin.invalid');
    if (url.origin !== 'https://zipsin.invalid' || !allowed(url.pathname)) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
