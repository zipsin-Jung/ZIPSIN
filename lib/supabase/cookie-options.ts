export type AuthCookieOptions = {
  domain?: string;
  path: '/';
  secure?: true;
  sameSite: 'lax';
};

export function getAuthCookieOptions({ production }: { production: boolean }): AuthCookieOptions {
  return production
    ? { domain: '.zipsin.net', path: '/', secure: true, sameSite: 'lax' }
    : { path: '/', sameSite: 'lax' };
}

export function getRuntimeAuthCookieOptions(): AuthCookieOptions {
  return getAuthCookieOptions({
    production:
      process.env.VERCEL_ENV === 'production'
      && process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN === '.zipsin.net',
  });
}

// Browser-session marker for users who unchecked "로그인 유지".
// It carries no account data and is readable by browser code on purpose;
// it only tells server, proxy and browser token refreshes to keep auth
// cookies as browser-session cookies so they disappear when the browser closes.
export const SESSION_ONLY_COOKIE = 'zipsin-session-only';

export function toPersistenceCookieOptions<T extends { maxAge?: number; expires?: Date }>(
  options: T,
  value: string,
  sessionOnly: boolean,
): Omit<T, 'maxAge' | 'expires'> | T {
  const isDeletion = value === '' || options.maxAge === 0;
  if (!sessionOnly || isDeletion) return options;
  const { maxAge: _maxAge, expires: _expires, ...sessionOptions } = options;
  return sessionOptions;
}
