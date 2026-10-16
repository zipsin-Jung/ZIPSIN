import { NextResponse, type NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createRateLimitKey, getRateLimitSecret } from '@/features/auth/domain/rate-limit-key';
import { findUsernameByEmail } from '@/features/auth/services/find-username-by-email';
import { getRequestOrigin } from '@/features/auth/server/request-origin';

const NO_STORE = { 'Cache-Control': 'no-store' };

/** 아이디 찾기: 이메일을 넣으면 가린 아이디를 바로 돌려준다(시안 ⑧, 2026-10-16 승인). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as { email?: unknown };
    const admin = createAdminSupabaseClient();
    const secret = getRateLimitSecret();
    const result = await findUsernameByEmail({
      async allowAttempt(scope, key) {
        const { data, error } = await admin.rpc('consume_auth_rate_limit', {
          p_scope: scope,
          p_key: createRateLimitKey(key, secret),
          p_limit: scope === 'username_lookup_origin' ? 20 : 5,
          p_window_seconds: 3600,
        });
        return !error && data === true;
      },
      async findUsernamesByEmail(email) {
        const { data: profiles, error } = await admin.from('profiles')
          .select('user_id').eq('email', email).limit(5);
        if (error) throw error;
        const ids = (profiles ?? []).map((row) => row.user_id);
        if (ids.length === 0) return [];
        const { data: names, error: nameError } = await admin.from('account_usernames')
          .select('username_normalized, created_at').in('user_id', ids).eq('status', 'active');
        if (nameError) throw nameError;
        return (names ?? []).map((row) => ({ username: String(row.username_normalized), createdAt: row.created_at ?? null }));
      },
    }, { email: body.email, origin: await getRequestOrigin() });

    const status = result.status === 'rate_limited' ? 429 : result.status === 'invalid_email' ? 400 : 200;
    return NextResponse.json(result, { status, headers: NO_STORE });
  } catch (error) {
    // 이메일 등 개인정보는 남기지 않고 원인 코드만 남긴다.
    const detail = error as { code?: string; message?: string };
    console.error('username_lookup_failed', { code: detail?.code ?? null, message: detail?.message?.slice(0, 160) ?? null });
    return NextResponse.json({ status: 'temporarily_unavailable' }, { status: 503, headers: NO_STORE });
  }
}
