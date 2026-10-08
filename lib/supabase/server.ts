import 'server-only';
import {createClient} from '@supabase/supabase-js';

export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  return createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false}});
}
