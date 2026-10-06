'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requestAccountRecovery as requestRecovery } from '@/features/auth/services/account-recovery';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const recoverySchema = z.string().trim().toLowerCase().email();
const attempts = new Map<string, number>();

export async function requestAccountRecoveryAction(formData: FormData) {
  const parsed = recoverySchema.safeParse(formData.get('email'));
  if (!parsed.success) redirect('/account-recovery?error=invalid_email');

  const supabase = await createServerSupabaseClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  await requestRecovery({
    async allowAttempt(email) {
      const count = attempts.get(email) ?? 0;
      if (count >= 3) return false;
      attempts.set(email, count + 1);
      return true;
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
