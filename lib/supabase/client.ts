'use client';

import { createBrowserClient } from '@supabase/ssr';
import { getPublicEnv } from '@/lib/env/public';
import { getRuntimeAuthCookieOptions } from '@/lib/supabase/cookie-options';

export function createBrowserSupabaseClient() {
  const env = getPublicEnv();
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookieOptions: getRuntimeAuthCookieOptions(),
  });
}
