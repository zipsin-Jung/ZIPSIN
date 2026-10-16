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
    const { phone, name } = await request.json() as { phone?: string; name?: string };
    const phoneE164 = normalizeKoreanMobile(phone ?? '');
    const personName = typeof name === 'string' ? name.slice(0, 40) : '';
    const challengeId = randomUUID();
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
    const admin = createAdminSupabaseClient();
    if (!await reserveSmsSend(admin as unknown as SmsRateLimitAdmin, phoneE164)) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: { 'Cache-Control': 'no-store' } });
    }
    const result = await startPhoneAccountRecovery({
      async findAccountByPhone(value) {
        const { data, error } = await admin.from('profiles').select('user_id, display_name').eq('phone_e164', value).not('phone_verified_at', 'is', null).limit(2);
        if (error) throw error;
        if (data?.length !== 1) return null;
        return { userId: data[0].user_id, name: data[0].display_name ?? null };
      },
      async sendOtp(input) { return getSolapiSmsTransport().sendOtp(input); },
      async saveChallenge(input) {
        const { error } = await admin.rpc('issue_account_recovery_challenge', {
          p_id: input.challengeId, p_phone_e164: input.phoneE164, p_user_id: input.userId,
          p_code_digest: input.digest, p_expires_at: input.expiresAt,
        });
        if (error) throw error;
      },
    }, { name: personName, phoneE164 }, { code, challengeId, expiresAt, digest: createOtpDigest(code, challengeId, getPhoneOtpSecret()) });
    if (!result.ok) return NextResponse.json(result, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const detail = error as { code?: string; message?: string };
    console.error('recovery_sms_failed', { code: detail?.code ?? null, message: detail?.message?.slice(0, 160) ?? null });
    return NextResponse.json({ error: 'temporarily_unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
