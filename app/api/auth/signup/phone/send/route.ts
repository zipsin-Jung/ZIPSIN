import { randomInt, randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createOtpDigest } from '@/features/auth/phone/otp-digest';
import { getPhoneOtpSecret, getSolapiSmsTransport } from '@/features/auth/phone/runtime-provider';
import { getOrCreateSignupIntent } from '@/features/auth/server/signup-intent';
import { reserveSmsSend, type SmsRateLimitAdmin } from '@/features/auth/server/sms-rate-limit';
import { sendAnonymousSignupPhoneCode } from '@/features/auth/services/anonymous-signup-phone';
import { normalizeKoreanMobile } from '@/features/auth/schemas/verification';

const noStore = { 'Cache-Control': 'no-store' };

export async function POST(request: NextRequest) {
  let phone: string;
  try {
    const body = await request.json() as { phone?: string };
    phone = body.phone ?? '';
    normalizeKoreanMobile(phone);
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_phone' }, { status: 400, headers: noStore });
  }
  try {
    const intent = await getOrCreateSignupIntent();
    const challengeId = randomUUID();
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
    const admin = createAdminSupabaseClient();
    const result = await sendAnonymousSignupPhoneCode({
      allowSend: (phoneE164, intentDigest) => reserveSmsSend(
        admin as unknown as SmsRateLimitAdmin,
        phoneE164,
        intentDigest,
      ),
      async issue(input) {
        const { error } = await admin.rpc('issue_anonymous_signup_phone_challenge' as never, {
          p_id: input.challengeId,
          p_intent_digest: input.intentDigest,
          p_phone_e164: input.phoneE164,
          p_code_digest: input.codeDigest,
          p_expires_at: input.expiresAt,
          p_provider_message_id: null,
        } as never);
        if (error) throw error;
      },
      send: (input) => getSolapiSmsTransport().sendOtp(input),
      async markDelivery(id, status, providerMessageId) {
        const { error } = await admin.from('anonymous_signup_phone_challenges' as never)
          .update({ delivery_status: status, provider_message_id: providerMessageId } as never)
          .eq('id', id);
        if (error) throw error;
      },
    }, {
      phone: phone ?? '',
      intentDigest: intent.digest,
      challengeId,
      code,
      codeDigest: createOtpDigest(code, challengeId, getPhoneOtpSecret()),
      expiresAt,
    });
    const status = result.ok ? 200 : result.error === 'rate_limited' ? 429 : 503;
    return NextResponse.json(result, { status, headers: noStore });
  } catch {
    return NextResponse.json({ ok: false, error: 'temporarily_unavailable' }, { status: 503, headers: noStore });
  }
}
