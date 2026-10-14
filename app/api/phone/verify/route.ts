import { NextResponse, type NextRequest } from 'next/server';
import { getPhoneVerificationProvider } from '@/features/auth/phone/runtime-provider';
import { getPhoneOtpSecret } from '@/features/auth/phone/runtime-provider';
import { createOtpDigest } from '@/features/auth/phone/otp-digest';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { challengeId, code } = (await request.json()) as {
      challengeId?: string;
      code?: string;
    };
    if (process.env.PHONE_VERIFICATION_PROVIDER === 'solapi') {
      const admin = createAdminSupabaseClient();
      const { data: status, error } = await admin.rpc('verify_phone_challenge', {
        p_user_id: data.user.id,
        p_challenge_id: challengeId ?? '',
        p_code_digest: createOtpDigest(code ?? '', challengeId ?? '', getPhoneOtpSecret()),
        p_purpose: 'signup',
      });
      if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
      if (status !== 'verified') return NextResponse.json({ error: status ?? 'not_found' }, { status: 400 });
      return NextResponse.json({ ok: true });
    }
    const provider = getPhoneVerificationProvider();
    const result = await provider.verifyCode(challengeId ?? '', code ?? '', data.user.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();
    const { data: updated, error } = await admin
      .from('phone_verification_states')
      .update({ verified_at: result.verifiedAt })
      .eq('user_id', data.user.id)
      .eq('challenge_id', challengeId ?? '')
      .is('consumed_at', null)
      .gt('expires_at', new Date().toISOString())
      .select('user_id')
      .maybeSingle();
    if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
    if (!updated) {
      return NextResponse.json({ error: 'expired_or_invalid_challenge' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const unavailable = error instanceof Error && (error.message.includes('공급자') || error.message.startsWith('sms_provider_'));
    return NextResponse.json(
      { error: unavailable ? 'provider_unavailable' : 'invalid_request' },
      { status: unavailable ? 503 : 400 },
    );
  }
}
