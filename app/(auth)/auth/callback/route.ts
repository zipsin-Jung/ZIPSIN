import { NextResponse, type NextRequest } from 'next/server';
import { sanitizeNextPath } from '@/features/auth/domain/redirect';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function loginError(request: NextRequest, code: string, next: string) {
  const query = new URLSearchParams({ error: code, next });
  return NextResponse.redirect(new URL(`/login?${query}`, request.url));
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = sanitizeNextPath(request.nextUrl.searchParams.get('next'));
  if (!code) {
    return loginError(request, 'oauth_missing_code', next);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return loginError(request, 'oauth_exchange_failed', next);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
