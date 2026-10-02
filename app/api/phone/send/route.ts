import { NextResponse, type NextRequest } from 'next/server';
import { normalizeKoreanMobile, maskPhone } from '@/features/auth/schemas/verification';
import { getPhoneVerificationProvider } from '@/features/auth/phone/runtime-provider';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { phone } = (await request.json()) as { phone?: string };
    const phoneE164 = normalizeKoreanMobile(phone ?? '');
    const admin = createAdminSupabaseClient();
    const { data: previous } = await admin
      .from('phone_verification_states')
      .select('sent_at')
      .eq('user_id', data.user.id)
      .maybeSingle();
    if (previous && Date.now() - new Date(previous.sent_at).getTime() < 60_000) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }
    const provider = getPhoneVerificationProvider();
    const challenge = await provider.sendCode(phoneE164, data.user.id);
    const { error: saveError } = await admin.from('phone_verification_states').upsert({
      user_id: data.user.id,
      challenge_id: challenge.id,
      phone_e164: phoneE164,
      sent_at: new Date().toISOString(),
      expires_at: challenge.expiresAt,
      verified_at: null,
      consumed_at: null,
    });
    if (saveError) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
    return NextResponse.json({
      challengeId: challenge.id,
      expiresAt: challenge.expiresAt,
      maskedPhone: maskPhone(phoneE164),
      developmentCode: process.env.NODE_ENV === 'development' ? challenge.developmentCode : undefined,
    });
  } catch (error) {
    const unavailable = error instanceof Error && error.message.includes('공급자');
    return NextResponse.json(
      { error: unavailable ? 'provider_unavailable' : 'invalid_phone' },
      { status: unavailable ? 503 : 400 },
    );
  }
}
