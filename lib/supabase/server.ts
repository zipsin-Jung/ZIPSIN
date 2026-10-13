import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getServerEnv } from '@/lib/env/server';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const env = getServerEnv();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
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
