import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getServerEnv } from '@/lib/env/server';
import {
  getRuntimeAuthCookieOptions,
  SESSION_ONLY_COOKIE,
  toPersistenceCookieOptions,
} from '@/lib/supabase/cookie-options';

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env = getServerEnv();
  const sessionOnly = request.cookies.has(SESSION_ONLY_COOKIE);
  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookieOptions: getRuntimeAuthCookieOptions(),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, toPersistenceCookieOptions(options, value, sessionOnly));
        });
      },
    },
  });

  await supabase.auth.getClaims();
  return response;
}
