import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getServerEnv } from '@/lib/env/server';
import {
  getRuntimeAuthCookieOptions,
  SESSION_ONLY_COOKIE,
  toPersistenceCookieOptions,
} from '@/lib/supabase/cookie-options';

export async function createServerSupabaseClient(options: { sessionOnly?: boolean } = {}) {
  const cookieStore = await cookies();
  const env = getServerEnv();

  const authCookieOptions = getRuntimeAuthCookieOptions();
  // An explicit login choice updates the marker; every other server client
  // follows the marker so later token refreshes keep the same persistence.
  if (options.sessionOnly !== undefined) {
    try {
      if (options.sessionOnly) {
        // Readable by the browser client on purpose: it holds no account data.
        cookieStore.set(SESSION_ONLY_COOKIE, '1', authCookieOptions);
      } else {
        cookieStore.delete({ name: SESSION_ONLY_COOKIE, ...authCookieOptions });
      }
    } catch {
      // Server Components cannot write cookies; login runs in a Server Action.
    }
  }
  const sessionOnly = options.sessionOnly ?? cookieStore.has(SESSION_ONLY_COOKIE);

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookieOptions: authCookieOptions,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
            cookieStore.set(name, value, toPersistenceCookieOptions(cookieOptions, value, sessionOnly));
          });
        } catch {
          // Server Components cannot write cookies. The proxy refreshes sessions.
        }
      },
    },
  });
}

// Compatibility name used by the ZIPSIN Check server modules while both
// products converge on the single primary Supabase client factory.
export const createSupabaseServerClient = createServerSupabaseClient;
