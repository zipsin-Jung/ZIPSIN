'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { passwordSignupSchema } from '@/features/auth/schemas/password-signup';
import { registerPasswordAccount } from '@/features/auth/services/register-password-account';
import { createRateLimitKey, getRateLimitSecret } from '@/features/auth/domain/rate-limit-key';
import { sanitizeNextPath } from '@/features/auth/domain/redirect';

export async function registerPasswordAccountAction(formData: FormData) {
  const rawNext = formData.get('next');
  const hasNext = typeof rawNext === 'string' && rawNext.length > 0;
  const next = sanitizeNextPath(hasNext ? rawNext : undefined);
  const isCheckSignup = next === '/ck' || next.startsWith('/ck/');
  const verifyPath = hasNext ? `/signup/verify?next=${encodeURIComponent(next)}` : '/signup/verify';
  const completionPath = isCheckSignup ? next : verifyPath;
  const parsed = passwordSignupSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
    passwordConfirm: formData.get('passwordConfirm'),
    email: formData.get('email'),
    termsAccepted: formData.get('termsAccepted') === 'on',
    privacyAccepted: formData.get('privacyAccepted') === 'on',
  });

  if (!parsed.success) redirect('/signup?error=invalid_input');

  const supabase = await createServerSupabaseClient();
  let admin: ReturnType<typeof createAdminSupabaseClient>;
  let rateLimitSecret: string;
  try {
    admin = createAdminSupabaseClient();
    rateLimitSecret = getRateLimitSecret();
  } catch {
    redirect(`/signup?error=service_unavailable${hasNext ? `&next=${encodeURIComponent(next)}` : ''}`);
  }
  const requestHeaders = await headers();
  const origin = requestHeaders.get('x-vercel-forwarded-for')
    ?? requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown-origin';
  let sessionCreated = false;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  async function deleteCreatedUser(userId: string) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (!error) return true;
    const { error: queueError } = await admin.from('auth_cleanup_queue').insert({ user_id: userId });
    if (queueError) {
      console.error('auth_cleanup_queue_insert_failed', { userId });
    }
    return false;
  }

  const limits = [
    { scope: 'password_signup_origin', key: origin, limit: 10 },
    { scope: 'password_signup_email', key: parsed.data.email, limit: 3 },
    { scope: 'password_signup_username', key: parsed.data.username, limit: 3 },
  ] as const;
  for (const limit of limits) {
    const { data, error } = await admin.rpc('consume_auth_rate_limit', {
      p_scope: limit.scope,
      p_key: createRateLimitKey(limit.key, rateLimitSecret),
      p_limit: limit.limit,
      p_window_seconds: 3600,
    });
    if (error || data !== true) redirect('/signup?error=service_unavailable');
  }

  const result = await registerPasswordAccount({
    async createAuthUser({ email, password, username }) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(completionPath)}`,
          data: { username },
        },
      });
      sessionCreated = Boolean(data.session);
      if (data.user?.identities?.length === 0) return { error: 'email_exists' as const };
      if (error || !data.user) {
        return {
          error: error?.code === 'user_already_exists' ? 'email_exists' as const : 'service_error' as const,
        };
      }
      return { userId: data.user.id };
    },
    async reserveUsername(userId, username) {
      const { error } = await admin.from('account_usernames').insert({
        user_id: userId,
        username_normalized: username,
        status: 'pending',
      });
      return !error;
    },
    async deleteAuthUser(userId) {
      return deleteCreatedUser(userId);
    },
  }, parsed.data);

  if (!result.ok) redirect(`/signup?error=${result.error}`);
  if (isCheckSignup) {
    const { error: consentError } = await admin.from('consent_acceptances').insert([
      { user_id: result.userId, document_type: 'terms', document_version: '2026-10-02', accepted: true },
      { user_id: result.userId, document_type: 'privacy', document_version: '2026-10-02', accepted: true },
    ]);
    const { error: attributionError } = await admin.from('signup_attributions').insert({
      user_id: result.userId,
      source: 'zipsin_check',
    });
    if (consentError || attributionError) {
      await deleteCreatedUser(result.userId);
      redirect(`/signup?error=service_unavailable&next=${encodeURIComponent(next)}`);
    }
  }
  redirect(sessionCreated ? completionPath : `/signup?notice=check_email${hasNext ? `&next=${encodeURIComponent(next)}` : ''}`);
}
