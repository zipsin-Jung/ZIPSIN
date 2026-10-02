'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  completeSignupWithRepository,
  type SignupRepository,
} from '@/features/auth/services/complete-signup';
import { signupSchema } from '@/features/auth/schemas/verification';

export async function completeSignup(rawInput: unknown) {
  const parsed = signupSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false as const, error: 'invalid_input' as const };

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false as const, error: 'unauthorized' as const };

  const repository: SignupRepository = {
    async getVerifiedPhone(userId, challengeId) {
      const { data: phone } = await supabase
        .from('phone_verification_states')
        .select('phone_e164, verified_at')
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .maybeSingle();
      return phone
        ? { phoneE164: phone.phone_e164, verifiedAt: phone.verified_at }
        : null;
    },
    async saveSignup(input) {
      const { error } = await supabase.rpc('complete_signup', {
        p_display_name: input.displayName,
        p_email: input.email,
        p_challenge_id: parsed.data.challengeId,
        p_terms_version: input.termsVersion,
        p_privacy_version: input.privacyVersion,
        p_marketing_sms: input.marketingSmsAccepted,
        p_marketing_email: input.marketingEmailAccepted,
      });
      if (error) throw error;
    },
  };

  return completeSignupWithRepository(repository, data.user.id, parsed.data);
}
