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

/**
 * 관리자 화면·이용 통계용(서버 전용). 생성된 DB 타입에 아직 없는 새 표(site_events 등)도 쓰기 위해 타입 없는 클라이언트를 준다.
 * 사람이 보는 화면 코드(클라이언트)에서는 절대 부르지 않는다.
 */
export function createUntypedAdminClient(): import('@supabase/supabase-js').SupabaseClient {
  return createAdminSupabaseClient() as unknown as import('@supabase/supabase-js').SupabaseClient;
}
