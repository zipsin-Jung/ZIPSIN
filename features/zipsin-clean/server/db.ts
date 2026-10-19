import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * 집신청소 표는 types/database.ts(자동 생성 타입)에 아직 없다. 운영 DB 적용 뒤 타입을 다시 만들면 이 감싸기를 없앤다.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CleanDb = SupabaseClient<any, 'public', any>;
export async function cleanSessionDb(): Promise<CleanDb> {
  return (await createServerSupabaseClient()) as unknown as CleanDb;
}
/** service_role. 예약 만들기(서버가 계산한 가격 넣기)에만 쓴다. */
export function cleanAdminDb(): CleanDb {
  return createAdminSupabaseClient() as unknown as CleanDb;
}
