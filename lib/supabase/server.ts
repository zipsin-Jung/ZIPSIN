import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getServerEnv } from '@/lib/env/server';
import { getRuntimeAuthCookieOptions } from '@/lib/supabase/cookie-options';

export async function createServerSupabaseClient(options: { sessionOnly?: boolean } = {}) {
  const cookieStore = await cookies();
  const env = getServerEnv();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookieOptions: getRuntimeAuthCookieOptions(),
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
            if (options.sessionOnly) {
              const { expires: _expires, maxAge: _maxAge, ...sessionOptions } = cookieOptions;
              cookieStore.set(name, value, sessionOptions);
              return;
            }
            cookieStore.set(name, value, cookieOptions);
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
