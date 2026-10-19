import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/features/auth/guards/require-onboarding';
import { SPACE_COOKIE } from '@/features/workspace/domain/space';

/** '이름 ▾'에서 공간을 고르면 여기로 온다. 내 사무소인지 확인한 뒤 쿠키에 남기고 홈으로 보낸다. */
export async function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get('to') ?? 'me';
  const home = new URL('/home', request.url);
  const { supabase, user } = await requireUser();
  if (to !== 'me') {
    if (!z.uuid().safeParse(to).success) return NextResponse.redirect(home);
    const { data } = await supabase.from('office_memberships').select('office_id').eq('user_id', user.id).eq('office_id', to).eq('status', 'active').is('ended_at', null).maybeSingle();
    if (!data) return NextResponse.redirect(home);
  }
  const response = NextResponse.redirect(home);
  response.cookies.set(SPACE_COOKIE, to, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 180 });
  return response;
}
