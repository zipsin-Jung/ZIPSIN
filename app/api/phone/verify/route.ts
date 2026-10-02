import { NextResponse, type NextRequest } from 'next/server';
import { getPhoneVerificationProvider } from '@/features/auth/phone/runtime-provider';
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
    const unavailable = error instanceof Error && error.message.includes('공급자');
    return NextResponse.json(
      { error: unavailable ? 'provider_unavailable' : 'invalid_request' },
      { status: unavailable ? 503 : 400 },
    );
  }
}
