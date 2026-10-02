import { NextResponse, type NextRequest } from 'next/server';
import { sanitizeNextPath } from '@/features/auth/domain/redirect';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function loginError(request: NextRequest, code: string) {
  return NextResponse.redirect(new URL(`/login?error=${code}`, request.url));
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return loginError(request, 'oauth_missing_code');
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return loginError(request, 'oauth_exchange_failed');
  }

  const next = sanitizeNextPath(request.nextUrl.searchParams.get('next'));
  return NextResponse.redirect(new URL(next, request.url));
}
