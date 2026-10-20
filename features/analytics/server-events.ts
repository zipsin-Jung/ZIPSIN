import 'server-only';
import { headers } from 'next/headers';
import { createUntypedAdminClient } from '@/lib/supabase/admin';
import { siteOf } from '@/lib/site/site-of';

/** 서버에서 일어난 일(로그인 등)을 이용 통계에 남긴다. 누가 했는지는 남기지 않는다. 실패해도 진행. */
export async function recordServerEvent(event: 'login' | 'signup_complete', path: string) {
  try {
    const host = (await headers()).get('host');
    await createUntypedAdminClient().from('site_events').insert({ site: siteOf(host, path), event, path, logged_in: true });
  } catch {
    // 무시
  }
}
