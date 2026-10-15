'use client';

import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { getPublicEnv } from '@/lib/env/public';
import {
  getRuntimeAuthCookieOptions,
  SESSION_ONLY_COOKIE,
  toPersistenceCookieOptions,
} from '@/lib/supabase/cookie-options';

function readBrowserCookies() {
  return parseCookieHeader(document.cookie).map(({ name, value }) => ({ name, value: value ?? '' }));
}

export function createBrowserSupabaseClient() {
  const env = getPublicEnv();
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookieOptions: getRuntimeAuthCookieOptions(),
    // The default browser storage always writes a 400-day Max-Age on token
    // refresh. Follow the login choice so "로그인 유지" off stays session-only.
    cookies: {
      getAll: readBrowserCookies,
      setAll: (cookiesToSet) => {
        const sessionOnly = readBrowserCookies().some(({ name }) => name === SESSION_ONLY_COOKIE);
        cookiesToSet.forEach(({ name, value, options }) => {
          document.cookie = serializeCookieHeader(name, value, toPersistenceCookieOptions(options, value, sessionOnly));
        });
      },
    },
  });
}
