'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requestAccountRecovery as requestRecovery } from '@/features/auth/services/account-recovery';
import { createRateLimitKey, getRateLimitSecret } from '@/features/auth/domain/rate-limit-key';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const recoverySchema = z.string().trim().toLowerCase().email();
export async function requestAccountRecoveryAction(formData: FormData) {
  const parsed = recoverySchema.safeParse(formData.get('email'));
  if (!parsed.success) redirect('/account-recovery?error=invalid_email');

  const supabase = await createServerSupabaseClient();
  const admin = createAdminSupabaseClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  await requestRecovery({
    async allowAttempt(email) {
      const { data, error } = await admin.rpc('consume_auth_rate_limit', {
        p_scope: 'account_recovery',
        p_key: createRateLimitKey(email, getRateLimitSecret()),
        p_limit: 3,
        p_window_seconds: 3600,
      });
      return !error && data === true;
    },
    async sendRecoveryEmail(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent('/reset-password')}`,
      });
      if (error) throw error;
    },
  }, parsed.data);

  redirect('/account-recovery?notice=sent');
}
