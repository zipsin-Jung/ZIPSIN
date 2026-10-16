import { randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createOtpDigest } from '@/features/auth/phone/otp-digest';
import { getPhoneOtpSecret } from '@/features/auth/phone/runtime-provider';
import { digestRecoveryToken, RECOVERY_COOKIE } from '@/features/auth/server/recovery-session';

export async function POST(request: NextRequest) {
  const { challengeId, code } = await request.json() as { challengeId?: string; code?: string };
  const admin = createAdminSupabaseClient();
  const digest = createOtpDigest(code ?? '', challengeId ?? '', getPhoneOtpSecret());
  const { data, error } = await admin.rpc('verify_account_recovery_challenge', { p_id: challengeId ?? '', p_code_digest: digest });
  if (error) {
    console.error('recovery_verify_failed', { code: error.code ?? null, message: error.message?.slice(0, 160) ?? null });
    return NextResponse.json({ ok: false, error: 'temporarily_unavailable' }, { status: 503 });
  }
  const state = Array.isArray(data) ? data[0] : data;
  if (!state || state.status !== 'verified') return NextResponse.json({ ok: false, error: state?.status ?? 'not_found' }, { status: 400 });
  if (!state.user_id) return NextResponse.json({ ok: true, username: null }, { headers: { 'Cache-Control': 'no-store' } });
  const token = randomBytes(32).toString('base64url');
  const { error: sessionError } = await admin.from('account_recovery_sessions').insert({
    token_digest: digestRecoveryToken(token), user_id: state.user_id,
    expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
  });
  if (sessionError) console.error('recovery_session_failed', { code: sessionError.code ?? null, message: sessionError.message?.slice(0, 160) ?? null });
  if (sessionError) return NextResponse.json({ ok: false, error: 'temporarily_unavailable' }, { status: 503 });
  const { data: identity } = await admin.from('account_usernames').select('username_normalized').eq('user_id', state.user_id).maybeSingle();
  const response = NextResponse.json({ ok: true, username: identity?.username_normalized ?? null, resetReady: true }, { headers: { 'Cache-Control': 'no-store' } });
  response.cookies.set(RECOVERY_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/reset-password', maxAge: 600 });
  return response;
}
