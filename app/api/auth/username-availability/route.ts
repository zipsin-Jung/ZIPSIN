import { NextResponse, type NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { checkUsernameAvailability } from '@/features/auth/services/check-username-availability';

export async function POST(request: NextRequest) {
  let username = '';
  try {
    const body = await request.json() as { username?: unknown };
    username = typeof body.username === 'string' ? body.username : '';
  } catch {
    username = '';
  }

  const result = await checkUsernameAvailability({
    async findUsername(normalized) {
      const admin = createAdminSupabaseClient();
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
