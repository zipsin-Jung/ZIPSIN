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
    production: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN === '.zipsin.net',
  });
}
