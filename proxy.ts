import { NextResponse, type NextRequest } from 'next/server';
import { isCheckHost } from '@/lib/site/check-host';
import { updateSupabaseSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/') {
    // ck.zipsin.net opens 집신체크 on its own address (ck.zipsin.net/ck).
    // A redirect, not a rewrite: serving /ck under "/" caused a React
    // hydration mismatch in the production build.
    if (isCheckHost(request.headers.get('host'))) {
      const target = request.nextUrl.clone();
      target.pathname = '/ck';
      return NextResponse.redirect(target, 307);
    }
    return NextResponse.next();
  }
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    '/',
    '/home/:path*',
    '/onboarding/:path*',
    '/signup/:path*',
    '/api/:path*',
    '/auth/callback',
  ],
};
