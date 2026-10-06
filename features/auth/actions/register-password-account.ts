'use server';

import { redirect } from 'next/navigation';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { passwordSignupSchema } from '@/features/auth/schemas/password-signup';
import { registerPasswordAccount } from '@/features/auth/services/register-password-account';

export async function registerPasswordAccountAction(formData: FormData) {
  const parsed = passwordSignupSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
    passwordConfirm: formData.get('passwordConfirm'),
    email: formData.get('email'),
    termsAccepted: formData.get('termsAccepted') === 'on',
    privacyAccepted: formData.get('privacyAccepted') === 'on',
    ageOver14: formData.get('ageOver14') === 'on',
  });

  if (!parsed.success) redirect('/signup?error=invalid_input');

  const supabase = await createServerSupabaseClient();
  const admin = createAdminSupabaseClient();
  let sessionCreated = false;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const result = await registerPasswordAccount({
    async createAuthUser({ email, password, username }) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent('/signup/verify')}`,
          data: { username },
        },
      });
      sessionCreated = Boolean(data.session);
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
      await admin.auth.admin.deleteUser(userId);
    },
  }, parsed.data);

  if (!result.ok) redirect(`/signup?error=${result.error}`);
  redirect(sessionCreated ? '/signup/verify' : '/signup?notice=check_email');
}
