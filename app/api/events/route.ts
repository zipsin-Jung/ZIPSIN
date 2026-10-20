import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createUntypedAdminClient } from '@/lib/supabase/admin';
import { cleanPath, siteOf } from '@/lib/site/site-of';

const schema = z.object({
  path: z.string().min(1).max(500),
  visitorId: z.uuid().nullable().optional(),
  sessionId: z.uuid().nullable().optional(),
  loggedIn: z.boolean().optional(),
});

/** 화면을 본 기록(이용 통계). 사람을 알아볼 정보(IP·이름·연락처)는 저장하지 않는다. 실패해도 화면에는 영향 없음. */
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = JSON.parse(await request.text()); } catch { return new NextResponse(null, { status: 204 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return new NextResponse(null, { status: 204 });
  const path = cleanPath(parsed.data.path);
  if (path.startsWith('/api') || path.startsWith('/admin') || path.startsWith('/_next')) return new NextResponse(null, { status: 204 });
  try {
    await createUntypedAdminClient().from('site_events').insert({
      site: siteOf(request.headers.get('host'), path),
      event: 'page_view',
      path,
      visitor_id: parsed.data.visitorId ?? null,
      session_id: parsed.data.sessionId ?? null,
      logged_in: parsed.data.loggedIn ?? false,
    });
  } catch {
    // 통계는 없어도 서비스는 돌아가야 한다.
  }
  return new NextResponse(null, { status: 204 });
}
