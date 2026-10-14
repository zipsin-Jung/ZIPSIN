import { NextResponse, type NextRequest } from 'next/server';
import { normalizeKoreanMobile, maskPhone } from '@/features/auth/schemas/verification';
import { getPhoneVerificationProvider } from '@/features/auth/phone/runtime-provider';
import { getPhoneOtpSecret, getSolapiSmsTransport } from '@/features/auth/phone/runtime-provider';
import { createOtpDigest } from '@/features/auth/phone/otp-digest';
import { randomInt, randomUUID } from 'node:crypto';
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
    if (process.env.PHONE_VERIFICATION_PROVIDER === 'solapi') {
      const challengeId = randomUUID();
      const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
      const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
      const transport = getSolapiSmsTransport();
      const sent = await transport.sendOtp({ to: phoneE164, code, expiresInMinutes: 5 });
      const { error } = await admin.rpc('issue_phone_challenge', {
        p_user_id: data.user.id,
        p_challenge_id: challengeId,
        p_phone_e164: phoneE164,
        p_code_digest: createOtpDigest(code, challengeId, getPhoneOtpSecret()),
        p_expires_at: expiresAt,
        p_provider_message_id: sent.providerMessageId,
        p_purpose: 'signup',
      });
      if (error) return NextResponse.json({ error: 'save_failed' }, { status: 500 });
      return NextResponse.json({ challengeId, expiresAt, maskedPhone: maskPhone(phoneE164) });
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
    const unavailable = error instanceof Error && (error.message.includes('공급자') || error.message === 'sms_provider_unavailable');
    return NextResponse.json(
      { error: unavailable ? 'provider_unavailable' : 'invalid_phone' },
      { status: unavailable ? 503 : 400 },
    );
  }
}
