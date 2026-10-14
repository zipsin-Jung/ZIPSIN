'use server';

import { randomBytes } from 'node:crypto';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createRateLimitKey, getRateLimitSecret } from '@/features/auth/domain/rate-limit-key';
import { sanitizeNextPath } from '@/features/auth/domain/redirect';
import { clearSignupIntent, getSignupIntent } from '@/features/auth/server/signup-intent';
import { verifiedPasswordSignupSchema } from '@/features/auth/schemas/password-signup';
import { registerVerifiedPasswordAccount } from '@/features/auth/services/register-verified-password-account';

export type VerifiedSignupActionState = {
  error?: string;
  field?: 'signup-username' | 'signup-password' | 'signup-password-confirm' | 'signup-email' | 'signup-phone' | 'signup-form-error';
};

function signupPath(code: string, next: string, hasNext: boolean) {
  return `/signup?${code}${hasNext ? `&next=${encodeURIComponent(next)}` : ''}`;
}

export async function registerVerifiedPasswordAccountAction(
  _previousState: VerifiedSignupActionState,
  formData: FormData,
): Promise<VerifiedSignupActionState> {
  const rawNext = formData.get('next');
  const hasNext = typeof rawNext === 'string' && rawNext.length > 0;
  const next = sanitizeNextPath(hasNext ? rawNext : undefined);
  const parsed = verifiedPasswordSignupSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
    passwordConfirm: formData.get('passwordConfirm'),
    email: formData.get('email'),
    challengeId: formData.get('challengeId'),
    termsAccepted: formData.get('termsAccepted') === 'on',
    privacyAccepted: formData.get('privacyAccepted') === 'on',
  });
  if (!parsed.success) {
    const invalidField = parsed.error.issues[0]?.path[0];
    const field = invalidField === 'username' ? 'signup-username'
      : invalidField === 'password' ? 'signup-password'
        : invalidField === 'passwordConfirm' ? 'signup-password-confirm'
          : invalidField === 'email' ? 'signup-email'
            : 'signup-form-error';
    return { error: invalidField === 'passwordConfirm' ? '비밀번호가 서로 다릅니다.' : '입력한 내용을 다시 확인해 주세요.', field };
  }

  const intent = await getSignupIntent();
  if (!intent) return { error: '휴대폰 인증을 다시 완료해 주세요.', field: 'signup-phone' };

  let admin: ReturnType<typeof createAdminSupabaseClient>;
  let secret: string;
  try {
    admin = createAdminSupabaseClient();
    secret = getRateLimitSecret();
  } catch {
    return { error: '가입 설정을 확인하고 있습니다. 잠시 후 다시 시도해 주세요.', field: 'signup-form-error' };
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get('x-vercel-forwarded-for')
    ?? requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown-origin';
  const limits = [
    { scope: 'verified_signup_origin', key: origin, limit: 10 },
    { scope: 'verified_signup_email', key: parsed.data.email, limit: 3 },
    { scope: 'verified_signup_username', key: parsed.data.username, limit: 3 },
  ] as const;
  for (const limit of limits) {
    const { data, error } = await admin.rpc('consume_auth_rate_limit', {
      p_scope: limit.scope,
      p_key: createRateLimitKey(limit.key, secret),
      p_limit: limit.limit,
      p_window_seconds: 3600,
    });
    if (error || data !== true) return { error: '요청이 많습니다. 잠시 후 다시 시도해 주세요.', field: 'signup-form-error' };
  }

  const claimToken = randomBytes(32).toString('base64url');
  const claimDigest = createRateLimitKey(`signup-claim:${claimToken}`, secret);
  const supabase = await createServerSupabaseClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const result = await registerVerifiedPasswordAccount({
    async claimPhoneProof(input) {
      const { data, error } = await admin.rpc('claim_anonymous_signup_phone_challenge' as never, {
        p_id: input.challengeId,
        p_intent_digest: input.intentDigest,
        p_claim_digest: input.claimDigest,
        // Keep the claim beyond the five-minute OTP lifetime so an interrupted
        // compensation cannot reopen the same proof before the proof expires.
        p_claim_expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
      } as never);
      const claimedPhone = data as unknown;
      return !error && typeof claimedPhone === 'string' && claimedPhone.length > 0;
    },
    async createAuthUser(input) {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
          data: { username: input.username },
        },
      });
      if (data.user?.identities?.length === 0 || error?.code === 'user_already_exists') {
        return { error: 'account_unavailable' as const };
      }
      if (error || !data.user) return { error: 'service_unavailable' as const };
      return { userId: data.user.id, sessionCreated: Boolean(data.session) };
    },
    async finalizeSignup(input) {
      const { error } = await admin.rpc('finalize_verified_password_signup' as never, {
        p_user_id: input.userId,
        p_id: input.challengeId,
        p_intent_digest: input.intentDigest,
        p_claim_digest: input.claimDigest,
        p_username: input.username,
        p_email: input.email,
        p_display_name: input.displayName,
        p_terms_version: '2026-10-02',
        p_privacy_version: '2026-10-02',
        p_source: input.source,
      } as never);
      if (!error) return 'ok' as const;
      const detail = `${error.code ?? ''} ${error.message ?? ''} ${error.details ?? ''}`.toLowerCase();
      if (detail.includes('phone_already_registered')) return 'phone_unavailable' as const;
      if (detail.includes('account_usernames') || detail.includes('username')) return 'username_unavailable' as const;
      return 'service_unavailable' as const;
    },
    async releaseClaim(input) {
      const { data, error } = await admin.rpc('release_anonymous_signup_phone_claim' as never, {
        p_id: input.challengeId,
        p_intent_digest: input.intentDigest,
        p_claim_digest: input.claimDigest,
      } as never);
      return !error && data === true;
    },
    async deleteAuthUser(userId) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      return !error;
    },
    async isolatePhoneProof(input) {
      const { data, error } = await admin.rpc('isolate_anonymous_signup_phone_challenge' as never, {
        p_id: input.challengeId,
        p_intent_digest: input.intentDigest,
        p_claim_digest: input.claimDigest,
      } as never);
      return !error && data === true;
    },
    async queueCleanup(userId) {
      const { error } = await admin.from('auth_cleanup_queue').insert({
        user_id: userId,
        reason: 'verified_signup_finalize_compensation_failed',
      });
      if (error) console.error('auth_cleanup_queue_insert_failed', { userId });
      return !error;
    },
  }, {
    ...parsed.data,
    intentDigest: intent.digest,
    claimDigest,
    displayName: parsed.data.username,
    next,
  });

  if (!result.ok) {
    if (result.error === 'phone_not_verified') return { error: '휴대폰 인증을 다시 완료해 주세요.', field: 'signup-phone' };
    if (result.error === 'email_unavailable') return { error: '이 이메일로는 지금 가입할 수 없습니다.', field: 'signup-email' };
    if (result.error === 'username_unavailable') return { error: '아이디를 다시 확인해 주세요.', field: 'signup-username' };
    if (result.error === 'phone_unavailable') return { error: '휴대폰 번호를 다시 확인해 주세요.', field: 'signup-phone' };
    return { error: '지금 가입을 완료할 수 없습니다. 잠시 후 다시 시도해 주세요.', field: 'signup-form-error' };
  }
  await clearSignupIntent();
  redirect(result.sessionCreated ? next : signupPath('notice=check_email', next, hasNext));
}
