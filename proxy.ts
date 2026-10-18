import { NextResponse, type NextRequest } from 'next/server';
import { isCheckHost } from '@/lib/site/check-host';
import { subSiteForHost } from '@/lib/site/sub-sites';
import { isAccountOpen } from '@/lib/site/account-launch';
import { updateSupabaseSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  // cl.zipsin.net(집신청소)·rp.zipsin.net(집신수리)은 준비 중: 첫 화면만 열고, 다른 주소는 첫 화면으로 보낸다. 계정·DB는 부르지 않는다.
  if (subSiteForHost(request.headers.get('host'))) {
    if (request.nextUrl.pathname === '/') return NextResponse.next();
    const target = request.nextUrl.clone();
    target.pathname = '/';
    target.search = '';
    return NextResponse.redirect(target, 307);
  }
  const onCheckHost = isCheckHost(request.headers.get('host'));
  // ck.zipsin.net은 주소 끝 '/ck' 없이 첫 화면에서 바로 집신체크를 보여준다(app/page.tsx).
  // 예전 주소 ck.zipsin.net/ck 로 들어오면 ck.zipsin.net 으로 옮긴다(질문 기호 뒤 값은 유지).
  if (onCheckHost && request.nextUrl.pathname === '/ck') {
    const target = request.nextUrl.clone();
    target.pathname = '/';
    return NextResponse.redirect(target, 308);
  }
  if (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/ck') return NextResponse.next();
  if (!isAccountOpen()) return closedAccountResponse(request);
  return updateSupabaseSession(request);
}

/**
 * 로그인·회원가입이 '준비 중'일 때(2026-10-17 사용자 결정): 계정·DB가 필요한 요청을 막는다.
 * 공개 홈과 집신체크는 DB 없이 열린다.
 */
// 로그인 뒤에만 쓰는 화면(app/(app)). 닫힌 상태에서는 페이지가 DB를 부르기 전에 처음 화면으로 보낸다.
const APP_PREFIXES = ['/home', '/homes', '/records', '/onboarding', '/my', '/chats', '/office', '/tasks', '/support', '/invitations'];

export function closedAccountResponse(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'account_preparing' }, { status: 503 });
  }
  if (pathname === '/auth/callback' || APP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    const target = request.nextUrl.clone();
    target.pathname = '/';
    target.search = '';
    return NextResponse.redirect(target, 307);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/ck',
    '/home/:path*',
    '/onboarding/:path*',
    '/homes/:path*',
    '/records/:path*',
    '/my/:path*',
    '/chats/:path*',
    '/office/:path*',
    '/tasks/:path*',
    '/support/:path*',
    '/invitations/:path*',
    '/signup/:path*',
    '/api/:path*',
    '/auth/callback',
  ],
};
