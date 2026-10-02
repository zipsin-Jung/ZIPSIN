import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getAdminEnv } from '@/lib/env/server';
import type { Database } from '@/types/database';

export function createAdminSupabaseClient() {
  const env = getAdminEnv();
  return createClient<Database>(env.supabaseUrl, env.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
