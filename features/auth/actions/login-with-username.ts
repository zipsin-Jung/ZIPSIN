'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { sanitizeNextPath } from '@/features/auth/domain/redirect';
import { createRateLimitKey, getRateLimitSecret } from '@/features/auth/domain/rate-limit-key';
import { loginWithUsername } from '@/features/auth/services/login-with-username';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const inputSchema = z.object({
  username: z.string().trim().min(4).max(254),
  password: z.string().min(8).max(128),
  remember: z.boolean(),
});

export async function loginWithUsernameAction(formData: FormData, nextValue?: string) {
  const parsed = inputSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
    // 로그인 유지 선택 UI는 두지 않는다(2026-10-15 사용자 지시). 값이 없으면 기존처럼 유지 세션을 사용한다.
    remember: formData.get('remember') === null ? true : formData.get('remember') === 'on',
  });
  if (!parsed.success) redirect('/login?error=invalid_credentials');

  const admin = createAdminSupabaseClient();
  const supabase = await createServerSupabaseClient({ sessionOnly: !parsed.data.remember });
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
    async resolveIdentifier(identifier) {
      if (identifier.includes('@')) return { email: identifier, status: 'active' as const };
      if (identifier.startsWith('+82')) {
        const { data } = await admin.from('profiles')
          .select('user_id, phone_verified_at')
          .eq('phone_e164', identifier)
          .not('phone_verified_at', 'is', null)
          .maybeSingle();
        return data?.phone_verified_at ? { userId: data.user_id, status: 'active' as const } : null;
      }
      const { data } = await admin.from('account_usernames')
        .select('user_id, status')
        .eq('username_normalized', identifier)
        .maybeSingle();
      return data ? { userId: data.user_id, status: data.status } : null;
    },
    async getAuthIdentity(userId) {
      const { data, error } = await admin.auth.admin.getUserById(userId);
      if (error || !data.user.email) return null;
      return { email: data.user.email, emailConfirmed: Boolean(data.user.email_confirmed_at) };
    },
    async signInWithPassword(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) return { accepted: true, userId: data.user?.id ?? null };
      // Supabase Auth는 비밀번호를 먼저 검사한 뒤 이메일 미확인을 알린다.
      return { accepted: false, userId: null, reason: error.code === 'email_not_confirmed' ? 'email_not_confirmed' as const : 'invalid_credentials' as const };
    },
    async confirmEmail(userId) {
      const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
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
