import 'server-only';

import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {readServerEnv} from '@/lib/env/server';

export async function createSupabaseServerClient() {
  const env = readServerEnv();
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({name, value, options}) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies; Proxy refreshes them.
        }
      },
    },
  });
}
