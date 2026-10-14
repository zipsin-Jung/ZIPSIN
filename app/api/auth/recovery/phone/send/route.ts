import { randomInt, randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createOtpDigest } from '@/features/auth/phone/otp-digest';
import { getPhoneOtpSecret, getSolapiSmsTransport } from '@/features/auth/phone/runtime-provider';
import { normalizeKoreanMobile } from '@/features/auth/schemas/verification';
import { startPhoneAccountRecovery } from '@/features/auth/services/phone-account-recovery';
import { reserveSmsSend, type SmsRateLimitAdmin } from '@/features/auth/server/sms-rate-limit';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json() as { phone?: string };
    const phoneE164 = normalizeKoreanMobile(phone ?? '');
    const challengeId = randomUUID();
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
    const admin = createAdminSupabaseClient();
    if (!await reserveSmsSend(admin as unknown as SmsRateLimitAdmin, phoneE164)) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: { 'Cache-Control': 'no-store' } });
    }
    const result = await startPhoneAccountRecovery({
      async findAccountByPhone(value) {
        const { data } = await admin.from('profiles').select('user_id').eq('phone_e164', value).not('phone_verified_at', 'is', null).limit(2);
        return data?.length === 1 ? { userId: data[0].user_id } : null;
      },
      async sendOtp(input) { return getSolapiSmsTransport().sendOtp(input); },
      async saveChallenge(input) {
        const { error } = await admin.rpc('issue_account_recovery_challenge', {
          p_id: input.challengeId, p_phone_e164: input.phoneE164, p_user_id: input.userId,
          p_code_digest: input.digest, p_expires_at: input.expiresAt,
        });
        if (error) throw error;
      },
    }, phoneE164, { code, challengeId, expiresAt, digest: createOtpDigest(code, challengeId, getPhoneOtpSecret()) });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'temporarily_unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
