import { NextResponse, type NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { checkUsernameAvailability } from '@/features/auth/services/check-username-availability';
import { headers } from 'next/headers';
import { createRateLimitKey, getRateLimitSecret } from '@/features/auth/domain/rate-limit-key';

export async function POST(request: NextRequest) {
  let username = '';
  try {
    const body = await request.json() as { username?: unknown };
    username = typeof body.username === 'string' ? body.username : '';
  } catch {
    username = '';
  }

  const admin = createAdminSupabaseClient();
  try {
    const requestHeaders = await headers();
    const origin = requestHeaders.get('x-vercel-forwarded-for') ?? requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown-origin';
    for (const [scope, key, limit] of [['username_check_origin', origin, 60], ['username_check_value', username.trim().toLowerCase(), 10]] as const) {
      const { data, error } = await admin.rpc('consume_auth_rate_limit', { p_scope: scope, p_key: createRateLimitKey(key, getRateLimitSecret()), p_limit: limit, p_window_seconds: 3600 });
      if (error) throw error;
      if (data !== true) return NextResponse.json({ status: 'rate_limited' }, { status: 429, headers: { 'Cache-Control': 'no-store' } });
    }
  } catch {
    return NextResponse.json({ status: 'temporarily_unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  const result = await checkUsernameAvailability({
    async findUsername(normalized) {
      const { data, error } = await admin
        .from('account_usernames')
        .select('user_id')
        .eq('username_normalized', normalized)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  }, username);

  return NextResponse.json(result, {
    status: result.status === 'temporarily_unavailable' ? 503 : 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
