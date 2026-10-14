import { NextResponse, type NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createOtpDigest } from '@/features/auth/phone/otp-digest';
import { getPhoneOtpSecret } from '@/features/auth/phone/runtime-provider';
import { verifyPhoneAccountRecovery } from '@/features/auth/services/phone-account-recovery';

export async function POST(request: NextRequest) {
  const { challengeId, code } = await request.json() as { challengeId?: string; code?: string };
  const admin = createAdminSupabaseClient();
  const result = await verifyPhoneAccountRecovery({
    async verifyChallenge(id, submittedCode) {
      const { data: state } = await admin.from('account_recovery_challenges').select('*').eq('id', id).maybeSingle();
      if (!state) return { status: 'not_found' as const };
      if (state.consumed_at) return { status: 'used' as const };
      if (new Date(state.expires_at).getTime() <= Date.now()) return { status: 'expired' as const };
      if (state.attempts >= 5) return { status: 'attempts_exceeded' as const };
      const digest = createOtpDigest(submittedCode, id, getPhoneOtpSecret());
      if (digest !== state.code_digest) {
        await admin.from('account_recovery_challenges').update({ attempts: state.attempts + 1 }).eq('id', id).is('consumed_at', null);
        return { status: state.attempts + 1 >= 5 ? 'attempts_exceeded' as const : 'mismatch' as const };
      }
      await admin.from('account_recovery_challenges').update({ consumed_at: new Date().toISOString() }).eq('id', id).is('consumed_at', null);
      if (!state.user_id) return { status: 'verified' as const, username: null };
      const { data: identity } = await admin.from('account_usernames').select('username_normalized').eq('user_id', state.user_id).maybeSingle();
      return { status: 'verified' as const, username: identity?.username_normalized ?? null };
    },
  }, challengeId ?? '', code ?? '');
  return NextResponse.json(result, { status: result.ok ? 200 : 400, headers: { 'Cache-Control': 'no-store' } });
}
