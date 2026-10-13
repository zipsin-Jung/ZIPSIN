import {NextResponse} from 'next/server';
import {getSafeReturnPath} from '@/features/auth/domain/return-path';
import {createSupabaseServerClient} from '@/lib/supabase/server';

export async function GET(request:Request){
  const url=new URL(request.url);
  const returnTo=getSafeReturnPath(url.searchParams.get('returnTo'));
  if(url.searchParams.get('error'))return NextResponse.redirect(new URL('/ck?auth=cancelled',url.origin));
  const code=url.searchParams.get('code');
  if(!code)return NextResponse.redirect(new URL(`/login?error=missing_code&returnTo=${encodeURIComponent(returnTo)}`,url.origin));
  const supabase=await createSupabaseServerClient();
  const {error}=await supabase.auth.exchangeCodeForSession(code);
  if(error)return NextResponse.redirect(new URL(`/login?error=exchange_failed&returnTo=${encodeURIComponent(returnTo)}`,url.origin));
  return NextResponse.redirect(new URL(`/onboarding/tenant?returnTo=${encodeURIComponent(returnTo)}`,url.origin));
}
