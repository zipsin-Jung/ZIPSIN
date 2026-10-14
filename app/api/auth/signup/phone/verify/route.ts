import { NextResponse, type NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createOtpDigest } from '@/features/auth/phone/otp-digest';
import { getPhoneOtpSecret } from '@/features/auth/phone/runtime-provider';
import { getSignupIntent } from '@/features/auth/server/signup-intent';
import { verifyAnonymousSignupPhoneCode } from '@/features/auth/services/anonymous-signup-phone';

const noStore = { 'Cache-Control': 'no-store' };

export async function POST(request: NextRequest) {
  try {
    const intent = await getSignupIntent();
    if (!intent) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 400, headers: noStore });
    const { challengeId, code } = await request.json() as { challengeId?: string; code?: string };
    const admin = createAdminSupabaseClient();
    const result = await verifyAnonymousSignupPhoneCode({
      async verify(input) {
        const { data, error } = await admin.rpc('verify_anonymous_signup_phone_challenge' as never, {
          p_id: input.challengeId,
          p_intent_digest: input.intentDigest,
          p_code_digest: input.codeDigest,
        } as never);
        if (error) throw error;
        return typeof data === 'string' ? data : 'not_found';
      },
    }, {
      challengeId: challengeId ?? '',
      intentDigest: intent.digest,
      codeDigest: createOtpDigest(code ?? '', challengeId ?? '', getPhoneOtpSecret()),
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: noStore });
  } catch {
    return NextResponse.json({ ok: false, error: 'temporarily_unavailable' }, { status: 503, headers: noStore });
  }
}
