import { randomInt, randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createOtpDigest } from '@/features/auth/phone/otp-digest';
import { getPhoneOtpSecret, getSolapiSmsTransport } from '@/features/auth/phone/runtime-provider';
import { normalizeKoreanMobile } from '@/features/auth/schemas/verification';
import { startPhoneAccountRecovery } from '@/features/auth/services/phone-account-recovery';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json() as { phone?: string };
    const phoneE164 = normalizeKoreanMobile(phone ?? '');
    const challengeId = randomUUID();
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
    const admin = createAdminSupabaseClient();
    const result = await startPhoneAccountRecovery({
      async findAccountByPhone(value) {
        const { data } = await admin.from('profiles').select('user_id').eq('phone_e164', value).not('phone_verified_at', 'is', null).limit(2);
        return data?.length === 1 ? { userId: data[0].user_id } : null;
      },
      async sendOtp(input) { return getSolapiSmsTransport().sendOtp(input); },
      async saveChallenge(input) {
        const { error } = await admin.from('account_recovery_challenges').insert({
          id: input.challengeId, phone_e164: input.phoneE164, user_id: input.userId,
          code_digest: input.digest, expires_at: input.expiresAt, provider_message_id: input.providerMessageId,
        });
        if (error) throw error;
      },
    }, phoneE164, { code, challengeId, expiresAt, digest: createOtpDigest(code, challengeId, getPhoneOtpSecret()) });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'temporarily_unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
