'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { sanitizeNextPath } from '@/features/auth/domain/redirect';
import { createRateLimitKey, getRateLimitSecret } from '@/features/auth/domain/rate-limit-key';
import { usernameSchema } from '@/features/auth/domain/username';
import { loginWithUsername } from '@/features/auth/services/login-with-username';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const inputSchema = z.object({
  username: usernameSchema,
  password: z.string().min(8).max(128),
});

export async function loginWithUsernameAction(formData: FormData, nextValue?: string) {
  const parsed = inputSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  });
  if (!parsed.success) redirect('/login?error=invalid_credentials');

  const admin = createAdminSupabaseClient();
  const supabase = await createServerSupabaseClient();
  const result = await loginWithUsername({
    async allowAttempt(username) {
      const { data, error } = await admin.rpc('consume_auth_rate_limit', {
        p_scope: 'username_login',
        p_key: createRateLimitKey(username, getRateLimitSecret()),
        p_limit: 8,
        p_window_seconds: 60,
      });
      return !error && data === true;
    },
    async resolveUsername(username) {
      const { data } = await admin.from('account_usernames')
        .select('user_id, status')
        .eq('username_normalized', username)
        .maybeSingle();
      return data ? { userId: data.user_id, status: data.status } : null;
    },
    async getAuthIdentity(userId) {
      const { data, error } = await admin.auth.admin.getUserById(userId);
      if (error || !data.user.email) return null;
      return { email: data.user.email, emailConfirmed: Boolean(data.user.email_confirmed_at) };
    },
    async signInWithPassword(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return !error;
    },
    async activateUsername(userId) {
      await admin.from('account_usernames').update({
        status: 'active',
        activated_at: new Date().toISOString(),
      }).eq('user_id', userId);
    },
  }, parsed.data, process.env.PASSWORD_LOGIN_ENABLED === 'true');

  if (!result.ok) redirect(`/login?error=${result.error}`);
  redirect(sanitizeNextPath(nextValue));
}
